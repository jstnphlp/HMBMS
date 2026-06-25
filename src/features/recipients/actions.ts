"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db";
import { getCurrentUser } from "@/features/auth/actions";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  beneficiarySchema,
  cancelRecipientMilkRequestSchema,
  createMilkRequestSchema,
  createRecipientSchema,
  updateBeneficiarySchema,
  updateRecipientSchema,
  updateMilkRequestSchema,
  type BeneficiaryInput,
  type CreateMilkRequestInput,
  type CreateRecipientInput,
  type UpdateBeneficiaryInput,
  type UpdateRecipientInput,
  type UpdateMilkRequestInput,
} from "./schemas";

function clean(value?: string | null) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function requirementsComplete(input: CreateMilkRequestInput) {
  return (
    input.profile_complete &&
    input.beneficiary_complete &&
    input.reason_provided &&
    input.volume_entered &&
    input.staff_approved &&
    (input.reason ?? "").trim().length > 0 &&
    input.requested_volume > 0
  );
}

function statusForRequestInput(input: CreateMilkRequestInput) {
  return requirementsComplete(input) ? "QUEUED" : "INCOMPLETE";
}

function requestMessage(status: string) {
  return status === "QUEUED"
    ? "Request queued successfully."
    : "Request saved as incomplete. Complete all requirements before queueing.";
}

export async function createRecipient(rawInput: unknown) {
  const parsed = createRecipientSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateRecipientInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const recipient = await db.recipient.create({
      data: {
        first_name: input.first_name.trim(),
        middle_name: clean(input.middle_name),
        last_name: input.last_name.trim(),
        contact_no: input.contact_no.trim(),
        address: input.address.trim(),
        relationship_to_beneficiary:
          input.relationship_to_beneficiary.trim(),
        notes: clean(input.notes),
        beneficiaries: {
          create: {
            name: input.beneficiary_name.trim(),
            contact_no: input.contact_no.trim(),
            birthdate: input.beneficiary_birthdate,
            sex: clean(input.beneficiary_sex),
            birth_weight: clean(input.beneficiary_birth_weight),
            gestational_age: clean(input.beneficiary_gestational_age),
            medical_condition: clean(input.beneficiary_medical_condition),
            notes: clean(input.beneficiary_notes),
            remarks: clean(input.beneficiary_medical_condition),
          },
        },
      },
      select: { recipient_id: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Registered recipient #${recipient.recipient_id}: ${input.first_name} ${input.last_name}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    return { success: true, data: recipient };
  } catch (err) {
    console.error("[createRecipient] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function addBeneficiary(rawInput: unknown) {
  const parsed = beneficiarySchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: BeneficiaryInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const recipient = await db.recipient.findUnique({
      where: { recipient_id: input.recipient_id },
      select: { recipient_id: true, contact_no: true },
    });

    if (!recipient) {
      return { success: false, errors: { recipient_id: ["Recipient not found."] } };
    }

    const beneficiary = await db.beneficiary.create({
      data: {
        recipient_id: input.recipient_id,
        name: input.beneficiary_name.trim(),
        contact_no: recipient.contact_no,
        birthdate: input.beneficiary_birthdate ?? null,
        sex: clean(input.beneficiary_sex),
        birth_weight: clean(input.beneficiary_birth_weight),
        gestational_age: clean(input.beneficiary_gestational_age),
        medical_condition: clean(input.beneficiary_medical_condition),
        notes: clean(input.beneficiary_notes),
        remarks: clean(input.beneficiary_medical_condition),
      },
      select: { beneficiary_id: true, name: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Added beneficiary #${beneficiary.beneficiary_id} for recipient #${input.recipient_id}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    return { success: true, data: beneficiary };
  } catch (err) {
    console.error("[addBeneficiary] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateRecipient(rawInput: unknown) {
  const parsed = updateRecipientSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: UpdateRecipientInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const existing = await db.recipient.findUnique({
      where: { recipient_id: input.recipient_id },
      select: { recipient_id: true },
    });

    if (!existing) {
      return { success: false, errors: { recipient_id: ["Recipient not found."] } };
    }

    const recipient = await db.recipient.update({
      where: { recipient_id: input.recipient_id },
      data: {
        first_name: input.first_name.trim(),
        middle_name: clean(input.middle_name),
        last_name: input.last_name.trim(),
        contact_no: input.contact_no.trim(),
        address: input.address.trim(),
        relationship_to_beneficiary:
          input.relationship_to_beneficiary.trim(),
        notes: clean(input.notes),
        status: input.status,
      },
      select: { recipient_id: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Updated recipient #${recipient.recipient_id}: ${input.first_name} ${input.last_name}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    return { success: true, data: recipient };
  } catch (err) {
    console.error("[updateRecipient] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateBeneficiary(rawInput: unknown) {
  const parsed = updateBeneficiarySchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: UpdateBeneficiaryInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const existing = await db.beneficiary.findFirst({
      where: {
        beneficiary_id: input.beneficiary_id,
        recipient_id: input.recipient_id,
      },
      select: { beneficiary_id: true },
    });

    if (!existing) {
      return {
        success: false,
        errors: { beneficiary_id: ["Beneficiary not found."] },
      };
    }

    const beneficiary = await db.beneficiary.update({
      where: { beneficiary_id: input.beneficiary_id },
      data: {
        name: input.beneficiary_name.trim(),
        birthdate: input.beneficiary_birthdate ?? null,
        sex: clean(input.beneficiary_sex),
        birth_weight: clean(input.beneficiary_birth_weight),
        gestational_age: clean(input.beneficiary_gestational_age),
        medical_condition: clean(input.beneficiary_medical_condition),
        notes: clean(input.beneficiary_notes),
        remarks: clean(input.beneficiary_medical_condition),
      },
      select: { beneficiary_id: true, name: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Updated beneficiary #${beneficiary.beneficiary_id} for recipient #${input.recipient_id}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    revalidatePath("/dashboard/distribution");
    return { success: true, data: beneficiary };
  } catch (err) {
    console.error("[updateBeneficiary] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function createMilkRequest(rawInput: unknown) {
  const parsed = createMilkRequestSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateMilkRequestInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const [recipient, beneficiary] = await Promise.all([
      db.recipient.findUnique({
        where: { recipient_id: input.recipient_id },
        select: { recipient_id: true },
      }),
      db.beneficiary.findFirst({
        where: {
          beneficiary_id: input.beneficiary_id,
          recipient_id: input.recipient_id,
        },
        select: { beneficiary_id: true },
      }),
    ]);

    if (!recipient || !beneficiary) {
      return {
        success: false,
        errors: {
          _form: ["Recipient and beneficiary must exist before requesting milk."],
        },
      };
    }

    const status = statusForRequestInput(input);
    const requestNo = `MR-${Date.now().toString(36).toUpperCase()}`;

    const request = await db.milkRequest.create({
      data: {
        request_no: requestNo,
        recipient_id: input.recipient_id,
        beneficiary_id: input.beneficiary_id,
        requested_volume: input.requested_volume,
        reason: (input.reason ?? "").trim(),
        priority: input.priority,
        needed_by: input.needed_by,
        remarks: clean(input.remarks),
        profile_complete: input.profile_complete,
        beneficiary_complete: input.beneficiary_complete,
        reason_provided: input.reason_provided,
        volume_entered: input.volume_entered,
        staff_approved: input.staff_approved,
        status,
        created_by: user.user_id,
      },
      select: { request_id: true, request_no: true, status: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Created milk request ${request.request_no} with status ${request.status}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    revalidatePath("/dashboard/distribution");
    return {
      success: true,
      data: request,
      message: requestMessage(status),
    };
  } catch (err) {
    console.error("[createMilkRequest] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function updateMilkRequest(rawInput: unknown) {
  const parsed = updateMilkRequestSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: UpdateMilkRequestInput = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    return {
      success: false,
      errors: { _form: ["Authentication required. Please log in."] },
    };
  }

  try {
    const existing = await db.milkRequest.findUnique({
      where: { request_id: input.request_id },
      include: { allocations: true },
    });

    if (!existing) {
      return { success: false, errors: { request_id: ["Request not found."] } };
    }

    if (existing.status === "RELEASED" || existing.status === "CANCELLED") {
      return {
        success: false,
        errors: { _form: ["Released or cancelled requests cannot be edited."] },
      };
    }

    const beneficiary = await db.beneficiary.findFirst({
      where: {
        beneficiary_id: input.beneficiary_id,
        recipient_id: input.recipient_id,
      },
      select: { beneficiary_id: true },
    });

    if (!beneficiary) {
      return {
        success: false,
        errors: { beneficiary_id: ["Select a beneficiary for this recipient."] },
      };
    }

    const hasAllocation = existing.allocations.some(
      (allocation) => allocation.status === "ALLOCATED"
    );
    if (hasAllocation && input.requested_volume !== existing.requested_volume) {
      return {
        success: false,
        errors: {
          requested_volume: [
            "Requested volume cannot be changed after milk has been allocated.",
          ],
        },
      };
    }

    const nextStatus = statusForRequestInput(input);
    if (hasAllocation && nextStatus !== "QUEUED") {
      return {
        success: false,
        errors: {
          _form: ["Allocated requests must keep all requirements complete."],
        },
      };
    }

    const request = await db.milkRequest.update({
      where: { request_id: input.request_id },
      data: {
        beneficiary_id: input.beneficiary_id,
        requested_volume: input.requested_volume,
        reason: (input.reason ?? "").trim(),
        priority: input.priority,
        needed_by: input.needed_by,
        remarks: clean(input.remarks),
        profile_complete: input.profile_complete,
        beneficiary_complete: input.beneficiary_complete,
        reason_provided: input.reason_provided,
        volume_entered: input.volume_entered,
        staff_approved: input.staff_approved,
        status: existing.status === "READY_FOR_RELEASE" ? existing.status : nextStatus,
      },
      select: { request_id: true, request_no: true, status: true },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Updated milk request ${request.request_no}; status ${request.status}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    revalidatePath("/dashboard/distribution");
    return { success: true, data: request, message: requestMessage(request.status) };
  } catch (err) {
    console.error("[updateMilkRequest] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}

export async function cancelRecipientMilkRequest(rawInput: unknown) {
  const parsed = cancelRecipientMilkRequestSchema.safeParse(rawInput);

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
    const existing = await db.milkRequest.findUnique({
      where: { request_id: input.request_id },
      select: { status: true },
    });

    if (!existing || existing.status === "RELEASED") {
      return {
        success: false,
        errors: { _form: ["Released requests cannot be cancelled here."] },
      };
    }

    await db.$transaction(async (tx) => {
      const allocations = await tx.milkRequestAllocation.findMany({
        where: { request_id: input.request_id, status: "ALLOCATED" },
        select: {
          allocation_id: true,
          batch_id: true,
          volume: true,
        },
      });

      for (const allocation of allocations) {
        await tx.inventory.update({
          where: { batch_id: allocation.batch_id },
          data: { available_vol: { increment: allocation.volume } },
        });

        await tx.batch.updateMany({
          where: { batch_id: allocation.batch_id, status: "DISPENSED" },
          data: { status: "AVAILABLE" },
        });

        await tx.milkRequestAllocation.update({
          where: { allocation_id: allocation.allocation_id },
          data: { status: "CANCELLED" },
        });
      }

      await tx.milkRequest.update({
        where: { request_id: input.request_id },
        data: {
          status: "CANCELLED",
          cancellation_reason: input.cancellation_reason,
          cancelled_at: new Date(),
          allocated_volume: 0,
        },
      });
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Cancelled milk request #${input.request_id}: ${input.cancellation_reason}`,
      },
    });

    revalidatePath("/dashboard/recipients");
    revalidatePath("/dashboard/distribution");
    return { success: true };
  } catch (err) {
    console.error("[cancelRecipientMilkRequest] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}
