"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/core/db";
import { getCurrentUser } from "@/features/auth/actions";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  createMilkRequestSchema,
  createRecipientSchema,
  type CreateMilkRequestInput,
  type CreateRecipientInput,
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
    input.reason.trim().length > 0 &&
    input.requested_volume > 0
  );
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
    const [recipient, beneficiary, duplicateActive] = await Promise.all([
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
      db.milkRequest.findFirst({
        where: {
          recipient_id: input.recipient_id,
          beneficiary_id: input.beneficiary_id,
          status: { in: ["QUEUED", "READY_FOR_RELEASE"] },
        },
        select: { request_no: true, status: true },
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

    if (duplicateActive) {
      return {
        success: false,
        errors: {
          _form: [
            `This recipient and beneficiary already have active request ${duplicateActive.request_no} (${duplicateActive.status}). Resolve it before creating another queued request.`,
          ],
        },
      };
    }

    const complete = requirementsComplete(input);
    const status = complete ? "QUEUED" : "INCOMPLETE";
    const requestNo = `MR-${Date.now().toString(36).toUpperCase()}`;

    const request = await db.milkRequest.create({
      data: {
        request_no: requestNo,
        recipient_id: input.recipient_id,
        beneficiary_id: input.beneficiary_id,
        requested_volume: input.requested_volume,
        reason: input.reason.trim(),
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
      message: complete
        ? "Milk request entered the distribution queue."
        : "Complete the recipient requirements before queueing this milk request.",
    };
  } catch (err) {
    console.error("[createMilkRequest] error:", err);
    return { success: false, errors: { _form: [mapPrismaError(err)] } };
  }
}
