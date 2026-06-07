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
