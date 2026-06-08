"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { logDisposalSchema, type LogDisposalInput } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";

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

      const inventory = await tx.inventory.findUnique({
        where: { batch_id: input.batch_id },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { batch_id: input.batch_id },
          data: { available_vol: Math.max(0, inventory.available_vol - input.volume) },
        });
      }

      if (inventory && inventory.available_vol - input.volume <= 0) {
        await tx.batch.update({
          where: { batch_id: input.batch_id },
          data: { status: "DISPOSED" },
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: input.disposed_by,
          action_details: `Disposed ${input.volume} mL from batch #${input.batch_id}: ${input.reason}`,
        },
      });

      return record;
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, data: disposal };
  } catch (err) {
    console.error("[logDisposal] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}
