"use server";

import { db } from "@/core/db";
import type { ProgramValue } from "@/core/utils/program";
import { formatProgram } from "@/core/utils/program";
import { formatCollectionTrackingNo } from "@/core/utils/tracking";
import { mapPrismaError } from "@/core/utils/prisma-error";
import { getCurrentUser } from "@/features/auth/actions";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import {
  bottlingSchema,
  coldChainSchema,
  donorConsentSchema,
  donorScreeningSchema,
  extractionSchema,
  labResultSchema,
  pasteurizationSchema,
  postSentToLabSchema,
  preCollectionSchema,
  preSentToLabSchema,
} from "./schemas";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
type Tx = Prisma.TransactionClient;

const SESSION_VOLUME_ERROR =
  "Donation volume must be between 30 mL and 240 mL per session.";
const DAILY_VOLUME_ERROR =
  "This donor has reached the 800 mL daily donation limit.";
const MIN_DONATION_VOLUME_ML = 30;
const MAX_DONATION_VOLUME_ML = 240;
const MAX_DAILY_DONATION_VOLUME_ML = 800;

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
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

async function getOpenWorkflow(workflowId: number) {
  const workflow = await db.supsupTodoDonationWorkflow.findUnique({
    where: { workflow_id: workflowId },
    include: { collection: true, batch: true },
  });

  if (!workflow) throw new Error("Workflow not found");
  if (workflow.final_status === "DISPOSED") {
    throw new Error("Cannot continue a disposed sample workflow.");
  }
  if (workflow.current_step === "DISPOSED") {
    throw new Error("Cannot continue a disposed sample workflow.");
  }
  return workflow;
}

async function validateDonorCanStartDonationWorkflow(donorId: number) {
  const eligibility = await db.donorEligibility.findUnique({
    where: { donor_id: donorId },
    select: {
      screening_result: true,
      consent_signed: true,
    },
  });

  if (eligibility?.screening_result === "FAIL") {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  if (eligibility?.screening_result !== "PASS") {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  if (!eligibility.consent_signed) {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  return null;
}

async function assertDonationVolumeLimits({
  tx,
  donorId,
  collectionDate,
  volume,
  excludeCtn,
}: {
  tx: Tx;
  donorId: number;
  collectionDate: Date;
  volume: number;
  excludeCtn?: number | null;
}) {
  if (volume < MIN_DONATION_VOLUME_ML || volume > MAX_DONATION_VOLUME_ML) {
    throw new Error(SESSION_VOLUME_ERROR);
  }

  const startOfDay = new Date(collectionDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const aggregate = await tx.collection.aggregate({
    where: {
      donor_id: donorId,
      collection_date: { gte: startOfDay, lt: endOfDay },
      ...(excludeCtn ? { ctn: { not: excludeCtn } } : {}),
    },
    _sum: { volume: true },
  });

  if ((aggregate._sum.volume ?? 0) + volume > MAX_DAILY_DONATION_VOLUME_ML) {
    throw new Error(DAILY_VOLUME_ERROR);
  }
}

function revalidateDonorSurfaces() {
  revalidatePath("/dashboard/donors");
  revalidatePath("/dashboard/laboratory");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/dispensing");
}

export async function updateDonorScreening(
  donorId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = donorScreeningSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const data = await db.donorEligibility.upsert({
      where: { donor_id: donorId },
      update: {
        screening_result: parsed.data.screening_result,
        screening_date: parsed.data.screening_date,
        staff_notes: parsed.data.staff_notes ?? null,
        updated_by: user.user_id,
      },
      create: {
        donor_id: donorId,
        screening_result: parsed.data.screening_result,
        screening_date: parsed.data.screening_date,
        staff_notes: parsed.data.staff_notes ?? null,
        updated_by: user.user_id,
      },
    });

    revalidatePath("/dashboard/donors");
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateDonorConsent(
  donorId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = donorConsentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();

    const eligibility = await db.donorEligibility.findUnique({
      where: { donor_id: donorId },
      select: { screening_result: true },
    });

    if (eligibility?.screening_result !== "PASS") {
      return {
        success: false,
        errors: {
          _form: ["Screening must be passed before completing Interview & Consent."],
        },
      };
    }

    const data = await db.donorEligibility.upsert({
      where: { donor_id: donorId },
      update: {
        consent_signed: parsed.data.consent_signed,
        consent_date: parsed.data.consent_date ?? null,
        staff_notes: parsed.data.staff_notes ?? null,
        updated_by: user.user_id,
      },
      create: {
        donor_id: donorId,
        consent_signed: parsed.data.consent_signed,
        consent_date: parsed.data.consent_date ?? null,
        staff_notes: parsed.data.staff_notes ?? null,
        updated_by: user.user_id,
      },
    });

    revalidatePath("/dashboard/donors");
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function startDonationWorkflow(
  input: { donorId: number; program: ProgramValue }
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const eligibilityError = await validateDonorCanStartDonationWorkflow(input.donorId);

    if (eligibilityError) {
      return { success: false, errors: { _form: [eligibilityError] } };
    }

    const data = await db.$transaction(async (tx) => {
      const [latest, collectionCount] = await Promise.all([
        tx.supsupTodoDonationWorkflow.aggregate({
          where: { donor_id: input.donorId },
          _max: { sample_sequence: true },
        }),
        tx.collection.count({ where: { donor_id: input.donorId } }),
      ]);
      const sampleSequence =
        Math.max(latest._max.sample_sequence ?? 0, collectionCount) + 1;

      return tx.supsupTodoDonationWorkflow.create({
        data: {
          donor_id: input.donorId,
          program: input.program,
          sample_sequence: sampleSequence,
          tracking_no: formatCollectionTrackingNo(input.donorId, sampleSequence),
          created_by: user.user_id,
        },
      });
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Started ${formatProgram(input.program)} donation workflow #${data.workflow_id} for donor #${input.donorId}`,
      },
    });

    revalidatePath("/dashboard/donors");
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function startSupsupTodoDonation(
  donorId: number
): Promise<ActionResult> {
  return startDonationWorkflow({ donorId, program: "SUPSUP_TODO" });
}

export async function updateLactationExtraction(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = extractionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);

    const result = await db.$transaction(async (tx) => {
      let batchId = workflow.batch_id;
      let ctn = workflow.ctn;

      await assertDonationVolumeLimits({
        tx,
        donorId: workflow.donor_id,
        collectionDate: parsed.data.extraction_completed_at,
        volume: parsed.data.extracted_volume,
        excludeCtn: ctn,
      });

      if (!batchId) {
        const batch = await tx.batch.create({
          data: {
            batch_code: workflow.tracking_no,
            pooling_date: parsed.data.extraction_completed_at,
            total_volume: parsed.data.extracted_volume,
            remaining_volume: parsed.data.extracted_volume,
            status: "POOLING",
            created_by: user.user_id,
          },
        });
        batchId = batch.batch_id;
      } else {
        const adjustedRemaining =
          parsed.data.extracted_volume -
          (workflow.pre_sample_volume ?? 0) -
          (workflow.post_sample_volume ?? 0);

        if (adjustedRemaining < 0) {
          throw new Error("Extracted volume cannot be less than already sampled volume.");
        }

        await tx.batch.update({
          where: { batch_id: batchId },
          data: {
            pooling_date: parsed.data.extraction_completed_at,
            total_volume: parsed.data.extracted_volume,
            remaining_volume: adjustedRemaining,
          },
        });
      }

      if (!ctn) {
        const collection = await tx.collection.create({
          data: {
            donor_id: workflow.donor_id,
            tracking_no: workflow.tracking_no,
            recorded_by: user.user_id,
            program: workflow.program,
            collection_date: parsed.data.extraction_completed_at,
            volume: parsed.data.extracted_volume,
            remarks: parsed.data.staff_notes ?? null,
            is_pasteurized: false,
            status: "PENDING_LAB_TEST",
            batch_id: batchId,
          },
        });
        ctn = collection.ctn;
      } else {
        await tx.collection.update({
          where: { ctn },
          data: {
            tracking_no: workflow.tracking_no,
            collection_date: parsed.data.extraction_completed_at,
            volume: parsed.data.extracted_volume,
            remarks: parsed.data.staff_notes ?? null,
            batch_id: batchId,
          },
        });
      }

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          ctn,
          batch_id: batchId,
          extraction_completed_at: parsed.data.extraction_completed_at,
          extracted_volume: parsed.data.extracted_volume,
          extraction_notes: parsed.data.staff_notes ?? null,
          current_step: "BOTTLING_LABELING",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateBottlingLabeling(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = bottlingSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);

    if (workflow.ctn) {
      await db.collection.update({
        where: { ctn: workflow.ctn },
        data: {
          bottle_no: parsed.data.bottle_no,
          batch_no: workflow.batch?.batch_code ?? null,
        },
      });
    }

    const data = await db.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflowId },
      data: {
        bottling_completed_at: new Date(),
        bottle_no: parsed.data.bottle_no,
        label_confirmed: true,
        bottling_notes: parsed.data.staff_notes ?? null,
        current_step: "COLD_CHAIN",
        updated_by: user.user_id,
      },
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateColdChain(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = coldChainSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);

    const data = await db.$transaction(async (tx) => {
      if (workflow.batch_id) {
        await tx.batch.update({
          where: { batch_id: workflow.batch_id },
          data: { status: "TESTING" },
        });
      }

      if (workflow.ctn) {
        await tx.collection.update({
          where: { ctn: workflow.ctn },
          data: { status: "PENDING_LAB_TEST" },
        });
      }

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          cold_chain_started_at: parsed.data.cold_chain_started_at,
          placed_in_cooler: true,
          cold_chain_notes: parsed.data.staff_notes ?? null,
          pre_collection_confirmed: true,
          current_step: "PRE_SENT_TO_LAB",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updatePreLabInCollection(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = preCollectionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (!parsed.data.collection_confirmed) {
    return { success: false, errors: { collection_confirmed: ["Collection must be confirmed."] } };
  }

  try {
    const user = await requireUser();
    await getOpenWorkflow(workflowId);

    const data = await db.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflowId },
      data: {
        pre_collection_confirmed: true,
        pre_in_collection_notes: parsed.data.staff_notes ?? null,
        current_step: "PRE_SENT_TO_LAB",
        updated_by: user.user_id,
      },
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updatePreLabSentToLab(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = preSentToLabSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);
    if (!workflow.batch_id) throw new Error("Complete extraction before lab submission.");

    const remainingVolume = nextRemainingVolume({
      currentRemaining: workflow.batch?.remaining_volume,
      currentTotal: workflow.batch?.total_volume,
      newSampleVolume: parsed.data.sample_volume,
      previousSampleVolume: workflow.pre_sample_volume,
    });

    const data = await db.$transaction(async (tx) => {
      const existing = await tx.labResult.findFirst({
        where: { batch_id: workflow.batch_id!, stage: "PRE_PASTEURIZATION" },
      });

      if (existing) {
        await tx.labResult.update({
          where: { lab_id: existing.lab_id },
          data: {
            result: "PENDING",
            test_date: parsed.data.sent_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      } else {
        await tx.labResult.create({
          data: {
            batch_id: workflow.batch_id!,
            stage: "PRE_PASTEURIZATION",
            result: "PENDING",
            test_date: parsed.data.sent_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      }

      await tx.batch.update({
        where: { batch_id: workflow.batch_id! },
        data: { remaining_volume: remainingVolume },
      });

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          pre_sent_to_lab: true,
          pre_sample_volume: parsed.data.sample_volume,
          pre_sample_sent_at: parsed.data.sent_date,
          pre_expected_result_date: expectedDate(
            parsed.data.sent_date,
            parsed.data.expected_result_date
          ),
          pre_sent_notes: parsed.data.staff_notes ?? null,
          final_status: "WAITING_PRE_LAB_RESULT",
          current_step: "PRE_LAB_RESULT",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function recordPreLabResult(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = labResultSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);
    if (!workflow.batch_id) throw new Error("Batch not found for this sample.");

    const status = parsed.data.lab_result === "PASS"
      ? "READY_FOR_PASTEURIZATION"
      : "DISPOSED";

    const data = await db.$transaction(async (tx) => {
      const existing = await tx.labResult.findFirst({
        where: { batch_id: workflow.batch_id!, stage: "PRE_PASTEURIZATION" },
      });

      if (existing) {
        await tx.labResult.update({
          where: { lab_id: existing.lab_id },
          data: {
            result: parsed.data.lab_result,
            test_date: parsed.data.result_received_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      } else {
        await tx.labResult.create({
          data: {
            batch_id: workflow.batch_id!,
            stage: "PRE_PASTEURIZATION",
            result: parsed.data.lab_result,
            test_date: parsed.data.result_received_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      }

      await tx.batch.update({
        where: { batch_id: workflow.batch_id! },
        data: { status: parsed.data.lab_result === "PASS" ? "TESTING" : "DISPOSED" },
      });

      if (parsed.data.lab_result === "FAIL") {
        const existingDisposal = await tx.disposal.findFirst({
          where: { batch_id: workflow.batch_id!, reason: "PRE_LAB_FAILED" },
        });
        if (existingDisposal) {
          await tx.disposal.update({
            where: { disposal_id: existingDisposal.disposal_id },
            data: {
              disposal_date: parsed.data.result_received_date,
              volume: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
              disposed_by: user.user_id,
              remarks: parsed.data.staff_notes ?? null,
            },
          });
        } else {
          await tx.disposal.create({
            data: {
              batch_id: workflow.batch_id!,
              disposal_date: parsed.data.result_received_date,
              reason: "PRE_LAB_FAILED",
              volume: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
              disposed_by: user.user_id,
              remarks: parsed.data.staff_notes ?? null,
            },
          });
        }
      }

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          pre_lab_result: parsed.data.lab_result,
          pre_lab_received_at: parsed.data.result_received_date,
          pre_lab_notes: parsed.data.staff_notes ?? null,
          final_status: parsed.data.lab_result === "PASS"
            ? "READY_FOR_PASTEURIZATION"
            : "PRE_LAB_FAILED",
          current_step: parsed.data.lab_result === "PASS"
            ? "PASTEURIZATION"
            : "DISPOSED",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data: { ...data, status } };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updatePasteurization(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = pasteurizationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);
    if (workflow.pre_lab_result !== "PASS") {
      return { success: false, errors: { _form: ["Pre-pasteurization lab result must pass first."] } };
    }
    if (!workflow.batch_id) throw new Error("Batch not found for this sample.");

    await db.batch.update({
      where: { batch_id: workflow.batch_id },
      data: { status: "PASTEURIZED" },
    });

    const data = await db.supsupTodoDonationWorkflow.update({
      where: { workflow_id: workflowId },
      data: {
        pasteurization_completed_at: parsed.data.pasteurization_date,
        pasteurization_confirmed: true,
        pasteurization_notes: parsed.data.staff_notes ?? null,
        current_step: "POST_SENT_TO_LAB",
        updated_by: user.user_id,
      },
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updatePostLabSentToLab(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = postSentToLabSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);
    if (workflow.pre_lab_result !== "PASS") {
      return { success: false, errors: { _form: ["Pre-pasteurization lab result must pass first."] } };
    }
    if (!workflow.batch_id) throw new Error("Batch not found for this sample.");

    const remainingVolume = nextRemainingVolume({
      currentRemaining: workflow.batch?.remaining_volume,
      currentTotal: workflow.batch?.total_volume,
      newSampleVolume: parsed.data.sample_volume,
      previousSampleVolume: workflow.post_sample_volume,
    });

    const data = await db.$transaction(async (tx) => {
      const existing = await tx.labResult.findFirst({
        where: { batch_id: workflow.batch_id!, stage: "POST_PASTEURIZATION" },
      });

      if (existing) {
        await tx.labResult.update({
          where: { lab_id: existing.lab_id },
          data: {
            result: "PENDING",
            test_date: parsed.data.sent_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      } else {
        await tx.labResult.create({
          data: {
            batch_id: workflow.batch_id!,
            stage: "POST_PASTEURIZATION",
            result: "PENDING",
            test_date: parsed.data.sent_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      }

      await tx.batch.update({
        where: { batch_id: workflow.batch_id! },
        data: { remaining_volume: remainingVolume },
      });

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          post_sample_volume: parsed.data.sample_volume,
          post_sent_to_lab: true,
          post_sample_sent_at: parsed.data.sent_date,
          post_expected_result_date: expectedDate(
            parsed.data.sent_date,
            parsed.data.expected_result_date
          ),
          post_sent_notes: parsed.data.staff_notes ?? null,
          final_status: "WAITING_POST_LAB_RESULT",
          current_step: "POST_LAB_RESULT",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function recordPostLabResult(
  workflowId: number,
  rawInput: unknown
): Promise<ActionResult> {
  const parsed = labResultSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const user = await requireUser();
    const workflow = await getOpenWorkflow(workflowId);
    if (!workflow.batch_id) throw new Error("Batch not found for this sample.");
    if (workflow.pre_lab_result !== "PASS") {
      return { success: false, errors: { _form: ["Pre-pasteurization lab result must pass first."] } };
    }

    const data = await db.$transaction(async (tx) => {
      const existing = await tx.labResult.findFirst({
        where: { batch_id: workflow.batch_id!, stage: "POST_PASTEURIZATION" },
      });

      if (existing) {
        await tx.labResult.update({
          where: { lab_id: existing.lab_id },
          data: {
            result: parsed.data.lab_result,
            test_date: parsed.data.result_received_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      } else {
        await tx.labResult.create({
          data: {
            batch_id: workflow.batch_id!,
            stage: "POST_PASTEURIZATION",
            result: parsed.data.lab_result,
            test_date: parsed.data.result_received_date,
            tested_by: user.user_id,
            remarks: parsed.data.staff_notes ?? null,
          },
        });
      }

      if (parsed.data.lab_result === "PASS") {
        await tx.batch.update({
          where: { batch_id: workflow.batch_id! },
          data: { status: "AVAILABLE" },
        });

        await tx.inventory.upsert({
          where: { batch_id: workflow.batch_id! },
          update: {
            donated_vol: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            pasteurized_vol: workflow.batch?.remaining_volume ?? workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            available_vol: workflow.batch?.remaining_volume ?? workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            updated_by: user.user_id,
          },
          create: {
            batch_id: workflow.batch_id!,
            donated_vol: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            pasteurized_vol: workflow.batch?.remaining_volume ?? workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            available_vol: workflow.batch?.remaining_volume ?? workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
            updated_by: user.user_id,
          },
        });
      } else {
        await tx.batch.update({
          where: { batch_id: workflow.batch_id! },
          data: { status: "DISPOSED" },
        });

        const existingDisposal = await tx.disposal.findFirst({
          where: { batch_id: workflow.batch_id!, reason: "POST_LAB_FAILED" },
        });
        if (existingDisposal) {
          await tx.disposal.update({
            where: { disposal_id: existingDisposal.disposal_id },
            data: {
              disposal_date: parsed.data.result_received_date,
              volume: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
              disposed_by: user.user_id,
              remarks: parsed.data.staff_notes ?? null,
            },
          });
        } else {
          await tx.disposal.create({
            data: {
              batch_id: workflow.batch_id!,
              disposal_date: parsed.data.result_received_date,
              reason: "POST_LAB_FAILED",
              volume: workflow.extracted_volume ?? workflow.collection?.volume ?? 0,
              disposed_by: user.user_id,
              remarks: parsed.data.staff_notes ?? null,
            },
          });
        }
      }

      return tx.supsupTodoDonationWorkflow.update({
        where: { workflow_id: workflowId },
        data: {
          post_lab_result: parsed.data.lab_result,
          post_lab_received_at: parsed.data.result_received_date,
          post_lab_notes: parsed.data.staff_notes ?? null,
          final_status: parsed.data.lab_result === "PASS"
            ? "READY_FOR_DISPENSING"
            : "POST_LAB_FAILED",
          current_step: parsed.data.lab_result === "PASS"
            ? "COMPLETED"
            : "DISPOSED",
          updated_by: user.user_id,
        },
      });
    });

    revalidateDonorSurfaces();
    return { success: true, data };
  } catch (err) {
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}
