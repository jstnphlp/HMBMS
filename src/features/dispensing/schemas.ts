import { z } from "zod";

export const createDispensingSchema = z.object({
  batch_id: z.number().int().positive("Batch is required"),
  beneficiary_id: z.number().int().positive("Beneficiary is required"),
  dispensed_by: z.number().int().positive("Dispenser is required"),
  dispensing_date: z.coerce.date().default(() => new Date()),
  volume: z
    .number()
    .positive("Volume must be positive")
    .max(1200, "Max 1200mL per dispensing"),
  price: z.number().min(0, "Price must be non-negative").default(2),
  remarks: z.string().max(500).optional(),
});

export type CreateDispensingInput = z.infer<typeof createDispensingSchema>;

export const createBeneficiarySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  contact_no: z
    .string()
    .regex(/^(\+63|0)[0-9]{10}$/, "Invalid Philippine phone number"),
  remarks: z.string().max(500).optional(),
});

export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;

export const recipientDispensingSchema = z.object({
  beneficiary_id: z.number().int().positive("Recipient is required"),
  dispensing_date: z.coerce.date().default(() => new Date()),
  volume: z
    .number()
    .positive("Volume must be positive")
    .max(1200, "Max 1200mL per dispensing"),
  batch_reference: z
    .string()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  remarks: z.string().max(500).optional(),
});

export type RecipientDispensingInput = z.infer<
  typeof recipientDispensingSchema
>;
