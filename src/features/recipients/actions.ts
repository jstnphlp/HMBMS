"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  createRecipientSchema,
  updateRecipientSchema,
  type CreateRecipientInput,
  type UpdateRecipientInput,
} from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";
import { getRecipientById } from "./queries";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function getRecipientDetail(beneficiaryId: number) {
  if (!Number.isInteger(beneficiaryId) || beneficiaryId <= 0) {
    return null;
  }

  return getRecipientById(beneficiaryId);
}

export async function createRecipient(
  rawInput: unknown
): Promise<ActionResult<{ beneficiary_id: number }>> {
  const parsed = createRecipientSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateRecipientInput = parsed.data;

  try {
    const beneficiary = await db.beneficiary.create({
      data: {
        name: input.name,
        contact_no: input.contact_no,
        remarks: input.remarks ?? null,
      },
    });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `Created recipient: ${input.name} (REC-${String(beneficiary.beneficiary_id).padStart(4, "0")})`,
        },
      });
    }

    revalidatePath("/dashboard/recipients");
    return { success: true, data: { beneficiary_id: beneficiary.beneficiary_id } };
  } catch (err) {
    console.error("[createRecipient] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function updateRecipient(
  beneficiaryId: number,
  rawInput: unknown
): Promise<ActionResult<{ beneficiary_id: number }>> {
  const parsed = updateRecipientSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: UpdateRecipientInput = parsed.data;

  const existing = await db.beneficiary.findUnique({
    where: { beneficiary_id: beneficiaryId },
  });

  if (!existing) {
    return {
      success: false,
      errors: { beneficiary_id: ["Recipient not found"] },
    };
  }

  try {
    await db.beneficiary.update({
      where: { beneficiary_id: beneficiaryId },
      data: {
        name: input.name,
        contact_no: input.contact_no,
        remarks: input.remarks ?? null,
      },
    });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `Updated recipient #${beneficiaryId}: ${input.name}`,
        },
      });
    }

    revalidatePath("/dashboard/recipients");
    return { success: true, data: { beneficiary_id: beneficiaryId } };
  } catch (err) {
    console.error("[updateRecipient] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function deleteRecipient(
  beneficiaryId: number
): Promise<ActionResult<{ beneficiary_id: number }>> {
  const existing = await db.beneficiary.findUnique({
    where: { beneficiary_id: beneficiaryId },
    include: { dispensings: true },
  });

  if (!existing) {
    return {
      success: false,
      errors: { beneficiary_id: ["Recipient not found"] },
    };
  }

  if (existing.dispensings.length > 0) {
    return {
      success: false,
      errors: {
        beneficiary_id: [
          "Cannot delete recipient with existing dispensing records",
        ],
      },
    };
  }

  try {
    await db.beneficiary.delete({
      where: { beneficiary_id: beneficiaryId },
    });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `Deleted recipient #${beneficiaryId} (${existing.name})`,
        },
      });
    }

    revalidatePath("/dashboard/recipients");
    return { success: true, data: { beneficiary_id: beneficiaryId } };
  } catch (err) {
    console.error("[deleteRecipient] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}
