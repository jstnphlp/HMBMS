"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { recordLabResultSchema } from "./schemas";
import type { RecordLabResultInput } from "./schemas";
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
