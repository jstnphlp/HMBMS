"use server";

import { db } from "@/core/db";
import type { SupsupTodoWorkflowDetail } from "@/features/supsup-todo/queries";

export interface LabBatchSummary {
  batch_id: number;
  batch_code: string;
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
  batch_id: number;
  batch_code: string;
  pooling_date: Date;
  total_volume: number;
  remaining_volume: number;
  status: string;
  created_at: Date;
  creator_name: string;
  collections: {
    ctn: number;
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
    const donorNames = Array.from(
      new Set(
        batch.collections.map((collection) =>
          `${collection.donor.first_name} ${collection.donor.last_name}`
        )
      )
    );

    return {
      batch_id: batch.batch_id,
      batch_code: batch.batch_code,
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

  return mapped.filter((batch) => {
    if (!batch.supSupTodoWorkflow) return true;
    return !!batch.supSupTodoWorkflow.cold_chain_started_at;
  });
}

export async function getBatchLabDetail(
  batchId: number
): Promise<LabBatchDetail | null> {
  const batch = await db.batch.findUnique({
    where: { batch_id: batchId },
    include: {
      supSupTodoWorkflow: {
        include: {
          collection: {
            select: {
              ctn: true,
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
    batch_id: batch.batch_id,
    batch_code: batch.batch_code,
    pooling_date: batch.pooling_date,
    total_volume: batch.total_volume,
    remaining_volume: batch.remaining_volume,
    status: batch.status,
    created_at: batch.created_at,
    creator_name: batch.creator.email,
    collections: batch.collections.map((c) => ({
      ctn: c.ctn,
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
