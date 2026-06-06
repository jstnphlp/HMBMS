import { z } from "zod";

export const sendSmsSchema = z.object({
  beneficiary_id: z.number().int().positive("Recipient is required"),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+63|0)[0-9]{10}$/,
      "Invalid Philippine phone number format (e.g., 09171234567)"
    ),
  message: z
    .string()
    .min(1, "Message is required")
    .max(160, "Message cannot exceed 160 characters"),
});

export type SendSmsInput = z.infer<typeof sendSmsSchema>;
