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
  collection_batch_items?: LabBatchSummary[];
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
  collection_batch_items?: LabBatchSummary[];
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

function summarizeCollectionBatchStatus(items: LabBatchSummary[], batchType: "PRE_PSTR" | "PSTR" | "POST_PSTR") {
  if (items.length === 0) return "In Progress";

  const failed = items.filter((item) => {
    const workflow = item.supSupTodoWorkflow;
    return batchType === "PRE_PSTR"
      ? workflow?.pre_lab_result === "FAIL"
      : batchType === "POST_PSTR"
        ? workflow?.post_lab_result === "FAIL"
        : false;
  }).length;
  if (failed === items.length) return "Failed";
  if (failed > 0) return "Partially Failed";

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

  const activeCollectionBatches = await db.collectionBatch.findMany({
    where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
    include: {
      creator: { select: { email: true, full_name: true } },
      items: {
        include: {
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
    activeCollectionBatches.flatMap((batch) =>
      batch.items
        .map((item) => item.collection.batch_id)
        .filter((batchId): batchId is number => batchId != null)
    )
  );

  const visibleIndividuals = individualRows.filter(
    (row) => !activeBatchedProcessingIds.has(row.batch_id)
  );

  const collectionBatchRows: LabBatchSummary[] = [];
  for (const collectionBatch of activeCollectionBatches) {
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
      collection_batch_status: summarizeCollectionBatchStatus(
        items,
        collectionBatch.batch_type
      ),
      collection_batch_items: items,
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
      collection_batch_status: summary.collection_batch_status,
      collection_batch_items: summary.collection_batch_items,
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
