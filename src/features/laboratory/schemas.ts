import { z } from "zod";

export const recordLabResultSchema = z.object({
  batch_id: z.coerce.number().int().positive("Batch ID is required"),
  stage: z.enum(["PRE_PASTEURIZATION", "POST_PASTEURIZATION"], {
    message: "Lab stage is required",
  }),
  result: z.enum(["PASS", "FAIL"], {
    message: "Test result is required",
  }),
  remarks: z
    .string()
    .max(500, "Remarks must be 500 characters or less")
    .optional(),
});

export type RecordLabResultInput = z.infer<typeof recordLabResultSchema>;
