"use server";

import { db } from "@/core/db";

export interface LabBatchSummary {
  batch_id: number;
  batch_code: string;
  pooling_date: Date;
  total_volume: number;
  status: string;
  program: string | null;
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
}

export interface LabBatchDetail {
  batch_id: number;
  batch_code: string;
  pooling_date: Date;
  total_volume: number;
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
}

export async function getBatchesForLab(): Promise<LabBatchSummary[]> {
  const batches = await db.batch.findMany({
    where: {
      status: {
        in: ["TESTING", "PASTEURIZED", "POOLING", "AVAILABLE", "DISPOSED"],
      },
    },
    include: {
      labResults: {
        orderBy: { test_date: "desc" },
      },
      collections: {
        include: {
          donor: { select: { first_name: true, last_name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return batches.map((batch) => {
    const prePast = batch.labResults.find(
      (lr) => lr.stage === "PRE_PASTEURIZATION"
    );
    const postPast = batch.labResults.find(
      (lr) => lr.stage === "POST_PASTEURIZATION"
    );

    const program = batch.collections[0]?.program ?? null;

    return {
      batch_id: batch.batch_id,
      batch_code: batch.batch_code,
      pooling_date: batch.pooling_date,
      total_volume: batch.total_volume,
      status: batch.status,
      program,
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
    };
  });
}

export async function getBatchLabDetail(
  batchId: number
): Promise<LabBatchDetail | null> {
  const batch = await db.batch.findUnique({
    where: { batch_id: batchId },
    include: {
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
  };
}
