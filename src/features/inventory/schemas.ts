import { z } from "zod";

export const logDisposalSchema = z.object({
  batch_id: z.number().int().positive("Batch is required"),
  reason: z.string().min(1, "Reason is required").max(500),
  volume: z.number().positive("Volume must be positive"),
  disposed_by: z.number().int().positive("Disposer is required"),
  remarks: z.string().max(500).optional(),
});

export type LogDisposalInput = z.infer<typeof logDisposalSchema>;

export const recordCollectionSchema = z.object({
  donor_id: z.number().int().positive("Donor is required"),
  recorded_by: z.number().int().positive("Recorder is required"),
  program: z.enum(["SUPSUP_TODO", "MILKY_WAY", "MOMS_ACT"]),
  collection_date: z.coerce.date(),
  volume: z.number().positive("Volume must be positive").max(1200, "Max 1200mL per collection"),
});

export type RecordCollectionInput = z.infer<typeof recordCollectionSchema>;
