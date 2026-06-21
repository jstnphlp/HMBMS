"use server";

import { db } from "@/core/db";

export type DonorEligibilitySummary = {
  eligibility_id: number;
  screening_result: "PASS" | "FAIL" | null;
  screening_date: Date | null;
  consent_signed: boolean;
  consent_date: Date | null;
  staff_notes: string | null;
} | null;

export type SupsupTodoWorkflowSummary = {
  workflow_id: number;
  donor_id: number;
  program: string;
  tracking_no: string;
  sample_sequence: number;
  ctn: number | null;
  batch_id: number | null;
  sample_no: number;
  final_status: string;
  current_step: string;
  extracted_volume: number | null;
  bottle_no: string | null;
  pre_lab_result: string | null;
  post_lab_result: string | null;
  created_at: Date;
  updated_at: Date;
  collection: {
    ctn: number;
    tracking_no: string | null;
    volume: number;
    program: string;
    collection_date: Date;
    batch: { batch_code: string; status: string } | null;
  } | null;
  batch: {
    batch_code: string;
    status: string;
  } | null;
};

export type SupsupTodoWorkflowDetail = SupsupTodoWorkflowSummary & {
  extraction_completed_at: Date | null;
  extraction_notes: string | null;
  bottling_completed_at: Date | null;
  label_confirmed: boolean;
  bottling_notes: string | null;
  cold_chain_started_at: Date | null;
  placed_in_cooler: boolean;
  cold_chain_notes: string | null;
  pre_collection_confirmed: boolean;
  pre_sample_volume: number | null;
  pre_in_collection_notes: string | null;
  pre_sent_to_lab: boolean;
  pre_sample_sent_at: Date | null;
  pre_expected_result_date: Date | null;
  pre_sent_notes: string | null;
  pre_lab_received_at: Date | null;
  pre_lab_notes: string | null;
  pasteurization_completed_at: Date | null;
  pasteurization_confirmed: boolean;
  pasteurization_notes: string | null;
  post_sample_volume: number | null;
  post_sent_to_lab: boolean;
  post_sample_sent_at: Date | null;
  post_expected_result_date: Date | null;
  post_sent_notes: string | null;
  post_lab_received_at: Date | null;
  post_lab_notes: string | null;
};

export async function getDonorSupsupTodoSummary(donorId: number): Promise<{
  eligibility: DonorEligibilitySummary;
  workflows: SupsupTodoWorkflowDetail[];
}> {
  const [eligibility, workflows] = await Promise.all([
    db.donorEligibility.findUnique({
      where: { donor_id: donorId },
      select: {
        eligibility_id: true,
        screening_result: true,
        screening_date: true,
        consent_signed: true,
        consent_date: true,
        staff_notes: true,
      },
    }),
    db.supsupTodoDonationWorkflow.findMany({
      where: { donor_id: donorId },
      orderBy: { created_at: "desc" },
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
    }),
  ]);

  return {
    eligibility,
    workflows: workflows.map((workflow, index) => ({
      ...workflow,
      sample_no: workflows.length - index,
    })),
  };
}

export async function getDonationWorkflowById(
  workflowId: number
): Promise<SupsupTodoWorkflowDetail | null> {
  const workflow = await db.supsupTodoDonationWorkflow.findUnique({
    where: { workflow_id: workflowId },
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
  });

  if (!workflow) return null;

  const count = await db.supsupTodoDonationWorkflow.count({
    where: {
      donor_id: workflow.donor_id,
      created_at: { lte: workflow.created_at },
    },
  });

  return { ...workflow, sample_no: count };
}
