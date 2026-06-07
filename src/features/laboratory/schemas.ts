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
