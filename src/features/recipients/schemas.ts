import { z } from "zod";

const optionalDate = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  },
  z.coerce.date().optional()
);

export const createRecipientSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  middle_name: z.string().max(100).optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").max(100),
  contact_no: z.string().min(1, "Contact number is required").max(40),
  address: z.string().min(1, "Address is required").max(500),
  relationship_to_beneficiary: z
    .string()
    .min(1, "Relationship is required")
    .max(100),
  notes: z.string().max(1000).optional().or(z.literal("")),
  beneficiary_name: z
    .string()
    .min(1, "Beneficiary name is required")
    .max(200),
  beneficiary_birthdate: optionalDate,
  beneficiary_sex: z.string().max(30).optional().or(z.literal("")),
  beneficiary_birth_weight: z.string().max(50).optional().or(z.literal("")),
  beneficiary_gestational_age: z.string().max(50).optional().or(z.literal("")),
  beneficiary_medical_condition: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),
  beneficiary_notes: z.string().max(1000).optional().or(z.literal("")),
});

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;

export const createMilkRequestSchema = z.object({
  recipient_id: z.coerce.number().int().positive("Recipient is required"),
  beneficiary_id: z.coerce.number().int().positive("Beneficiary is required"),
  requested_volume: z.coerce
    .number({ error: "Requested volume is required" })
    .positive("Requested volume must be greater than 0"),
  reason: z.string().min(1, "Reason for request is required").max(1000),
  priority: z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]),
  needed_by: optionalDate,
  remarks: z.string().max(1000).optional().or(z.literal("")),
  profile_complete: z.coerce.boolean().default(false),
  beneficiary_complete: z.coerce.boolean().default(false),
  reason_provided: z.coerce.boolean().default(false),
  volume_entered: z.coerce.boolean().default(false),
  staff_approved: z.coerce.boolean().default(false),
});

export type CreateMilkRequestInput = z.infer<typeof createMilkRequestSchema>;
