"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db";
import { getCurrentUser } from "@/features/auth/actions";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  allocateMilkSchema,
  cancelMilkRequestSchema,
  releaseMilkSchema,
  type AllocateMilkInput,
} from "./schemas";

function clean(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function paymentNotesWithMethod(notes?: string | null, method?: string | null) {
  const cleanNotes = clean(notes);
  if (!method) return cleanNotes;
  return cleanNotes ? `Payment method: ${method}\n${cleanNotes}` : `Payment method: ${method}`;
}

function requiredChecklistComplete(request: {
  profile_complete: boolean;
  beneficiary_complete: boolean;
  reason_provided: boolean;
  volume_entered: boolean;
  staff_approved: boolean;
}) {
  return (
    request.profile_complete &&
    request.beneficiary_complete &&
    request.reason_provided &&
    request.volume_entered &&
    request.staff_approved
  );
}

async function isSafeSource(batchId: number) {
  const now = new Date();
  const batch = await db.batch.findUnique({
    where: { batch_id: batchId },
    include: {
      inventory: { select: { available_vol: true } },
      labResults: { select: { stage: true, result: true } },
      supSupTodoWorkflow: { select: { post_lab_result: true } },
      collections: {
        select: {
          expiration_date: true,
          is_pasteurized: true,
          status: true,
        },
      },
    },
  });

  if (!batch || batch.status !== "AVAILABLE") return false;
  if (!batch.inventory || batch.inventory.available_vol <= 0) return false;

  const hasPostPass =
    batch.labResults.some(
      (lab) => lab.stage === "POST_PASTEURIZATION" && lab.result === "PASS"
    ) ||
    batch.supSupTodoWorkflow?.post_lab_result === "PASS" ||
    batch.collections.some(
      (collection) =>
        collection.is_pasteurized && collection.status === "READY_FOR_DISPENSING"
    );

  const notExpired = batch.collections.every(
    (collection) => !collection.expiration_date || collection.expiration_date > now
  );

  return hasPostPass && notExpired;
}

async function refreshDistributionPaths() {
  revalidatePath("/dashboard/distribution");
  revalidatePath("/dashboard/recipients");
  revalidatePath("/dashboard/inventory");
}

export async function allocateMilk(rawInput: unknown) {
  const parsed = allocateMilkSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: AllocateMilkInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const request = await tx.milkRequest.findUnique({
        where: { request_id: input.request_id },
        include: { allocations: true },
      });

      if (!request) throw new Error("Milk request was not found.");
      if (request.status === "CANCELLED") throw new Error("Cancelled requests cannot be allocated.");
      if (request.status === "RELEASED") throw new Error("Released requests cannot be changed.");
      if (request.status !== "QUEUED") {
        throw new Error("Only queued requests can be allocated.");
      }
      if (!requiredChecklistComplete(request)) {
        throw new Error("Complete the recipient requirements before queueing this milk request.");
      }

      const allocationByBatch = new Map<number, number>();
      for (const allocation of input.allocations) {
        allocationByBatch.set(
          allocation.batch_id,
          (allocationByBatch.get(allocation.batch_id) ?? 0) + allocation.volume
        );
      }

      const requestedTotal = Array.from(allocationByBatch.values()).reduce(
        (sum, volume) => sum + volume,
        0
      );
      if (requestedTotal <= 0) throw new Error("Allocation volume must be greater than 0.");

      const remainingNeed = request.requested_volume - request.released_volume;
      if (requestedTotal > remainingNeed) {
        throw new Error(`Allocation exceeds remaining request volume (${remainingNeed.toLocaleString()} mL).`);
      }

      await tx.milkRequestAllocation.deleteMany({
        where: { request_id: request.request_id, status: "ALLOCATED" },
      });

      for (const [batchId, volume] of allocationByBatch) {
        const safe = await isSafeSource(batchId);
        if (!safe) {
          throw new Error("Selected milk is no longer available. Please refresh allocation.");
        }

        const inventory = await tx.inventory.findUnique({
          where: { batch_id: batchId },
          select: { available_vol: true },
        });
        if (!inventory || inventory.available_vol < volume) {
          throw new Error("Selected milk is no longer available. Please refresh allocation.");
        }

        await tx.milkRequestAllocation.create({
          data: {
            request_id: request.request_id,
            batch_id: batchId,
            volume,
            allocated_by: user.user_id,
          },
        });
      }

      const nextStatus =
        requestedTotal + request.released_volume >= request.requested_volume
          ? "READY_FOR_RELEASE"
          : "PARTIALLY_FULFILLED";

      return tx.milkRequest.update({
        where: { request_id: request.request_id },
        data: {
          allocated_volume: requestedTotal,
          status: nextStatus,
          notification_status:
            nextStatus === "READY_FOR_RELEASE" ? "READY_FOR_PICKUP" : "NOT_READY",
        },
        select: { request_no: true, status: true },
      });
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Allocated milk for request ${result.request_no}; status ${result.status}`,
      },
    });

    await refreshDistributionPaths();
    return { success: true, data: result };
  } catch (err) {
    console.error("[allocateMilk] error:", err);
    return {
      success: false,
      errors: {
        _form: [err instanceof Error ? err.message : mapPrismaError(err)],
      },
    };
  }
}

export async function releaseMilk(rawInput: unknown) {
  const parsed = releaseMilkSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const request = await tx.milkRequest.findUnique({
        where: { request_id: input.request_id },
        include: {
          recipient: true,
          beneficiary: true,
          allocations: {
            where: { status: "ALLOCATED" },
            include: {
              batch: {
                include: {
                  inventory: true,
                  collections: { select: { tracking_no: true } },
                },
              },
            },
          },
        },
      });

      if (!request) throw new Error("Milk request was not found.");
      if (request.status === "CANCELLED") throw new Error("Cancelled requests cannot be released.");
      if (request.status === "RELEASED") throw new Error("This request has already been released.");
      if (request.status !== "READY_FOR_RELEASE") {
        throw new Error("Only requests ready for release can be released.");
      }
      if (!requiredChecklistComplete(request)) {
        throw new Error("Missing requirements. Complete the checklist before release.");
      }
      if (!request.recipient || !request.beneficiary) {
        throw new Error("Recipient and beneficiary are required before release.");
      }

      const releaseVolume = request.allocations.reduce(
        (sum, allocation) => sum + allocation.volume,
        0
      );
      const totalAmount =
        input.price_per_ml === undefined
          ? null
          : input.price_per_ml * releaseVolume;
      const paymentNotes = paymentNotesWithMethod(
        input.payment_notes,
        input.payment_method
      );
      const requestForRelease = await tx.milkRequest.update({
        where: { request_id: request.request_id },
        data: {
          payment_status: input.payment_status,
          deposit_amount: input.deposit_amount,
          price_per_ml: input.price_per_ml,
          total_amount: totalAmount,
          amount_paid: input.amount_paid,
          payment_notes: paymentNotes,
        },
        select: {
          payment_status: true,
          price_per_ml: true,
          amount_paid: true,
          remarks: true,
        },
      });

      if (requestForRelease.payment_status === "UNPAID") {
        throw new Error("Payment is unpaid. Mark as paid, waived, or not required before releasing milk.");
      }
      if (requestForRelease.payment_status === "PARTIAL") {
        throw new Error("Partial payment release is not enabled. Mark as paid, waived, or not required before releasing milk.");
      }
      if (!["PAID", "WAIVED", "NOT_REQUIRED"].includes(requestForRelease.payment_status)) {
        throw new Error("Payment status is not acceptable for release.");
      }
      if (request.allocations.length === 0) {
        throw new Error("Allocate milk before release.");
      }

      if (releaseVolume <= 0) throw new Error("Release volume must be greater than 0.");
      if (releaseVolume < request.requested_volume && !input.allow_partial_release) {
        throw new Error("Partial fulfillment requires staff confirmation before release.");
      }

      const sourceLabels: string[] = [];
      for (const allocation of request.allocations) {
        const safe = await isSafeSource(allocation.batch_id);
        if (!safe) {
          throw new Error("Selected milk is no longer available. Please refresh allocation.");
        }

        const deduction = await tx.inventory.updateMany({
          where: {
            batch_id: allocation.batch_id,
            available_vol: { gte: allocation.volume },
          },
          data: { available_vol: { decrement: allocation.volume } },
        });

        if (deduction.count !== 1) {
          throw new Error("Selected milk is no longer available. Please refresh allocation.");
        }

        const updatedInventory = await tx.inventory.findUnique({
          where: { batch_id: allocation.batch_id },
          select: { available_vol: true },
        });

        if ((updatedInventory?.available_vol ?? 0) <= 0) {
          await tx.batch.update({
            where: { batch_id: allocation.batch_id },
            data: { status: "DISPENSED" },
          });
        }

        await tx.milkRequestAllocation.update({
          where: { allocation_id: allocation.allocation_id },
          data: {
            status: "RELEASED",
            released_volume: allocation.volume,
            released_at: new Date(),
          },
        });

        sourceLabels.push(
          allocation.batch.collections[0]?.tracking_no ??
            allocation.batch.batch_code
        );
      }

      const firstAllocation = request.allocations[0];
      const price = requestForRelease.price_per_ml ?? 0;
      const total = price * releaseVolume;

      const dispensing = await tx.dispensing.create({
        data: {
          batch_id: firstAllocation.batch_id,
          beneficiary_id: request.beneficiary_id,
          milk_request_id: request.request_id,
          dispensed_by: user.user_id,
          dispensing_date: new Date(),
          volume: releaseVolume,
          price,
          total,
          payment_status: requestForRelease.payment_status,
          amount_paid: requestForRelease.amount_paid,
          source_summary: sourceLabels.join(", "),
          remarks: clean(input.remarks) ?? requestForRelease.remarks,
        },
      });

      const releasedVolume = request.released_volume + releaseVolume;
      const status =
        releasedVolume >= request.requested_volume
          ? "RELEASED"
          : "PARTIALLY_FULFILLED";

      await tx.milkRequest.update({
        where: { request_id: request.request_id },
        data: {
          released_volume: releasedVolume,
          allocated_volume: 0,
          status,
          released_by: user.user_id,
          released_at: new Date(),
          notification_status: "STAFF_NOTED",
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Released ${releaseVolume} mL for request ${request.request_no} from ${sourceLabels.join(", ")}`,
        },
      });

      return dispensing;
    });

    await refreshDistributionPaths();
    return { success: true, data: result };
  } catch (err) {
    console.error("[releaseMilk] error:", err);
    return {
      success: false,
      errors: {
        _form: [err instanceof Error ? err.message : mapPrismaError(err)],
      },
    };
  }
}

export async function cancelMilkRequest(rawInput: unknown) {
  const parsed = cancelMilkRequestSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const request = await db.milkRequest.update({
      where: { request_id: input.request_id },
      data: {
        status: "CANCELLED",
        cancellation_reason: input.cancellation_reason,
        cancelled_at: new Date(),
        allocated_volume: 0,
        allocations: {
          updateMany: {
            where: { status: "ALLOCATED" },
            data: { status: "CANCELLED" },
          },
        },
      },
      select: { request_no: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Cancelled milk request ${request.request_no}: ${input.cancellation_reason}`,
      },
    });

    await refreshDistributionPaths();
    return { success: true };
  } catch (err) {
    console.error("[cancelMilkRequest] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}
