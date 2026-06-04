"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import {
  createDispensingSchema,
  type CreateDispensingInput,
  createBeneficiarySchema,
  type CreateBeneficiaryInput,
} from "./schemas";

export async function recordDispensing(rawInput: unknown) {
  const parsed = createDispensingSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateDispensingInput = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { batch_id: input.batch_id },
      });

      if (!inventory || inventory.available_vol < input.volume) {
        throw new Error("INSUFFICIENT_VOLUME");
      }

      const dispensing = await tx.dispensing.create({
        data: {
          batch_id: input.batch_id,
          beneficiary_id: input.beneficiary_id,
          dispensed_by: input.dispensed_by,
          dispensing_date: input.dispensing_date,
          volume: input.volume,
          price: input.price,
          total: input.volume * input.price,
          remarks: input.remarks,
        },
      });

      const newAvailable = inventory.available_vol - input.volume;

      await tx.inventory.update({
        where: { batch_id: input.batch_id },
        data: { available_vol: Math.max(0, newAvailable) },
      });

      if (newAvailable <= 0) {
        await tx.batch.update({
          where: { batch_id: input.batch_id },
          data: { status: "DISPENSED" },
        });
      }

      return dispensing;
    });

    revalidatePath("/dashboard/dispensing");
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_VOLUME") {
      return {
        success: false,
        errors: {
          volume: ["Requested volume exceeds available stock for this batch."],
        },
      };
    }
    return {
      success: false,
      errors: { _form: ["Failed to record dispensing. Please try again."] },
    };
  }
}

export async function createBeneficiary(rawInput: unknown) {
  const parsed = createBeneficiarySchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input: CreateBeneficiaryInput = parsed.data;

  try {
    const beneficiary = await db.beneficiary.create({
      data: {
        name: input.name,
        contact_no: input.contact_no,
        remarks: input.remarks,
      },
    });

    revalidatePath("/dashboard/dispensing");
    return { success: true, data: beneficiary };
  } catch {
    return {
      success: false,
      errors: {
        _form: ["Failed to register beneficiary. Please try again."],
      },
    };
  }
}
