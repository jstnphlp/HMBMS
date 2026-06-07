"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  recordLabResultSchema,
  updateBatchLabResultsSchema,
  bulkUpdateBatchStatusSchema,
} from "./schemas";
import type {
  RecordLabResultInput,
  UpdateBatchLabResultsInput,
  BulkUpdateBatchStatusInput,
} from "./schemas";
import { getCurrentUser } from "@/features/auth/actions";

export async function recordLabResult(rawInput: unknown) {
  const parsed = recordLabResultSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: RecordLabResultInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  const batch = await db.batch.findUnique({
    where: { batch_id: input.batch_id },
  });

  if (!batch) {
    return { success: false, errors: { batch_id: ["Batch not found"] } };
  }

  const existingResult = await db.labResult.findFirst({
    where: {
      batch_id: input.batch_id,
      stage: input.stage,
    },
  });

  if (existingResult) {
    const updated = await db.labResult.update({
      where: { lab_id: existingResult.lab_id },
      data: {
        result: input.result,
        colony_count: input.colony_count ?? null,
        remarks: input.remarks ?? null,
        test_date: new Date(),
        tested_by: user.user_id,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Updated ${input.stage} lab result for batch ${batch.batch_code} to ${input.result}`,
      },
    });

    revalidatePath("/dashboard/laboratory");
    return { success: true, data: updated };
  }

  const result = await db.$transaction(async (tx) => {
    const labResult = await tx.labResult.create({
      data: {
        batch_id: input.batch_id,
        stage: input.stage,
        result: input.result,
        test_date: new Date(),
        tested_by: user.user_id,
        colony_count: input.colony_count ?? null,
        remarks: input.remarks ?? null,
      },
    });

    if (input.result === "PASS" && input.stage === "PRE_PASTEURIZATION") {
      await tx.batch.update({
        where: { batch_id: input.batch_id },
        data: { status: "TESTING" },
      });
    } else if (
      input.result === "PASS" &&
      input.stage === "POST_PASTEURIZATION"
    ) {
      await tx.batch.update({
        where: { batch_id: input.batch_id },
        data: { status: "PASTEURIZED" },
      });
    } else if (input.result === "FAIL") {
      await tx.batch.update({
        where: { batch_id: input.batch_id },
        data: { status: "DISPOSED" },
      });
    }

    await tx.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Recorded ${input.stage} lab result (${input.result}) for batch ${batch.batch_code}`,
      },
    });

    return labResult;
  });

  revalidatePath("/dashboard/laboratory");
  return { success: true, data: result };
}

export async function updateBatchLabResults(rawInput: unknown) {
  const parsed = updateBatchLabResultsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: UpdateBatchLabResultsInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  const batch = await db.batch.findUnique({
    where: { batch_id: input.batch_id },
  });

  if (!batch) {
    return { success: false, errors: { batch_id: ["Batch not found"] } };
  }

  const result = await db.$transaction(async (tx) => {
    const existingResult = await tx.labResult.findFirst({
      where: {
        batch_id: input.batch_id,
        stage: input.stage,
      },
    });

    let labResult;

    if (existingResult) {
      labResult = await tx.labResult.update({
        where: { lab_id: existingResult.lab_id },
        data: {
          colony_count: input.colony_count ?? existingResult.colony_count,
          remarks: input.remarks ?? existingResult.remarks,
          test_date: new Date(),
          tested_by: user.user_id,
        },
      });
    } else {
      labResult = await tx.labResult.create({
        data: {
          batch_id: input.batch_id,
          stage: input.stage,
          result: "PENDING",
          test_date: new Date(),
          tested_by: user.user_id,
          colony_count: input.colony_count ?? null,
          remarks: input.remarks ?? null,
        },
      });
    }

    await tx.batch.update({
      where: { batch_id: input.batch_id },
      data: { status: input.status },
    });

    await tx.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Updated lab results for batch ${batch.batch_code} — colony count: ${input.colony_count ?? "N/A"}, status → ${input.status}`,
      },
    });

    return labResult;
  });

  revalidatePath("/dashboard/laboratory");
  return { success: true, data: result };
}

export async function bulkUpdateBatchStatus(rawInput: unknown) {
  const parsed = bulkUpdateBatchStatusSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: BulkUpdateBatchStatusInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  const batches = await db.batch.findMany({
    where: { batch_id: { in: input.batch_ids } },
    select: { batch_id: true, batch_code: true },
  });

  if (batches.length === 0) {
    return { success: false, errors: { batch_ids: ["No valid batches found"] } };
  }

  const foundIds = batches.map((b) => b.batch_id);

  await db.$transaction(async (tx) => {
    await tx.batch.updateMany({
      where: { batch_id: { in: foundIds } },
      data: { status: input.status },
    });

    if (input.notes) {
      for (const batchId of foundIds) {
        const existing = await tx.labResult.findFirst({
          where: { batch_id: batchId, stage: "PRE_PASTEURIZATION" },
        });

        if (existing) {
          await tx.labResult.update({
            where: { lab_id: existing.lab_id },
            data: { remarks: input.notes },
          });
        } else {
          await tx.labResult.create({
            data: {
              batch_id: batchId,
              stage: "PRE_PASTEURIZATION",
              result: "PENDING",
              test_date: new Date(),
              tested_by: user.user_id,
              remarks: input.notes,
            },
          });
        }
      }
    }

    const codes = batches.map((b) => b.batch_code).join(", ");
    await tx.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Bulk updated ${batches.length} batch(es) [${codes}] status → ${input.status}${input.notes ? `, notes: ${input.notes}` : ""}`,
      },
    });
  });

  revalidatePath("/dashboard/laboratory");
  return { success: true, data: { updated: batches.length } };
}
