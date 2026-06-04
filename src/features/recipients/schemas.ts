import { z } from "zod";

export const createRecipientSchema = z.object({
  contact_no: z
    .string()
    .min(1, "Contact number is required")
    .regex(
      /^(\+63|0)[0-9]{10}$/,
      "Invalid Philippine phone number format (e.g., 09171234567)"
    ),
  remarks: z.string().max(500).optional(),
});

export const updateRecipientSchema = z.object({
  contact_no: z
    .string()
    .min(1, "Contact number is required")
    .regex(
      /^(\+63|0)[0-9]{10}$/,
      "Invalid Philippine phone number format"
    ),
  remarks: z.string().max(500).optional(),
});

export const milkRequestSchema = z.object({
  beneficiary_id: z.number().positive("Recipient is required"),
  volume: z
    .number()
    .positive("Volume must be positive")
    .max(1200, "Volume cannot exceed 1200 mL per request"),
  batch_id: z.number().positive("Batch selection is required"),
  dispensed_by: z.number().positive("Dispenser is required"),
  price: z.number().min(0, "Price cannot be negative"),
  remarks: z.string().max(500).optional(),
});

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
export type UpdateRecipientInput = z.infer<typeof updateRecipientSchema>;
export type MilkRequestInput = z.infer<typeof milkRequestSchema>;
