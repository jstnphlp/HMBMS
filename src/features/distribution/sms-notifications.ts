import "server-only";

import { db } from "@/core/db";
import {
  normalizePhilippineMobileNumber,
  sendTextBeeSms,
} from "@/features/sms/textbee";

const MILK_READY_NOTIFICATION_TYPE = "MILK_READY_FOR_RELEASE";
const TEXTBEE_PROVIDER = "TEXTBEE";

type ReadyForReleaseRequest = {
  request_id: number;
  request_no: string | null;
  recipient_id: number;
  beneficiary_id: number;
  recipient: {
    contact_no: string | null;
  };
};

export type MilkReadySmsResult =
  | { status: "SENT"; message: string }
  | { status: "FAILED"; message: string; error: string }
  | { status: "SKIPPED"; message: string };

function milkReadyMessage(requestNo?: string | null) {
  if (requestNo) {
    return `Makati HMB: Your milk request ${requestNo} is ready for release. Please visit the milk bank. Thank you.`;
  }

  return "Makati HMB: Your milk request is ready for release. Please visit the milk bank. Thank you.";
}

export async function sendMilkReadySms(
  request: ReadyForReleaseRequest,
  options: { allowResend?: boolean } = {}
): Promise<MilkReadySmsResult> {
  if (!options.allowResend) {
    const existingSent = await db.sMS.findFirst({
      where: {
        milk_request_id: request.request_id,
        provider: TEXTBEE_PROVIDER,
        notification_type: MILK_READY_NOTIFICATION_TYPE,
        status: "SENT",
      },
      select: { sms_id: true },
    });

    if (existingSent) {
      return {
        status: "SKIPPED",
        message: "Milk allocated successfully. SMS notification was already sent.",
      };
    }
  }

  const phoneNumber = normalizePhilippineMobileNumber(request.recipient.contact_no);
  const message = milkReadyMessage(request.request_no);

  if (!phoneNumber) {
    await db.sMS.create({
      data: {
        beneficiary_id: request.beneficiary_id,
        recipient_id: request.recipient_id,
        milk_request_id: request.request_id,
        phone_number: request.recipient.contact_no,
        message,
        status: "FAILED",
        provider: TEXTBEE_PROVIDER,
        notification_type: MILK_READY_NOTIFICATION_TYPE,
        error_message: "Missing or invalid recipient contact number.",
        scheduled_at: new Date(),
      },
    });

    return {
      status: "FAILED",
      message: "Milk allocated successfully, but SMS notification failed.",
      error: "Missing or invalid recipient contact number.",
    };
  }

  const smsLog = await db.sMS.create({
    data: {
      beneficiary_id: request.beneficiary_id,
      recipient_id: request.recipient_id,
      milk_request_id: request.request_id,
      phone_number: phoneNumber,
      message,
      status: "PENDING",
      provider: TEXTBEE_PROVIDER,
      notification_type: MILK_READY_NOTIFICATION_TYPE,
      scheduled_at: new Date(),
    },
    select: { sms_id: true },
  });

  const sent = await sendTextBeeSms({ phoneNumber, message });

  if (!sent.success) {
    await db.sMS.update({
      where: { sms_id: smsLog.sms_id },
      data: {
        status: "FAILED",
        error_message: sent.error,
      },
    });

    return {
      status: "FAILED",
      message: "Milk allocated successfully, but SMS notification failed.",
      error: sent.error,
    };
  }

  await db.sMS.update({
    where: { sms_id: smsLog.sms_id },
    data: {
      status: "SENT",
      sent_at: new Date(),
    },
  });

  return {
    status: "SENT",
    message: "Milk allocated successfully. SMS notification sent.",
  };
}

export function mapSmsStatus(
  smsLogs: { status: string; provider: string; notification_type: string | null }[]
) {
  const milkReadyLogs = smsLogs.filter(
    (sms) =>
      sms.provider === TEXTBEE_PROVIDER &&
      sms.notification_type === MILK_READY_NOTIFICATION_TYPE
  );

  if (milkReadyLogs.some((sms) => sms.status === "SENT")) return "SMS Sent";
  if (milkReadyLogs.some((sms) => sms.status === "FAILED")) return "SMS Failed";
  return "SMS Not Sent";
}
