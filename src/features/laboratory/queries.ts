"use server";

import { db } from "@/core/db";
import type { SupsupTodoWorkflowDetail } from "@/features/supsup-todo/queries";

export interface LabBatchSummary {
  row_type: "individual" | "collection_batch";
  row_id: string;
  batch_id: number;
  batch_code: string;
  tracking_no: string | null;
  display_id?: string;
  collection_batch_id?: number;
  collection_batch_no?: string;
  collection_batch_type?: "PRE_PSTR" | "PSTR" | "POST_PSTR";
  collection_batch_status?: string;
  collection_batch_lifecycle?: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  collection_batch_items?: LabBatchSummary[];
  collection_id?: number;
  collection_batch_item_status?: string;
  release_result?: string | null;
  release_destination?: string | null;
  released_at?: Date | null;
  released_by_name?: string | null;
  batch_summary?: {
    total: number;
    released: number;
    remaining: number;
    passed: number;
    failed: number;
    pending: number;
  };
  creator_name?: string;
  notes?: string | null;
  pooling_date: Date;
  total_volume: number;
  remaining_volume: number;
  status: string;
  program: string | null;
  donor_name: string;
  collection_count: number;
  pre_pasteurization: {
    result: string;
    test_date: Date | null;
    remarks: string | null;
  } | null;
  post_pasteurization: {
    result: string;
    test_date: Date | null;
    remarks: string | null;
  } | null;
  supSupTodoWorkflow: SupsupTodoWorkflowDetail | null;
}

export interface LabBatchDetail {
  row_type: "individual" | "collection_batch";
  row_id: string;
  batch_id: number;
  batch_code: string;
  tracking_no: string | null;
  display_id?: string;
  collection_batch_id?: number;
  collection_batch_no?: string;
  collection_batch_type?: "PRE_PSTR" | "PSTR" | "POST_PSTR";
  collection_batch_status?: string;
  collection_batch_lifecycle?: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  collection_batch_items?: LabBatchSummary[];
  collection_id?: number;
  collection_batch_item_status?: string;
  release_result?: string | null;
  release_destination?: string | null;
  released_at?: Date | null;
  released_by_name?: string | null;
  batch_summary?: {
    total: number;
    released: number;
    remaining: number;
    passed: number;
    failed: number;
    pending: number;
  };
  notes?: string | null;
  pooling_date: Date;
  total_volume: number;
  remaining_volume: number;
  status: string;
  created_at: Date;
  creator_name: string;
  collections: {
    ctn: number;
    tracking_no: string | null;
    bottle_no: string | null;
    donor_name: string;
    volume: number;
    program: string;
    collection_date: Date;
  }[];
  lab_results: {
    lab_id: number;
    stage: string;
    result: string;
    test_date: Date;
    colony_count: number | null;
    remarks: string | null;
    tester_name: string;
  }[];
  supSupTodoWorkflow: SupsupTodoWorkflowDetail | null;
}

async function withWorkflowSampleNo(
  workflow: Omit<SupsupTodoWorkflowDetail, "sample_no"> | null
): Promise<SupsupTodoWorkflowDetail | null> {
  if (!workflow) return null;

  const sampleNo = await db.supsupTodoDonationWorkflow.count({
    where: {
      donor_id: workflow.donor_id,
      created_at: { lte: workflow.created_at },
    },
  });

  return { ...workflow, sample_no: sampleNo };
}

function collectionBatchOutcome(
  item: LabBatchSummary,
  batchType: "PRE_PSTR" | "PSTR" | "POST_PSTR"
) {
  if (item.release_result === "PASS") return "passed";
  if (item.release_result === "FAIL") return "failed";
  const workflow = item.supSupTodoWorkflow;
  if (batchType === "PRE_PSTR") {
    if (workflow?.pre_lab_result === "PASS") return "passed";
    if (workflow?.pre_lab_result === "FAIL") return "failed";
    return "pending";
  }

  if (batchType === "PSTR") {
    return workflow?.pasteurization_confirmed ? "passed" : "pending";
  }

  if (workflow?.post_lab_result === "PASS") return "passed";
  if (workflow?.post_lab_result === "FAIL") return "failed";
  return "pending";
}

function summarizeCollectionBatchCounts(
  items: LabBatchSummary[],
  batchType: "PRE_PSTR" | "PSTR" | "POST_PSTR",
  released = items.filter((item) => item.collection_batch_item_status === "RELEASED").length
) {
  const passed = items.filter((item) => collectionBatchOutcome(item, batchType) === "passed").length;
  const failed = items.filter((item) => collectionBatchOutcome(item, batchType) === "failed").length;
  const remaining = items.filter((item) => item.collection_batch_item_status !== "RELEASED").length;
  const pending = items.filter(
    (item) =>
      item.collection_batch_item_status !== "RELEASED" &&
      collectionBatchOutcome(item, batchType) === "pending"
  ).length;
  return { total: items.length, released, remaining, passed, failed, pending };
}

function summarizeCollectionBatchStatus(
  items: LabBatchSummary[],
  batchType: "PRE_PSTR" | "PSTR" | "POST_PSTR",
  lifecycle?: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
) {
  if (items.length === 0) return "In Progress";

  const counts = summarizeCollectionBatchCounts(items, batchType);
  if (lifecycle === "CANCELLED") return "Cancelled";
  if (lifecycle === "COMPLETED") {
    if (counts.failed > 0 && counts.passed > 0) return "Completed / Mixed Results";
    if (counts.failed > 0 && counts.passed === 0) return "Completed / Failed";
    return "Completed";
  }
  if (counts.released > 0 && counts.remaining > 0) return "Partially Released";
  if (counts.failed === items.length) return "Failed";
  if (counts.passed + counts.failed === items.length) return counts.failed > 0 ? "Mixed Results" : "Completed";
  if (counts.failed > 0 || counts.passed > 0) return "Partially Completed";

  const completed = items.every((item) => {
    const workflow = item.supSupTodoWorkflow;
    return batchType === "PRE_PSTR"
      ? workflow?.pre_lab_result === "PASS" || workflow?.pre_lab_result === "FAIL"
      : batchType === "PSTR"
        ? !!workflow?.pasteurization_confirmed
        : workflow?.post_lab_result === "PASS" || workflow?.post_lab_result === "FAIL";
  });
  if (completed) return "Completed";

  const awaiting = items.every((item) => {
    const workflow = item.supSupTodoWorkflow;
    return batchType === "PRE_PSTR"
      ? workflow?.pre_sent_to_lab && !workflow?.pre_lab_result
      : batchType === "POST_PSTR"
        ? workflow?.post_sent_to_lab && !workflow?.post_lab_result
        : false;
  });
  if (awaiting) return "Awaiting Results";

  return "In Progress";
}

export async function getBatchesForLab(): Promise<LabBatchSummary[]> {
  const batches = await db.batch.findMany({
    where: {
      status: {
        in: ["TESTING", "PASTEURIZED", "POOLING", "AVAILABLE", "DISPOSED"],
      },
    },
    take: 25,
    include: {
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
      labResults: {
        orderBy: { test_date: "desc" },
        select: {
          stage: true,
          result: true,
          test_date: true,
          remarks: true,
        },
      },
      collections: {
        select: {
          program: true,
          tracking_no: true,
          donor: { select: { first_name: true, last_name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const mapped = await Promise.all(batches.map(async (batch) => {
    const prePast = batch.labResults.find(
      (lr) => lr.stage === "PRE_PASTEURIZATION"
    );
    const postPast = batch.labResults.find(
      (lr) => lr.stage === "POST_PASTEURIZATION"
    );

    const program = batch.collections[0]?.program ?? null;
    const trackingNo =
      batch.supSupTodoWorkflow?.tracking_no ??
      batch.collections[0]?.tracking_no ??
      null;
    const donorNames = Array.from(
      new Set(
        batch.collections.map((collection) =>
          `${collection.donor.first_name} ${collection.donor.last_name}`
        )
      )
    );

    return {
      row_type: "individual" as const,
      row_id: `individual-${batch.batch_id}`,
      batch_id: batch.batch_id,
      batch_code: batch.batch_code,
      display_id: trackingNo ?? batch.batch_code,
      tracking_no: trackingNo,
      pooling_date: batch.pooling_date,
      total_volume: batch.total_volume,
      remaining_volume: batch.remaining_volume,
      status: batch.status,
      program,
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
        supSupTodoWorkflow: await withWorkflowSampleNo(batch.supSupTodoWorkflow),
    };
  }));

  const individualRows = mapped.filter((batch) => {
    if (!batch.supSupTodoWorkflow) return true;
    return !!batch.supSupTodoWorkflow.cold_chain_started_at;
  });

  const collectionBatches = await db.collectionBatch.findMany({
    where: { status: { in: ["ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED"] } },
    include: {
      creator: { select: { email: true, full_name: true } },
      items: {
        include: {
          releaser: { select: { email: true, full_name: true } },
          collection: {
            include: {
              donor: { select: { first_name: true, last_name: true } },
              batch: {
                include: {
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
                  collections: {
                    select: {
                      program: true,
                      tracking_no: true,
                      donor: { select: { first_name: true, last_name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const activeBatchedProcessingIds = new Set(
    collectionBatches.flatMap((batch) =>
      batch.items
        .filter(
          (item) =>
            item.item_status !== "RELEASED" &&
            (batch.status === "ACTIVE" || batch.status === "IN_PROGRESS")
        )
        .map((item) => item.collection.batch_id)
        .filter((batchId): batchId is number => batchId != null)
    )
  );

  const visibleIndividuals = individualRows.filter(
    (row) => !activeBatchedProcessingIds.has(row.batch_id)
  );

  const collectionBatchRows: LabBatchSummary[] = [];
  for (const collectionBatch of collectionBatches) {
    const items: LabBatchSummary[] = [];
    for (const item of collectionBatch.items) {
      const processingBatch = item.collection.batch;
      if (!processingBatch) continue;
      const prePast = processingBatch.labResults.find(
        (lr) => lr.stage === "PRE_PASTEURIZATION"
      );
      const postPast = processingBatch.labResults.find(
        (lr) => lr.stage === "POST_PASTEURIZATION"
      );
      const workflow = await withWorkflowSampleNo(
        processingBatch.supSupTodoWorkflow
      );
      items.push({
        row_type: "individual",
        row_id: `individual-${processingBatch.batch_id}`,
        batch_id: processingBatch.batch_id,
        collection_id: item.collection.ctn,
        collection_batch_item_status: item.item_status,
        release_result: item.release_result,
        release_destination: item.release_destination,
        released_at: item.released_at,
        released_by_name: item.releaser?.full_name || item.releaser?.email || null,
        batch_code: processingBatch.batch_code,
        display_id: item.collection.tracking_no ?? processingBatch.batch_code,
        tracking_no: item.collection.tracking_no,
        pooling_date: processingBatch.pooling_date,
        total_volume: processingBatch.total_volume,
        remaining_volume: processingBatch.remaining_volume,
        status: processingBatch.status,
        program: item.collection.program,
        donor_name: `${item.collection.donor.first_name} ${item.collection.donor.last_name}`,
        collection_count: 1,
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
        supSupTodoWorkflow: workflow,
      });
    }

    const totalVolume = items.reduce((sum, item) => sum + item.remaining_volume, 0);
    const donorNames = Array.from(new Set(items.map((item) => item.donor_name)));
    const batchSummary = summarizeCollectionBatchCounts(
      items,
      collectionBatch.batch_type
    );
    collectionBatchRows.push({
      row_type: "collection_batch",
      row_id: `collection-batch-${collectionBatch.id}`,
      batch_id: -collectionBatch.id,
      batch_code: collectionBatch.batch_no,
      display_id: collectionBatch.batch_no,
      tracking_no: collectionBatch.batch_no,
      collection_batch_id: collectionBatch.id,
      collection_batch_no: collectionBatch.batch_no,
      collection_batch_type: collectionBatch.batch_type,
      collection_batch_lifecycle: collectionBatch.status,
      collection_batch_status: summarizeCollectionBatchStatus(
        items,
        collectionBatch.batch_type,
        collectionBatch.status
      ),
      collection_batch_items: items,
      batch_summary: batchSummary,
      creator_name: collectionBatch.creator.full_name || collectionBatch.creator.email,
      notes: collectionBatch.notes,
      pooling_date: collectionBatch.created_at,
      total_volume: totalVolume,
      remaining_volume: totalVolume,
      status:
        collectionBatch.status === "COMPLETED"
          ? "AVAILABLE"
          : collectionBatch.status === "CANCELLED"
            ? "DISPOSED"
            : "TESTING",
      program: items[0]?.program ?? null,
      donor_name:
        donorNames.length === 0
          ? "--"
          : donorNames.length === 1
            ? donorNames[0]
            : "Multiple donors",
      collection_count: items.length,
      pre_pasteurization: null,
      post_pasteurization: null,
      supSupTodoWorkflow: null,
    });
  }

  return [...collectionBatchRows, ...visibleIndividuals];
}

export async function getBatchLabDetail(
  batchId: number
): Promise<LabBatchDetail | null> {
  if (batchId < 0) {
    const rows = await getBatchesForLab();
    const summary = rows.find((row) => row.batch_id === batchId);
    if (!summary || summary.row_type !== "collection_batch") return null;

    return {
      row_type: "collection_batch",
      row_id: summary.row_id,
      batch_id: summary.batch_id,
      batch_code: summary.batch_code,
      display_id: summary.display_id,
      tracking_no: summary.tracking_no,
      collection_batch_id: summary.collection_batch_id,
      collection_batch_no: summary.collection_batch_no,
      collection_batch_type: summary.collection_batch_type,
      collection_batch_lifecycle: summary.collection_batch_lifecycle,
      collection_batch_status: summary.collection_batch_status,
      collection_batch_items: summary.collection_batch_items,
      batch_summary: summary.batch_summary,
      notes: summary.notes,
      pooling_date: summary.pooling_date,
      total_volume: summary.total_volume,
      remaining_volume: summary.remaining_volume,
      status: summary.status,
      created_at: summary.pooling_date,
      creator_name: summary.creator_name ?? "--",
      collections:
        summary.collection_batch_items?.flatMap((item) =>
          item.supSupTodoWorkflow?.collection
            ? [
                {
                  ctn: item.supSupTodoWorkflow.collection.ctn,
                  tracking_no: item.supSupTodoWorkflow.collection.tracking_no,
                  bottle_no: item.supSupTodoWorkflow.collection.bottle_no,
                  donor_name: item.donor_name,
                  volume: item.supSupTodoWorkflow.collection.volume,
                  program: item.supSupTodoWorkflow.collection.program,
                  collection_date: item.supSupTodoWorkflow.collection.collection_date,
                },
              ]
            : []
        ) ?? [],
      lab_results: [],
      supSupTodoWorkflow: null,
    };
  }

  const batch = await db.batch.findUnique({
    where: { batch_id: batchId },
    include: {
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
      creator: { select: { email: true } },
      labResults: {
        include: {
          tester: { select: { email: true } },
        },
        orderBy: { test_date: "desc" },
      },
      collections: {
        include: {
          donor: { select: { first_name: true, last_name: true } },
        },
        orderBy: { collection_date: "desc" },
      },
    },
  });

  if (!batch) return null;

  return {
    row_type: "individual",
    row_id: `individual-${batch.batch_id}`,
    batch_id: batch.batch_id,
    batch_code: batch.batch_code,
    display_id:
      batch.supSupTodoWorkflow?.tracking_no ??
      batch.collections[0]?.tracking_no ??
      batch.batch_code,
    tracking_no:
      batch.supSupTodoWorkflow?.tracking_no ??
      batch.collections[0]?.tracking_no ??
      null,
    pooling_date: batch.pooling_date,
    total_volume: batch.total_volume,
    remaining_volume: batch.remaining_volume,
    status: batch.status,
    created_at: batch.created_at,
    creator_name: batch.creator.email,
    collections: batch.collections.map((c) => ({
      ctn: c.ctn,
      tracking_no: c.tracking_no,
      bottle_no: c.bottle_no,
      donor_name: `${c.donor.first_name} ${c.donor.last_name}`,
      volume: c.volume,
      program: c.program,
      collection_date: c.collection_date,
    })),
    lab_results: batch.labResults.map((lr) => ({
      lab_id: lr.lab_id,
      stage: lr.stage,
      result: lr.result,
      test_date: lr.test_date,
      colony_count: lr.colony_count,
      remarks: lr.remarks,
      tester_name: lr.tester.email,
    })),
    supSupTodoWorkflow: await withWorkflowSampleNo(batch.supSupTodoWorkflow),
  };
}
