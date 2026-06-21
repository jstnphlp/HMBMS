"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  recordLabResultSchema,
  updateBatchLabResultsSchema,
  bulkUpdateBatchStatusSchema,
  saveLabBatchSelectionSchema,
} from "./schemas";
import type {
  RecordLabResultInput,
  UpdateBatchLabResultsInput,
  BulkUpdateBatchStatusInput,
  SaveLabBatchSelectionInput,
} from "./schemas";
import { getCurrentUser } from "@/features/auth/actions";
import type { Prisma } from "@/generated/prisma/client";
import {
  getBatchEligibility,
  getLabBatchTypeMeta,
  type LabBatchType,
} from "./batch-eligibility";

type Tx = Prisma.TransactionClient;
const ACTIVE_COLLECTION_BATCH_STATUSES = ["ACTIVE", "IN_PROGRESS"] as const;

function revalidateLabSurfaces() {
  revalidatePath("/dashboard/laboratory");
  revalidatePath("/dashboard/donors");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/dispensing");
}

async function syncSupsupWorkflowLabResult({
  tx,
  batchId,
  stage,
  result,
  userId,
  testDate,
  remarks,
}: {
  tx: Tx;
  batchId: number;
  stage: "PRE_PASTEURIZATION" | "POST_PASTEURIZATION";
  result: "PASS" | "FAIL";
  userId: number;
  testDate: Date;
  remarks?: string;
}) {
  const workflow = await tx.supsupTodoDonationWorkflow.findUnique({
    where: { batch_id: batchId },
    include: { collection: true },
  });

  if (!workflow) return;

  const batch = await tx.batch.findUnique({
    where: { batch_id: batchId },
    select: { remaining_volume: true, total_volume: true },
  });
  const originalVolume = workflow.extracted_volume ?? workflow.collection?.volume ?? batch?.total_volume ?? 0;
  const remainingVolume = batch?.remaining_volume ?? originalVolume;

  if (stage === "PRE_PASTEURIZATION") {
    await tx.batch.update({
      where: { batch_id: batchId },
      data: { status: result === "PASS" ? "TESTING" : "DISPOSED" },
    });

    if (result === "FAIL") {
      const existingDisposal = await tx.disposal.findFirst({
        where: { batch_id: batchId, reason: "PRE_LAB_FAILED" },
      });
      const disposalData = {
        disposal_date: testDate,
        volume: remainingVolume,
        disposed_by: userId,
        remarks: remarks ?? null,
      };
      if (existingDisposal) {
        await tx.disposal.update({
          where: { disposal_id: existingDisposal.disposal_id },
          data: disposalData,
        });
      } else {
        await tx.disposal.create({
          data: {
            batch_id: batchId,
            reason: "PRE_LAB_FAILED",
            ...disposalData,
          },
        });
      }
    }

    await tx.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflow.workflow_id },
      data: {
        pre_lab_result: result,
        pre_lab_received_at: testDate,
        pre_lab_notes: remarks ?? null,
        final_status: result === "PASS" ? "READY_FOR_PASTEURIZATION" : "PRE_LAB_FAILED",
        current_step: result === "PASS" ? "PASTEURIZATION" : "DISPOSED",
        updated_by: userId,
      },
    });
    return;
  }

  await tx.batch.update({
    where: { batch_id: batchId },
    data: { status: result === "PASS" ? "AVAILABLE" : "DISPOSED" },
  });

  if (result === "PASS") {
    await tx.inventory.upsert({
      where: { batch_id: batchId },
      update: {
        donated_vol: originalVolume,
        pasteurized_vol: remainingVolume,
        available_vol: remainingVolume,
        updated_by: userId,
      },
      create: {
        batch_id: batchId,
        donated_vol: originalVolume,
        pasteurized_vol: remainingVolume,
        available_vol: remainingVolume,
        updated_by: userId,
      },
    });
  } else {
    const existingDisposal = await tx.disposal.findFirst({
      where: { batch_id: batchId, reason: "POST_LAB_FAILED" },
    });
    const disposalData = {
      disposal_date: testDate,
      volume: remainingVolume,
      disposed_by: userId,
      remarks: remarks ?? null,
    };
    if (existingDisposal) {
      await tx.disposal.update({
        where: { disposal_id: existingDisposal.disposal_id },
        data: disposalData,
      });
    } else {
      await tx.disposal.create({
        data: {
          batch_id: batchId,
          reason: "POST_LAB_FAILED",
          ...disposalData,
        },
      });
    }
  }

  await tx.supsupTodoDonationWorkflow.update({
    where: { workflow_id: workflow.workflow_id },
    data: {
      post_lab_result: result,
      post_lab_received_at: testDate,
      post_lab_notes: remarks ?? null,
      final_status: result === "PASS" ? "READY_FOR_DISPENSING" : "POST_LAB_FAILED",
      current_step: result === "PASS" ? "COMPLETED" : "DISPOSED",
      updated_by: userId,
    },
  });
}

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
    const testDate = new Date();
    const updated = await db.$transaction(async (tx) => {
      const labResult = await tx.labResult.update({
        where: { lab_id: existingResult.lab_id },
        data: {
          result: input.result,
          colony_count: input.colony_count ?? null,
          remarks: input.remarks ?? null,
          test_date: testDate,
          tested_by: user.user_id,
        },
      });

      await syncSupsupWorkflowLabResult({
        tx,
        batchId: input.batch_id,
        stage: input.stage,
        result: input.result,
        userId: user.user_id,
        testDate,
        remarks: input.remarks,
      });

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Updated ${input.stage} lab result for batch ${batch.batch_code} to ${input.result}`,
        },
      });

      return labResult;
    });

    revalidateLabSurfaces();
    return { success: true, data: updated };
  }

  const result = await db.$transaction(async (tx) => {
    const testDate = new Date();
    const labResult = await tx.labResult.create({
      data: {
        batch_id: input.batch_id,
        stage: input.stage,
        result: input.result,
        test_date: testDate,
        tested_by: user.user_id,
        colony_count: input.colony_count ?? null,
        remarks: input.remarks ?? null,
      },
    });

    await syncSupsupWorkflowLabResult({
      tx,
      batchId: input.batch_id,
      stage: input.stage,
      result: input.result,
      userId: user.user_id,
      testDate,
      remarks: input.remarks,
    });

    await tx.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Recorded ${input.stage} lab result (${input.result}) for batch ${batch.batch_code}`,
      },
    });

    return labResult;
  });

  revalidateLabSurfaces();
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

  revalidateLabSurfaces();
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
    if (input.status) {
      await tx.batch.updateMany({
        where: { batch_id: { in: foundIds } },
        data: { status: input.status },
      });
    }

    const hasPreColony = input.pre_pasteurization_colony_count != null;
    const hasPostColony = input.post_pasteurization_colony_count != null;
    const hasNotes = !!input.notes;
    const hasAnyLabData = hasPreColony || hasPostColony || hasNotes;

    if (hasAnyLabData) {
      for (const batchId of foundIds) {
        if (hasPreColony || hasNotes) {
          const existingPre = await tx.labResult.findFirst({
            where: { batch_id: batchId, stage: "PRE_PASTEURIZATION" },
          });

          const preData = {
            colony_count: hasPreColony
              ? input.pre_pasteurization_colony_count!
              : existingPre?.colony_count ?? null,
            remarks: hasNotes ? input.notes! : existingPre?.remarks ?? null,
            test_date: new Date(),
            tested_by: user.user_id,
          };

          if (existingPre) {
            await tx.labResult.update({
              where: { lab_id: existingPre.lab_id },
              data: preData,
            });
          } else {
            await tx.labResult.create({
              data: {
                batch_id: batchId,
                stage: "PRE_PASTEURIZATION",
                result: "PENDING",
                ...preData,
              },
            });
          }
        }

        if (hasPostColony) {
          const existingPost = await tx.labResult.findFirst({
            where: { batch_id: batchId, stage: "POST_PASTEURIZATION" },
          });

          if (existingPost) {
            await tx.labResult.update({
              where: { lab_id: existingPost.lab_id },
              data: {
                colony_count: input.post_pasteurization_colony_count!,
                test_date: new Date(),
                tested_by: user.user_id,
              },
            });
          } else {
            await tx.labResult.create({
              data: {
                batch_id: batchId,
                stage: "POST_PASTEURIZATION",
                result: "PENDING",
                test_date: new Date(),
                tested_by: user.user_id,
                colony_count: input.post_pasteurization_colony_count!,
              },
            });
          }
        }
      }
    }

    const codes = batches.map((b) => b.batch_code).join(", ");
    const detailParts = [
      input.status ? `status → ${input.status}` : "",
      hasPreColony ? `pre-colony: ${input.pre_pasteurization_colony_count}` : "",
      hasPostColony ? `post-colony: ${input.post_pasteurization_colony_count}` : "",
      hasNotes ? `notes: ${input.notes}` : "",
    ].filter(Boolean);
    const detailSuffix = detailParts.length > 0 ? ` — ${detailParts.join(", ")}` : "";

    await tx.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Bulk updated ${batches.length} batch(es) [${codes}]${detailSuffix}`,
      },
    });
  });

  revalidateLabSurfaces();
  return { success: true, data: { updated: batches.length } };
}

export async function saveLabBatchSelection(rawInput: unknown) {
  const parsed = saveLabBatchSelectionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: SaveLabBatchSelectionInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  const requestedIds = Array.from(new Set(input.batch_ids));
  const selectedBatches = await db.batch.findMany({
    where: { batch_id: { in: requestedIds } },
    include: {
      collections: {
        include: {
          donor: { select: { first_name: true, last_name: true } },
        },
      },
      labResults: {
        orderBy: { test_date: "desc" },
        select: {
          stage: true,
          result: true,
          test_date: true,
          remarks: true,
        },
      },
      supSupTodoWorkflow: {
        include: {
          collection: {
            select: {
              ctn: true,
              tracking_no: true,
              volume: true,
              program: true,
              collection_date: true,
              batch: { select: { batch_code: true, status: true } },
            },
          },
          batch: { select: { batch_code: true, status: true } },
        },
      },
    },
  });

  if (selectedBatches.length !== requestedIds.length) {
    return {
      success: false,
      errors: {
        batch_ids: [
          "Some selected collections are no longer eligible for this batch. Refresh and try again.",
        ],
      },
    };
  }

  const batchType = input.batch_type as LabBatchType;
  const selected = selectedBatches.map((batch) => {
    const prePast = batch.labResults.find(
      (lr) => lr.stage === "PRE_PASTEURIZATION"
    );
    const postPast = batch.labResults.find(
      (lr) => lr.stage === "POST_PASTEURIZATION"
    );
    const collection = batch.collections[0];
    const donorNames = Array.from(
      new Set(
        batch.collections.map(
          (c) => `${c.donor.first_name} ${c.donor.last_name}`
        )
      )
    );

    return {
      row_type: "individual" as const,
      row_id: `individual-${batch.batch_id}`,
      batch_id: batch.batch_id,
      batch_code: batch.batch_code,
      display_id:
        batch.supSupTodoWorkflow?.tracking_no ??
        collection?.tracking_no ??
        batch.batch_code,
      tracking_no:
        batch.supSupTodoWorkflow?.tracking_no ?? collection?.tracking_no ?? null,
      pooling_date: batch.pooling_date,
      total_volume: batch.total_volume,
      remaining_volume: batch.remaining_volume,
      status: batch.status,
      program: collection?.program ?? null,
      donor_name:
        donorNames.length === 0
          ? "--"
          : donorNames.length === 1
            ? donorNames[0]
            : "Multiple donors",
      collection_count: batch.collections.length,
      pre_pasteurization: prePast
        ? {
            result: prePast.result,
            test_date: prePast.test_date,
            remarks: prePast.remarks,
          }
        : null,
      post_pasteurization: postPast
        ? {
            result: postPast.result,
            test_date: postPast.test_date,
            remarks: postPast.remarks,
          }
        : null,
      supSupTodoWorkflow: batch.supSupTodoWorkflow
        ? { ...batch.supSupTodoWorkflow, sample_no: batch.supSupTodoWorkflow.sample_sequence }
        : null,
    };
  });

  const invalid = selected.filter(
    (batch) => !getBatchEligibility(batch, batchType)
  );

  if (invalid.length > 0) {
    return {
      success: false,
      errors: {
        batch_ids: [
          "Some selected collections are no longer eligible for this batch. Refresh and try again.",
        ],
      },
    };
  }

  const collectionIds = selectedBatches.flatMap((batch) =>
    batch.collections.map((collection) => collection.ctn)
  );

  if (collectionIds.length !== requestedIds.length) {
    return {
      success: false,
      errors: {
        batch_ids: [
          "Every selected row must be an individual CTN with a linked collection.",
        ],
      },
    };
  }

  const conflict = await db.collectionBatchItem.findFirst({
    where: {
      collection_id: { in: collectionIds },
      batch: {
        batch_type: batchType,
        status: { in: [...ACTIVE_COLLECTION_BATCH_STATUSES] },
      },
    },
    include: { batch: true },
  });

  if (conflict) {
    return {
      success: false,
      errors: {
        batch_ids: [
          `${conflict.ctn} is already assigned to active batch ${conflict.batch.batch_no}.`,
        ],
      },
    };
  }

  const meta = getLabBatchTypeMeta(batchType);
  const prefix = `BATCH-${meta.auditPrefix}`;
  let createdBatch:
    | { id: number; batch_no: string; itemCount: number }
    | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      createdBatch = await db.$transaction(async (tx) => {
        const retryConflict = await tx.collectionBatchItem.findFirst({
          where: {
            collection_id: { in: collectionIds },
            batch: {
              batch_type: batchType,
              status: { in: [...ACTIVE_COLLECTION_BATCH_STATUSES] },
            },
          },
          include: { batch: true },
        });

        if (retryConflict) {
          throw new Error(
            `${retryConflict.ctn} is already assigned to active batch ${retryConflict.batch.batch_no}.`
          );
        }

        const latest = await tx.collectionBatch.findFirst({
          where: { batch_type: batchType },
          orderBy: { id: "desc" },
          select: { batch_no: true },
        });
        const latestSequence = latest?.batch_no.match(/-(\d{4})$/)?.[1];
        const nextSequence = (latestSequence ? Number(latestSequence) : 0) + 1;
        const batchNo = `${prefix}-${String(nextSequence).padStart(4, "0")}`;

        const batch = await tx.collectionBatch.create({
          data: {
            batch_no: batchNo,
            batch_type: batchType,
            status: "ACTIVE",
            created_by: user.user_id,
            notes: input.notes ?? null,
            items: {
              create: selectedBatches.flatMap((processingBatch) =>
                processingBatch.collections.map((collection) => ({
                  collection_id: collection.ctn,
                  workflow_id:
                    processingBatch.supSupTodoWorkflow?.workflow_id ?? null,
                  ctn:
                    collection.tracking_no ??
                    processingBatch.supSupTodoWorkflow?.tracking_no ??
                    `CTN-${collection.ctn.toString().padStart(4, "0")}`,
                }))
              ),
            },
          },
          select: { id: true, batch_no: true, _count: { select: { items: true } } },
        });

        const ctns = selected
          .map((batch) => batch.tracking_no ?? batch.batch_code)
          .join(", ");

        await tx.auditLog.create({
          data: {
            user_id: user.user_id,
            action_details: `Created ${meta.label} saved batch ${batch.batch_no} for ${selected.length} collection(s): ${ctns}${input.notes ? ` - ${input.notes}` : ""}`,
          },
        });

        return {
          id: batch.id,
          batch_no: batch.batch_no,
          itemCount: batch._count.items,
        };
      });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already assigned to active batch")) {
        return { success: false, errors: { batch_ids: [message] } };
      }
      if (attempt === 2) throw error;
    }
  }

  if (!createdBatch) {
    return {
      success: false,
      errors: { batch_ids: ["Unable to create batch. Try again."] },
    };
  }

  revalidateLabSurfaces();
  return {
    success: true,
    data: {
      batch_action_id: createdBatch.batch_no,
      batch_no: createdBatch.batch_no,
      selected: createdBatch.itemCount,
    },
  };
}
