import { z } from "zod";

export const notesSchema = z.string().trim().max(1000).optional();

const formBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const donorScreeningSchema = z.object({
  screening_result: z.enum(["PASS", "FAIL"]),
  screening_date: z.coerce.date(),
  staff_notes: notesSchema,
});

export const donorConsentSchema = z
  .object({
    consent_signed: formBooleanSchema,
    consent_date: z.coerce.date().optional(),
    staff_notes: notesSchema,
  })
  .refine((data) => !data.consent_signed || data.consent_date, {
    path: ["consent_date"],
    message: "Consent date is required when consent is signed.",
  });

export const extractionSchema = z.object({
  extraction_completed_at: z.coerce.date(),
  extracted_volume: z.coerce.number().positive(),
  staff_notes: notesSchema,
});

export const bottlingSchema = z.object({
  bottle_no: z.string().trim().min(1),
  staff_notes: notesSchema,
});

export const coldChainSchema = z.object({
  cold_chain_started_at: z.coerce.date(),
  staff_notes: notesSchema,
});

export const preCollectionSchema = z.object({
  collection_confirmed: formBooleanSchema,
  staff_notes: notesSchema,
});

export const preSentToLabSchema = z.object({
  sample_volume: z.coerce.number().positive().max(5),
  sent_date: z.coerce.date(),
  expected_result_date: z.coerce.date().optional(),
  staff_notes: notesSchema,
});

export const labResultSchema = z.object({
  lab_result: z.enum(["PASS", "FAIL"]),
  result_received_date: z.coerce.date(),
  staff_notes: notesSchema,
});

export const pasteurizationSchema = z.object({
  pasteurization_date: z.coerce.date(),
  staff_notes: notesSchema,
});

export const postSentToLabSchema = z.object({
  sample_volume: z.coerce.number().positive().max(5),
  sent_date: z.coerce.date(),
  expected_result_date: z.coerce.date().optional(),
  staff_notes: notesSchema,
});

export type DonorScreeningInput = z.infer<typeof donorScreeningSchema>;
export type DonorConsentInput = z.infer<typeof donorConsentSchema>;
export type ExtractionInput = z.infer<typeof extractionSchema>;
export type BottlingInput = z.infer<typeof bottlingSchema>;
export type ColdChainInput = z.infer<typeof coldChainSchema>;
export type PreCollectionInput = z.infer<typeof preCollectionSchema>;
export type PreSentToLabInput = z.infer<typeof preSentToLabSchema>;
export type LabResultInput = z.infer<typeof labResultSchema>;
export type PasteurizationInput = z.infer<typeof pasteurizationSchema>;
export type PostSentToLabInput = z.infer<typeof postSentToLabSchema>;
