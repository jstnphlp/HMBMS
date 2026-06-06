"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { sendSmsSchema, type SendSmsInput } from "./schemas";

export async function sendSms(rawInput: unknown) {
  const parsed = sendSmsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: SendSmsInput = parsed.data;

  const apiKey = process.env.TEXTBEE_API_KEY;
  const deviceId = process.env.TEXTBEE_DEVICE_ID;

  if (!apiKey || !deviceId) {
    return {
      success: false,
      errors: {
        _form: [
          "SMS service is not configured. Contact your administrator.",
        ],
      },
    };
  }

  try {
    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          recipients: [input.phone_number],
          message: input.message,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("TextBee API error:", response.status, errorBody);

      await db.sMS.create({
        data: {
          beneficiary_id: input.beneficiary_id,
          message: input.message,
          status: "FAILED",
          scheduled_at: new Date(),
        },
      });

      return {
        success: false,
        errors: {
          _form: [
            `SMS delivery failed (HTTP ${response.status}). Please try again.`,
          ],
        },
      };
    }

    await db.sMS.create({
      data: {
        beneficiary_id: input.beneficiary_id,
        message: input.message,
        status: "SENT",
        scheduled_at: new Date(),
        sent_at: new Date(),
      },
    });

    revalidatePath("/dashboard/recipients");
    return { success: true, data: { message: "SMS sent successfully" } };
  } catch (error) {
    console.error("SMS send error:", error);

    await db.sMS.create({
      data: {
        beneficiary_id: input.beneficiary_id,
        message: input.message,
        status: "FAILED",
        scheduled_at: new Date(),
      },
    });

    return {
      success: false,
      errors: {
        _form: ["An unexpected error occurred while sending the SMS."],
      },
    };
  }
}
