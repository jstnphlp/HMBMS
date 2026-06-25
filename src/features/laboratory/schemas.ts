import { z } from "zod";

export const recordLabResultSchema = z.object({
  batch_id: z.coerce.number().int().positive("Batch ID is required"),
  stage: z.enum(["PRE_PASTEURIZATION", "POST_PASTEURIZATION"], {
    message: "Lab stage is required",
  }),
  result: z.enum(["PASS", "FAIL"], {
    message: "Test result is required",
  }),
  colony_count: z.coerce
    .number()
    .int()
    .min(0, "Colony count cannot be negative")
    .optional(),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or less")
    .optional(),
});

export type RecordLabResultInput = z.infer<typeof recordLabResultSchema>;

export const updateBatchLabResultsSchema = z.object({
  batch_id: z.coerce.number().int().positive("Batch ID is required"),
  stage: z.enum(["PRE_PASTEURIZATION", "POST_PASTEURIZATION"], {
    message: "Lab stage is required",
  }),
  colony_count: z.coerce
    .number()
    .int()
    .min(0, "Colony count cannot be negative")
    .optional(),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or less")
    .optional(),
  status: z.enum(["TESTING", "PASTEURIZED", "AVAILABLE", "DISPOSED"], {
    message: "Status is required",
  }),
});

export type UpdateBatchLabResultsInput = z.infer<
  typeof updateBatchLabResultsSchema
>;

export const bulkUpdateBatchStatusSchema = z
  .object({
    batch_ids: z
      .array(z.coerce.number().int().positive())
      .min(1, "At least one batch must be selected"),
    status: z
      .enum(["TESTING", "PASTEURIZED", "AVAILABLE", "DISPOSED"])
      .optional(),
    notes: z
      .string()
      .max(500, "Notes must be 500 characters or less")
      .optional(),
    pre_pasteurization_colony_count: z.coerce
      .number()
      .int()
      .min(0, "Colony count cannot be negative")
      .optional(),
    post_pasteurization_colony_count: z.coerce
      .number()
      .int()
      .min(0, "Colony count cannot be negative")
      .optional(),
  })
  .refine(
    (data) =>
      data.status != null ||
      data.notes != null ||
      data.pre_pasteurization_colony_count != null ||
      data.post_pasteurization_colony_count != null,
    { message: "At least one field must be provided to update" }
  );

export type BulkUpdateBatchStatusInput = z.infer<
  typeof bulkUpdateBatchStatusSchema
>;

export const saveLabBatchSelectionSchema = z.object({
  batch_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one collection must be selected"),
  batch_type: z.enum(["PRE_PSTR", "PSTR", "POST_PSTR"], {
    message: "Batch type is required",
  }),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

export type SaveLabBatchSelectionInput = z.infer<
  typeof saveLabBatchSelectionSchema
>;

export const bulkSetSentToLabForBatchSchema = z.object({
  collection_batch_id: z.coerce.number().int().positive("Batch ID is required"),
  stage: z.enum(["PRE_PASTEURIZATION", "POST_PASTEURIZATION"], {
    message: "Lab stage is required",
  }),
  sample_volume: z.coerce.number().positive().max(5),
  sent_date: z.coerce.date(),
  expected_result_date: z.coerce.date().optional(),
  staff_notes: z.string().trim().max(1000).optional(),
});

export type BulkSetSentToLabForBatchInput = z.infer<
  typeof bulkSetSentToLabForBatchSchema
>;

export const bulkSetLabResultForBatchSchema = z.object({
  collection_batch_id: z.coerce.number().int().positive("Batch ID is required"),
  stage: z.enum(["PRE_PASTEURIZATION", "POST_PASTEURIZATION"], {
    message: "Lab stage is required",
  }),
  lab_result: z.enum(["PASS", "FAIL"]),
  result_received_date: z.coerce.date(),
  colony_count: z.coerce
    .number()
    .int()
    .min(0, "Colony count cannot be negative")
    .optional(),
  staff_notes: z.string().trim().max(1000).optional(),
});

export type BulkSetLabResultForBatchInput = z.infer<
  typeof bulkSetLabResultForBatchSchema
>;

export const releaseCollectionFromBatchSchema = z.object({
  batchId: z.coerce.number().int().positive("Batch ID is required"),
  collectionId: z.coerce.number().int().positive("Collection ID is required"),
});

export type ReleaseCollectionFromBatchInput = z.infer<
  typeof releaseCollectionFromBatchSchema
>;

export const releaseEligibleCollectionsFromBatchSchema = z.object({
  batchId: z.coerce.number().int().positive("Batch ID is required"),
});

export type ReleaseEligibleCollectionsFromBatchInput = z.infer<
  typeof releaseEligibleCollectionsFromBatchSchema
>;
