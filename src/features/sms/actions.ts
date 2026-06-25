"use server";

import { db } from "@/core/db";
import { sendSmsSchema, type SendSmsInput } from "./schemas";
import { normalizePhilippineMobileNumber, sendTextBeeSms } from "./textbee";

export async function sendSms(rawInput: unknown) {
  const parsed = sendSmsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: SendSmsInput = parsed.data;
  const phoneNumber = normalizePhilippineMobileNumber(input.phone_number);

  if (!phoneNumber) {
    return {
      success: false,
      errors: {
        phone_number: ["Invalid Philippine phone number format."],
      },
    };
  }

  try {
    const sent = await sendTextBeeSms({
      phoneNumber,
      message: input.message,
    });

    if (!sent.success) {
      console.error("TextBee API error:", sent.error);

      await db.sMS.create({
        data: {
          beneficiary_id: input.beneficiary_id,
          phone_number: phoneNumber,
          message: input.message,
          status: "FAILED",
          provider: "TEXTBEE",
          error_message: sent.error,
          scheduled_at: new Date(),
        },
      });

      return {
        success: false,
        errors: {
          _form: ["SMS delivery failed. Please try again."],
        },
      };
    }

    await db.sMS.create({
      data: {
        beneficiary_id: input.beneficiary_id,
        phone_number: phoneNumber,
        message: input.message,
        status: "SENT",
        provider: "TEXTBEE",
        scheduled_at: new Date(),
        sent_at: new Date(),
      },
    });

    return { success: true, data: { message: "SMS sent successfully" } };
  } catch (error) {
    console.error("SMS send error:", error);

    await db.sMS.create({
      data: {
        beneficiary_id: input.beneficiary_id,
        phone_number: phoneNumber,
        message: input.message,
        status: "FAILED",
        provider: "TEXTBEE",
        error_message: error instanceof Error ? error.message : "SMS send error.",
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
