"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { logDisposalSchema, type LogDisposalInput } from "./schemas";

export async function logDisposal(rawInput: unknown) {
  const parsed = logDisposalSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: LogDisposalInput = parsed.data;

  try {
    const disposal = await db.$transaction(async (tx) => {
      const record = await tx.disposal.create({
        data: {
          batch_id: input.batch_id,
          disposal_date: new Date(),
          reason: input.reason,
          volume: input.volume,
          disposed_by: input.disposed_by,
          remarks: input.remarks,
        },
      });

      // Update inventory available volume
      const inventory = await tx.inventory.findUnique({
        where: { batch_id: input.batch_id },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { batch_id: input.batch_id },
          data: { available_vol: Math.max(0, inventory.available_vol - input.volume) },
        });
      }

      // Mark batch as disposed if fully disposed
      if (inventory && inventory.available_vol - input.volume <= 0) {
        await tx.batch.update({
          where: { batch_id: input.batch_id },
          data: { status: "DISPOSED" },
        });
      }

      return record;
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: disposal };
  } catch {
    return {
      success: false,
      errors: { _form: ["Failed to log disposal. Please try again."] },
    };
  }
}
