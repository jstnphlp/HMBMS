"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  createRecipientSchema,
  updateRecipientSchema,
  type CreateRecipientInput,
  type UpdateRecipientInput,
} from "./schemas";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function createRecipient(
  rawInput: unknown
): Promise<ActionResult<{ beneficiary_id: number }>> {
  const parsed = createRecipientSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateRecipientInput = parsed.data;

  const beneficiary = await db.beneficiary.create({
    data: {
      contact_no: input.contact_no,
      remarks: input.remarks ?? null,
    },
  });

  revalidatePath("/dashboard/recipients");
  return { success: true, data: { beneficiary_id: beneficiary.beneficiary_id } };
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

  await db.beneficiary.update({
    where: { beneficiary_id: beneficiaryId },
    data: {
      contact_no: input.contact_no,
      remarks: input.remarks ?? null,
    },
  });

  revalidatePath("/dashboard/recipients");
  return { success: true, data: { beneficiary_id: beneficiaryId } };
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

  await db.beneficiary.delete({
    where: { beneficiary_id: beneficiaryId },
  });

  revalidatePath("/dashboard/recipients");
  return { success: true, data: { beneficiary_id: beneficiaryId } };
}
