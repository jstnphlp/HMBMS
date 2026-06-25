"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  recordLabResultSchema,
  updateBatchLabResultsSchema,
  bulkUpdateBatchStatusSchema,
  saveLabBatchSelectionSchema,
  bulkSetLabResultForBatchSchema,
  bulkSetSentToLabForBatchSchema,
  releaseCollectionFromBatchSchema,
  releaseEligibleCollectionsFromBatchSchema,
} from "./schemas";
import type {
  BulkSetLabResultForBatchInput,
  BulkSetSentToLabForBatchInput,
  RecordLabResultInput,
  ReleaseCollectionFromBatchInput,
  ReleaseEligibleCollectionsFromBatchInput,
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
const BLOCKED_BATCH_STATUSES = new Set(["AVAILABLE", "DISPOSED", "DISPENSED"]);
const BLOCKED_WORKFLOW_STATUSES = new Set([
  "PRE_LAB_FAILED",
  "POST_LAB_FAILED",
  "DISPOSED",
]);
const NO_ELIGIBLE_RELEASE_MESSAGE =
  "No eligible collections are ready to release from this batch.";

function revalidateLabSurfaces() {
  revalidatePath("/dashboard/laboratory");
  revalidatePath("/dashboard/donors");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/dispensing");
}

function expectedDate(sentDate: Date, explicit?: Date) {
  if (explicit) return explicit;
  const date = new Date(sentDate);
  date.setDate(date.getDate() + 14);
  return date;
}

function nextRemainingVolume({
  currentRemaining,
  currentTotal,
  newSampleVolume,
  previousSampleVolume,
}: {
  currentRemaining: number | null | undefined;
  currentTotal: number | null | undefined;
  newSampleVolume: number;
  previousSampleVolume: number | null | undefined;
}) {
  const baseline = currentRemaining ?? currentTotal ?? 0;
  const delta = newSampleVolume - (previousSampleVolume ?? 0);
  const next = baseline - delta;

  if (next < 0) {
    throw new Error("Sample volume cannot exceed the remaining usable milk volume.");
  }

  return next;
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
              bottle_no: true,
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
      item_status: "ACTIVE",
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
            item_status: "ACTIVE",
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

function stageForBatchType(batchType: LabBatchType) {
  if (batchType === "PRE_PSTR") return "PRE_PASTEURIZATION";
  if (batchType === "POST_PSTR") return "POST_PASTEURIZATION";
  return null;
}

function ctnLabel(item: { ctn: string; collection: { tracking_no: string | null } }) {
  return item.collection.tracking_no ?? item.ctn;
}

type BatchItemForRelease = Prisma.CollectionBatchItemGetPayload<{
  include: {
    collection: true;
    workflow: { include: { collection: true; batch: true } };
  };
}>;

function isEligibleForBatchRelease(
  item: BatchItemForRelease,
  batchType: LabBatchType
) {
  const workflow = item.workflow;
  if (item.item_status === "RELEASED") return false;
  if (!workflow || !workflow.batch_id) return false;

  if (batchType === "PRE_PSTR") {
    return workflow.pre_lab_result === "PASS" || workflow.pre_lab_result === "FAIL";
  }

  if (batchType === "PSTR") {
    return workflow.pre_lab_result === "PASS" && workflow.pasteurization_confirmed;
  }

  return workflow.post_lab_result === "PASS" || workflow.post_lab_result === "FAIL";
}

async function createOrUpdateDisposal({
  tx,
  batchId,
  reason,
  volume,
  userId,
}: {
  tx: Tx;
  batchId: number;
  reason: string;
  volume: number;
  userId: number;
}) {
  const existing = await tx.disposal.findFirst({
    where: { batch_id: batchId, reason },
  });
  const data = {
    disposal_date: new Date(),
    volume,
    disposed_by: userId,
    remarks: "Released from batch as failed.",
  };

  if (existing) {
    await tx.disposal.update({
      where: { disposal_id: existing.disposal_id },
      data,
    });
    return;
  }

  await tx.disposal.create({
    data: {
      batch_id: batchId,
      reason,
      ...data,
    },
  });
}

async function applyReleaseTransition({
  tx,
  item,
  batchType,
  userId,
}: {
  tx: Tx;
  item: BatchItemForRelease;
  batchType: LabBatchType;
  userId: number;
}): Promise<{ result: "PASS" | "FAIL" | "COMPLETED"; destination: string }> {
  const workflow = item.workflow;
  if (!workflow || !workflow.batch_id || !workflow.batch) {
    throw new Error(`${ctnLabel(item)} has no linked workflow tracker.`);
  }

  const batchId = workflow.batch_id;
  const remainingVolume =
    workflow.batch.remaining_volume ??
    workflow.extracted_volume ??
    workflow.collection?.volume ??
    item.collection.volume;
  const originalVolume =
    workflow.extracted_volume ?? workflow.collection?.volume ?? item.collection.volume;

  if (batchType === "PRE_PSTR") {
    if (workflow.pre_lab_result === "PASS") {
      await tx.batch.update({
        where: { batch_id: batchId },
        data: { status: "TESTING" },
      });
      await tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflow.workflow_id },
        data: {
          final_status: "READY_FOR_PASTEURIZATION",
          current_step: "PASTEURIZATION",
          updated_by: userId,
        },
      });
      return { result: "PASS", destination: "Ready for Pasteurization" };
    }

    if (workflow.pre_lab_result === "FAIL") {
      await tx.batch.update({
        where: { batch_id: batchId },
        data: { status: "DISPOSED" },
      });
      await createOrUpdateDisposal({
        tx,
        batchId,
        reason: "PRE_LAB_FAILED",
        volume: remainingVolume,
        userId,
      });
      await tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflow.workflow_id },
        data: {
          final_status: "PRE_LAB_FAILED",
          current_step: "DISPOSED",
          updated_by: userId,
        },
      });
      return { result: "FAIL", destination: "To Dispose" };
    }
  }

  if (batchType === "PSTR") {
    if (!workflow.pasteurization_confirmed) {
      throw new Error(`${ctnLabel(item)} is not ready to release from PSTR batch.`);
    }
    await tx.batch.update({
      where: { batch_id: batchId },
      data: { status: "PASTEURIZED" },
    });
    await tx.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflow.workflow_id },
      data: {
        final_status: "READY_FOR_STORAGE",
        current_step: "POST_SENT_TO_LAB",
        updated_by: userId,
      },
    });
    return { result: "COMPLETED", destination: "Ready for POST-PSTR Lab Test" };
  }

  if (workflow.post_lab_result === "PASS") {
    await tx.batch.update({
      where: { batch_id: batchId },
      data: { status: "AVAILABLE" },
    });
    await tx.collection.update({
      where: { ctn: item.collection_id },
      data: { status: "READY_FOR_DISPENSING", is_pasteurized: true },
    });
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
    await tx.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflow.workflow_id },
      data: {
        final_status: "READY_FOR_DISPENSING",
        current_step: "COMPLETED",
        updated_by: userId,
      },
    });
    return { result: "PASS", destination: "Available" };
  }

  if (workflow.post_lab_result === "FAIL") {
    await tx.batch.update({
      where: { batch_id: batchId },
      data: { status: "DISPOSED" },
    });
    await createOrUpdateDisposal({
      tx,
      batchId,
      reason: "POST_LAB_FAILED",
      volume: remainingVolume,
      userId,
    });
    await tx.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflow.workflow_id },
      data: {
        final_status: "POST_LAB_FAILED",
        current_step: "DISPOSED",
        updated_by: userId,
      },
    });
    return { result: "FAIL", destination: "To Dispose" };
  }

  throw new Error(`${ctnLabel(item)} is not eligible for release from batch.`);
}

async function updateCollectionBatchAfterRelease(tx: Tx, collectionBatchId: number) {
  const remaining = await tx.collectionBatchItem.count({
    where: { batch_id: collectionBatchId, item_status: "ACTIVE" },
  });
  const released = await tx.collectionBatchItem.count({
    where: { batch_id: collectionBatchId, item_status: "RELEASED" },
  });

  await tx.collectionBatch.update({
    where: { id: collectionBatchId },
    data: {
      status:
        remaining === 0
          ? "COMPLETED"
          : released > 0
            ? "IN_PROGRESS"
            : "IN_PROGRESS",
    },
  });

  return { remaining, released };
}

export async function releaseCollectionFromBatch(rawInput: unknown) {
  const parsed = releaseCollectionFromBatchSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: ReleaseCollectionFromBatchInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const collectionBatch = await tx.collectionBatch.findUnique({
        where: { id: input.batchId },
        select: { id: true, batch_no: true, batch_type: true, status: true },
      });

      if (!collectionBatch) throw new Error("Batch not found.");
      if (
        collectionBatch.status !== "ACTIVE" &&
        collectionBatch.status !== "IN_PROGRESS"
      ) {
        throw new Error("Batch is no longer active.");
      }

      const item = await tx.collectionBatchItem.findUnique({
        where: {
          batch_id_collection_id: {
            batch_id: input.batchId,
            collection_id: input.collectionId,
          },
        },
        include: {
          collection: true,
          workflow: { include: { collection: true, batch: true } },
        },
      });

      if (!item) {
        throw new Error("Collection no longer belongs to this batch.");
      }
      if (item.item_status === "RELEASED") {
        throw new Error(`${ctnLabel(item)} has already been released from this batch.`);
      }

      const batchType = collectionBatch.batch_type as LabBatchType;
      if (!isEligibleForBatchRelease(item, batchType)) {
        throw new Error(`${ctnLabel(item)} is not eligible for release from batch.`);
      }

      const release = await applyReleaseTransition({ tx, item, batchType, userId: user.user_id });
      const updated = await tx.collectionBatchItem.updateMany({
        where: { id: item.id, item_status: "ACTIVE" },
        data: {
          item_status: "RELEASED",
          release_result: release.result,
          release_destination: release.destination,
          released_at: new Date(),
          released_by: user.user_id,
        },
      });
      if (updated.count !== 1) {
        throw new Error(`${ctnLabel(item)} has already been released from this batch.`);
      }

      const counts = await updateCollectionBatchAfterRelease(tx, input.batchId);

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Released ${ctnLabel(item)} from collection batch ${collectionBatch.batch_no}`,
        },
      });

      return {
        batch_no: collectionBatch.batch_no,
        ctn: ctnLabel(item),
        released: 1,
        remaining: counts.remaining,
      };
    });

    revalidateLabSurfaces();
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      errors: {
        _form: [
          err instanceof Error ? err.message : "Failed to release collection from batch.",
        ],
      },
    };
  }
}

export async function releaseEligibleCollectionsFromBatch(rawInput: unknown) {
  const parsed = releaseEligibleCollectionsFromBatchSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: ReleaseEligibleCollectionsFromBatchInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const collectionBatch = await tx.collectionBatch.findUnique({
        where: { id: input.batchId },
        include: {
          items: {
            include: {
              collection: true,
              workflow: { include: { collection: true, batch: true } },
            },
          },
        },
      });

      if (!collectionBatch) throw new Error("Batch not found.");
      if (
        collectionBatch.status !== "ACTIVE" &&
        collectionBatch.status !== "IN_PROGRESS"
      ) {
        throw new Error("Batch is no longer active.");
      }

      const batchType = collectionBatch.batch_type as LabBatchType;
      const eligible = collectionBatch.items.filter((item) =>
        isEligibleForBatchRelease(item, batchType)
      );

      if (eligible.length === 0) {
        throw new Error(NO_ELIGIBLE_RELEASE_MESSAGE);
      }

      for (const item of eligible) {
        const release = await applyReleaseTransition({ tx, item, batchType, userId: user.user_id });
        const updated = await tx.collectionBatchItem.updateMany({
          where: { id: item.id, item_status: "ACTIVE" },
          data: {
            item_status: "RELEASED",
            release_result: release.result,
            release_destination: release.destination,
            released_at: new Date(),
            released_by: user.user_id,
          },
        });
        if (updated.count !== 1) {
          throw new Error(`${ctnLabel(item)} has already been released from this batch.`);
        }
      }

      const counts = await updateCollectionBatchAfterRelease(tx, input.batchId);

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Released ${eligible.length} eligible collection(s) from collection batch ${collectionBatch.batch_no}`,
        },
      });

      return {
        batch_no: collectionBatch.batch_no,
        released: eligible.length,
        remaining: counts.remaining,
      };
    });

    revalidateLabSurfaces();
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      errors: {
        _form: [
          err instanceof Error
            ? err.message
            : "Failed to release eligible collections from batch.",
        ],
      },
    };
  }
}

function assertWorkflowCanBeSentToLab(
  item: Awaited<ReturnType<typeof getCollectionBatchItemsForUpdate>>[number],
  stage: "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
) {
  const workflow = item.workflow;
  const processingBatch = workflow?.batch;
  const label = ctnLabel(item);

  if (!workflow || !processingBatch) {
    throw new Error(`${label} has no linked workflow tracker.`);
  }

  if (BLOCKED_BATCH_STATUSES.has(processingBatch.status)) {
    throw new Error(`${label} is no longer eligible for Sent to Lab.`);
  }

  if (
    workflow.current_step === "DISPOSED" ||
    BLOCKED_WORKFLOW_STATUSES.has(workflow.final_status)
  ) {
    throw new Error(`${label} is no longer eligible for Sent to Lab.`);
  }

  if (stage === "PRE_PASTEURIZATION") {
    const inCollectionComplete =
      workflow.pre_collection_confirmed || !!workflow.cold_chain_started_at;

    if (
      !inCollectionComplete ||
      workflow.pre_lab_result ||
      workflow.pasteurization_confirmed ||
      workflow.post_sent_to_lab ||
      workflow.post_lab_result
    ) {
      throw new Error(`${label} is no longer eligible for Sent to Lab.`);
    }
    return;
  }

  if (
    workflow.pre_lab_result !== "PASS" ||
    !workflow.pasteurization_confirmed ||
    workflow.post_lab_result
  ) {
    throw new Error(`${label} is no longer eligible for Sent to Lab.`);
  }
}

function assertWorkflowCanReceiveLabResult(
  item: Awaited<ReturnType<typeof getCollectionBatchItemsForUpdate>>[number],
  stage: "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
) {
  const workflow = item.workflow;
  const processingBatch = workflow?.batch;
  const label = ctnLabel(item);

  if (!workflow || !processingBatch) {
    throw new Error(`${label} has no linked workflow tracker.`);
  }

  if (BLOCKED_BATCH_STATUSES.has(processingBatch.status)) {
    throw new Error(`${label} is no longer eligible for Lab Result.`);
  }

  if (
    workflow.current_step === "DISPOSED" ||
    BLOCKED_WORKFLOW_STATUSES.has(workflow.final_status)
  ) {
    throw new Error(`${label} is no longer eligible for Lab Result.`);
  }

  if (stage === "PRE_PASTEURIZATION") {
    if (!workflow.pre_sent_to_lab || workflow.pre_lab_result) {
      throw new Error(`${label} is no longer awaiting Pre-Pasteurization Lab Result.`);
    }
    return;
  }

  if (
    workflow.pre_lab_result !== "PASS" ||
    !workflow.post_sent_to_lab ||
    workflow.post_lab_result
  ) {
    throw new Error(`${label} is no longer awaiting Post-Pasteurization Lab Result.`);
  }
}

async function getCollectionBatchItemsForUpdate(
  tx: Tx,
  collectionBatchId: number,
  stage: "PRE_PASTEURIZATION" | "POST_PASTEURIZATION"
) {
  const collectionBatch = await tx.collectionBatch.findUnique({
    where: { id: collectionBatchId },
    include: {
      items: {
        where: { item_status: "ACTIVE" },
        include: {
          collection: { select: { ctn: true, tracking_no: true } },
          workflow: {
            include: {
              collection: true,
              batch: true,
            },
          },
        },
      },
    },
  });

  if (!collectionBatch) {
    throw new Error("Batch not found.");
  }

  if (
    collectionBatch.status !== "ACTIVE" &&
    collectionBatch.status !== "IN_PROGRESS"
  ) {
    throw new Error("Batch is no longer active.");
  }

  const expectedStage = stageForBatchType(collectionBatch.batch_type);
  if (!expectedStage || expectedStage !== stage) {
    throw new Error("Lab stage does not match this batch type.");
  }

  if (collectionBatch.items.length === 0) {
    throw new Error("No included collections were found.");
  }

  return collectionBatch.items;
}

export async function bulkSetSentToLabForBatch(rawInput: unknown) {
  const parsed = bulkSetSentToLabForBatchSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: BulkSetSentToLabForBatchInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const items = await getCollectionBatchItemsForUpdate(
        tx,
        input.collection_batch_id,
        input.stage
      );

      for (const item of items) {
        assertWorkflowCanBeSentToLab(item, input.stage);
        const workflow = item.workflow!;

        nextRemainingVolume({
          currentRemaining: workflow.batch?.remaining_volume,
          currentTotal: workflow.batch?.total_volume,
          newSampleVolume: input.sample_volume,
          previousSampleVolume:
            input.stage === "PRE_PASTEURIZATION"
              ? workflow.pre_sample_volume
              : workflow.post_sample_volume,
        });
      }

      for (const item of items) {
        const workflow = item.workflow!;
        const batchId = workflow.batch_id!;
        const remainingVolume = nextRemainingVolume({
          currentRemaining: workflow.batch?.remaining_volume,
          currentTotal: workflow.batch?.total_volume,
          newSampleVolume: input.sample_volume,
          previousSampleVolume:
            input.stage === "PRE_PASTEURIZATION"
              ? workflow.pre_sample_volume
              : workflow.post_sample_volume,
        });
        const existing = await tx.labResult.findFirst({
          where: { batch_id: batchId, stage: input.stage },
        });
        const labData = {
          result: "PENDING" as const,
          test_date: input.sent_date,
          tested_by: user.user_id,
          remarks: input.staff_notes ?? null,
        };

        if (existing) {
          await tx.labResult.update({
            where: { lab_id: existing.lab_id },
            data: labData,
          });
        } else {
          await tx.labResult.create({
            data: {
              batch_id: batchId,
              stage: input.stage,
              ...labData,
            },
          });
        }

        await tx.batch.update({
          where: { batch_id: batchId },
          data: {
            remaining_volume: remainingVolume,
            status: "TESTING",
          },
        });

        await tx.supsupTodoDonationWorkflow.update({
          where: { workflow_id: workflow.workflow_id },
          data:
            input.stage === "PRE_PASTEURIZATION"
              ? {
                  pre_sent_to_lab: true,
                  pre_sample_volume: input.sample_volume,
                  pre_sample_sent_at: input.sent_date,
                  pre_expected_result_date: expectedDate(
                    input.sent_date,
                    input.expected_result_date
                  ),
                  pre_sent_notes: input.staff_notes ?? null,
                  final_status: "WAITING_PRE_LAB_RESULT",
                  current_step: "PRE_LAB_RESULT",
                  updated_by: user.user_id,
                }
              : {
                  post_sent_to_lab: true,
                  post_sample_volume: input.sample_volume,
                  post_sample_sent_at: input.sent_date,
                  post_expected_result_date: expectedDate(
                    input.sent_date,
                    input.expected_result_date
                  ),
                  post_sent_notes: input.staff_notes ?? null,
                  final_status: "WAITING_POST_LAB_RESULT",
                  current_step: "POST_LAB_RESULT",
                  updated_by: user.user_id,
                },
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Bulk set ${input.stage} Sent to Lab for collection batch #${input.collection_batch_id} (${items.length} CTN${items.length === 1 ? "" : "s"})`,
        },
      });

      return { updated: items.length };
    });

    revalidateLabSurfaces();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, errors: { _form: [err instanceof Error ? err.message : "Bulk Sent to Lab failed."] } };
  }
}

export async function bulkSetLabResultForBatch(rawInput: unknown) {
  const parsed = bulkSetLabResultForBatchSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: BulkSetLabResultForBatchInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, errors: { _form: ["Not authenticated"] } };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const items = await getCollectionBatchItemsForUpdate(
        tx,
        input.collection_batch_id,
        input.stage
      );

      for (const item of items) {
        assertWorkflowCanReceiveLabResult(item, input.stage);
      }

      for (const item of items) {
        const workflow = item.workflow!;
        const batchId = workflow.batch_id!;
        const existing = await tx.labResult.findFirst({
          where: { batch_id: batchId, stage: input.stage },
        });
        const labData = {
          result: input.lab_result,
          colony_count: input.colony_count ?? null,
          test_date: input.result_received_date,
          tested_by: user.user_id,
          remarks: input.staff_notes ?? null,
        };

        if (existing) {
          await tx.labResult.update({
            where: { lab_id: existing.lab_id },
            data: labData,
          });
        } else {
          await tx.labResult.create({
            data: {
              batch_id: batchId,
              stage: input.stage,
              ...labData,
            },
          });
        }

        await syncSupsupWorkflowLabResult({
          tx,
          batchId,
          stage: input.stage,
          result: input.lab_result,
          userId: user.user_id,
          testDate: input.result_received_date,
          remarks: input.staff_notes,
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Bulk set ${input.stage} Lab Result to ${input.lab_result} for collection batch #${input.collection_batch_id} (${items.length} CTN${items.length === 1 ? "" : "s"})`,
        },
      });

      return { updated: items.length };
    });

    revalidateLabSurfaces();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, errors: { _form: [err instanceof Error ? err.message : "Bulk Lab Result failed."] } };
  }
}
