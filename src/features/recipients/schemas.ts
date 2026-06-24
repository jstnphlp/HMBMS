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

export const updateRecipientSchema = createRecipientSchema
  .pick({
    first_name: true,
    middle_name: true,
    last_name: true,
    contact_no: true,
    address: true,
    relationship_to_beneficiary: true,
    notes: true,
  })
  .extend({
    recipient_id: z.coerce.number().int().positive("Recipient is required"),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  });

export type UpdateRecipientInput = z.infer<typeof updateRecipientSchema>;

export const beneficiarySchema = z.object({
  recipient_id: z.coerce.number().int().positive("Recipient is required"),
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

export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;

export const updateBeneficiarySchema = beneficiarySchema.extend({
  beneficiary_id: z.coerce.number().int().positive("Beneficiary is required"),
});

export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;

const optionalVolume = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return 0;
    return val;
  },
  z.coerce.number().min(0, "Requested volume cannot be negative")
);

export const createMilkRequestSchema = z.object({
  recipient_id: z.coerce.number().int().positive("Recipient is required"),
  beneficiary_id: z.coerce.number().int().positive("Beneficiary is required"),
  requested_volume: optionalVolume,
  reason: z.string().max(1000).optional().or(z.literal("")),
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

export const updateMilkRequestSchema = createMilkRequestSchema.extend({
  request_id: z.coerce.number().int().positive("Request is required"),
});

export type UpdateMilkRequestInput = z.infer<typeof updateMilkRequestSchema>;

export const cancelRecipientMilkRequestSchema = z.object({
  request_id: z.coerce.number().int().positive("Request is required"),
  cancellation_reason: z.string().min(1, "Cancellation reason is required").max(1000),
});
