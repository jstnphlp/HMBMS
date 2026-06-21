import { z } from "zod";

const optionalNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  },
  z.coerce.number().nonnegative().optional()
);

export const allocateMilkSchema = z.object({
  request_id: z.coerce.number().int().positive("Request is required"),
  allocations: z
    .array(
      z.object({
        batch_id: z.coerce.number().int().positive("Source is required"),
        volume: z.coerce
          .number({ error: "Volume is required" })
          .positive("Volume must be greater than 0"),
      })
    )
    .min(1, "Select at least one milk source"),
});

export type AllocateMilkInput = z.infer<typeof allocateMilkSchema>;

export const releaseMilkSchema = z.object({
  request_id: z.coerce.number().int().positive("Request is required"),
  allow_partial_release: z.coerce.boolean().default(false),
  payment_status: z.enum(["NOT_REQUIRED", "UNPAID", "PARTIAL", "PAID", "WAIVED"]),
  deposit_amount: optionalNumber,
  price_per_ml: optionalNumber,
  amount_paid: optionalNumber,
  payment_method: z.enum(["Cash", "GCash", "Card", "Other"]).optional(),
  payment_notes: z.string().max(1000).optional().or(z.literal("")),
  remarks: z.string().max(1000).optional().or(z.literal("")),
});

export type ReleaseMilkInput = z.infer<typeof releaseMilkSchema>;

export const cancelMilkRequestSchema = z.object({
  request_id: z.coerce.number().int().positive("Request is required"),
  cancellation_reason: z.string().min(1, "Cancellation reason is required").max(1000),
});

export type CancelMilkRequestInput = z.infer<typeof cancelMilkRequestSchema>;
