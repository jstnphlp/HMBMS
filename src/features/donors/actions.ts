"use server";

import { db } from "@/core/db";
import type { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { registerDonorSchema, updateDonorSchema, logDropoffSchema } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  formatCollectionTrackingNo,
  formatDonorTrackingNo,
} from "@/core/utils/tracking";
import { getDonorById } from "./queries";

async function nextStandaloneCollectionTrackingNo(
  tx: Prisma.TransactionClient,
  donorId: number
) {
  const [workflowMax, collectionCount] = await Promise.all([
    tx.supsupTodoDonationWorkflow.aggregate({
      where: { donor_id: donorId },
      _max: { sample_sequence: true },
    }),
    tx.collection.count({ where: { donor_id: donorId } }),
  ]);
  const sequence = Math.max(workflowMax._max.sample_sequence ?? 0, collectionCount) + 1;
  return formatCollectionTrackingNo(donorId, sequence);
}

export async function getDonorDetail(donorId: number) {
  if (!Number.isInteger(donorId) || donorId <= 0) {
    return null;
  }

  return getDonorById(donorId);
}

export async function registerDonor(formData: FormData) {
  const raw = {
    first_name: formData.get("first_name") as string,
    middle_name: formData.get("middle_name") as string,
    last_name: formData.get("last_name") as string,
    birthdate: formData.get("birthdate") as string,
    address: formData.get("address") as string,
    contact_no: formData.get("contact_no") as string,
    civil_status: formData.get("civil_status") as string,
    religion: formData.get("religion") as string,
    occupation: formData.get("occupation") as string,
    spouse_name: formData.get("spouse_name") as string,
    spouse_occupation: formData.get("spouse_occupation") as string,
    spouse_contact_no: formData.get("spouse_contact_no") as string,
    delivery_date: formData.get("delivery_date") as string,
    delivery_place: formData.get("delivery_place") as string,
    delivery_type: formData.get("delivery_type") as string,
    aog: formData.get("aog") as string,
    pregnancy_delivery_details: formData.get("pregnancy_delivery_details") as string,
    infant_name: formData.get("infant_name") as string,
    infant_birthdate: formData.get("infant_birthdate") as string,
    infant_sex: formData.get("infant_sex") as string,
    infant_birth_weight: formData.get("infant_birth_weight") as string,
    infant_details: formData.get("infant_details") as string,
  };

  const parsed = registerDonorSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const user = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { user_id: true },
  });

  if (!user) {
    throw new Error(
      "Unauthenticated: no session user found. Auth must be wired before this action can run."
    );
  }

  try {
    const donor = await db.donor.create({
      data: {
        user_id: user.user_id,
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        birthdate: data.birthdate,
        address: data.address,
        contact_no: data.contact_no,
        civil_status: data.civil_status,
        religion: data.religion || null,
        occupation: data.occupation || null,
        spouse_name: data.spouse_name || null,
        spouse_occupation: data.spouse_occupation || null,
        spouse_contact_no: data.spouse_contact_no || null,
        delivery_date: data.delivery_date ?? null,
        delivery_place: data.delivery_place || null,
        delivery_type: data.delivery_type || null,
        aog: data.aog || null,
        pregnancy_delivery_details: data.pregnancy_delivery_details || null,
        infant_name: data.infant_name || null,
        infant_birthdate: data.infant_birthdate ?? null,
        infant_sex: data.infant_sex || null,
        infant_birth_weight: data.infant_birth_weight || null,
        infant_details: data.infant_details || null,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: user.user_id,
        action_details: `Registered new donor: ${data.first_name} ${data.last_name} (${formatDonorTrackingNo(donor.donor_id)})`,
      },
    });

    revalidatePath("/dashboard/donors");
    return { success: true };
  } catch (err) {
    console.error("[registerDonor] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function updateDonor(donorId: number, formData: FormData) {
  const raw = {
    first_name: formData.get("first_name") as string,
    middle_name: formData.get("middle_name") as string,
    last_name: formData.get("last_name") as string,
    birthdate: formData.get("birthdate") as string,
    address: formData.get("address") as string,
    contact_no: formData.get("contact_no") as string,
    civil_status: formData.get("civil_status") as string,
    religion: formData.get("religion") as string,
    occupation: formData.get("occupation") as string,
    spouse_name: formData.get("spouse_name") as string,
    spouse_occupation: formData.get("spouse_occupation") as string,
    spouse_contact_no: formData.get("spouse_contact_no") as string,
    delivery_date: (formData.get("delivery_date") ?? "") as string,
    delivery_place: (formData.get("delivery_place") ?? "") as string,
    delivery_type: (formData.get("delivery_type") ?? "") as string,
    aog: (formData.get("aog") ?? "") as string,
    pregnancy_delivery_details: (formData.get("pregnancy_delivery_details") ?? "") as string,
    infant_name: (formData.get("infant_name") ?? "") as string,
    infant_birthdate: (formData.get("infant_birthdate") ?? "") as string,
    infant_sex: (formData.get("infant_sex") ?? "") as string,
    infant_birth_weight: (formData.get("infant_birth_weight") ?? "") as string,
    infant_details: (formData.get("infant_details") ?? "") as string,
    status: formData.get("status") as string,
  };

  const parsed = updateDonorSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  try {
    await db.donor.update({
      where: { donor_id: donorId },
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name || null,
        last_name: data.last_name,
        birthdate: data.birthdate,
        address: data.address,
        contact_no: data.contact_no,
        civil_status: data.civil_status,
        religion: data.religion || null,
        occupation: data.occupation || null,
        spouse_name: data.spouse_name || null,
        spouse_occupation: data.spouse_occupation || null,
        spouse_contact_no: data.spouse_contact_no || null,
        delivery_date: data.delivery_date ?? null,
        delivery_place: data.delivery_place || null,
        delivery_type: data.delivery_type || null,
        aog: data.aog || null,
        pregnancy_delivery_details: data.pregnancy_delivery_details || null,
        infant_name: data.infant_name || null,
        infant_birthdate: data.infant_birthdate ?? null,
        infant_sex: data.infant_sex || null,
        infant_birth_weight: data.infant_birth_weight || null,
        infant_details: data.infant_details || null,
        status: data.status,
      },
    });

    const user = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (user) {
      await db.auditLog.create({
        data: {
          user_id: user.user_id,
          action_details: `Updated donor #${donorId}: ${data.first_name} ${data.last_name}`,
        },
      });
    }

    revalidatePath("/dashboard/donors");
    return { success: true };
  } catch (err) {
    console.error("[updateDonor] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function recordDropoff(donorId: number, formData: FormData) {
  const raw = {
    collection_date: formData.get("collection_date") as string,
    volume: formData.get("volume") as string,
    program: formData.get("program") as string,
    remarks: formData.get("remarks") as string,
    is_pasteurized: formData.get("is_pasteurized") as string,
    batch_no: formData.get("batch_no") as string,
    bottle_no: formData.get("bottle_no") as string,
    expiration_date: formData.get("expiration_date") as string,
    dtn: formData.get("dtn") as string,
    aob: formData.get("aob") as string,
    collected_by: formData.get("collected_by") as string,
  };

  const parsed = logDropoffSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const user = await db.user.findFirst({
    where: { role: "ADMIN" },
    select: { user_id: true },
  });

  if (!user) {
    throw new Error(
      "Unauthenticated: no session user found. Auth must be wired before this action can run."
    );
  }

  try {
    if (data.is_pasteurized) {
      const bottleNo =
        data.bottle_no && data.bottle_no.length > 0
          ? data.bottle_no
          : `BT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await db.$transaction(async (tx) => {
        const trackingNo = await nextStandaloneCollectionTrackingNo(tx, donorId);
        const batch = await tx.batch.create({
          data: {
            batch_code: data.batch_no!,
            pooling_date: data.collection_date,
            total_volume: data.volume,
            remaining_volume: data.volume,
            status: "AVAILABLE",
            created_by: user.user_id,
          },
        });

        await tx.collection.create({
          data: {
            donor_id: donorId,
            tracking_no: trackingNo,
            recorded_by: user.user_id,
            program: data.program,
            collection_date: data.collection_date,
            volume: data.volume,
            remarks: data.remarks || null,
            is_pasteurized: true,
            status: "READY_FOR_DISPENSING",
            batch_no: data.batch_no || null,
            bottle_no: bottleNo,
            expiration_date: data.expiration_date ?? null,
            batch_id: batch.batch_id,
          },
        });

        await tx.inventory.create({
          data: {
            batch_id: batch.batch_id,
            donated_vol: data.volume,
            pasteurized_vol: data.volume,
            available_vol: data.volume,
            updated_by: user.user_id,
          },
        });

        await tx.auditLog.create({
          data: {
            user_id: user.user_id,
            action_details: `Recorded pasteurized drop-off (${data.volume} mL) for donor #${donorId}, batch ${data.batch_no}`,
          },
        });
      });
    } else {
      await db.$transaction(async (tx) => {
        const trackingNo = await nextStandaloneCollectionTrackingNo(tx, donorId);
        const batch = await tx.batch.create({
          data: {
            batch_code: `UNP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            pooling_date: data.collection_date,
            total_volume: data.volume,
            remaining_volume: data.volume,
            status: "TESTING",
            created_by: user.user_id,
          },
        });

        await tx.collection.create({
          data: {
            donor_id: donorId,
            tracking_no: trackingNo,
            recorded_by: user.user_id,
            program: data.program,
            collection_date: data.collection_date,
            volume: data.volume,
            remarks: data.remarks || null,
            is_pasteurized: false,
            status: "PENDING_LAB_TEST",
            dtn: data.dtn || null,
            aob: data.aob || null,
            collected_by: data.collected_by || null,
            expiration_date: data.expiration_date ?? null,
            batch_id: batch.batch_id,
          },
        });

        await tx.labResult.create({
          data: {
            batch_id: batch.batch_id,
            stage: "PRE_PASTEURIZATION",
            test_date: new Date(),
            result: "PENDING",
            tested_by: user.user_id,
          },
        });

        await tx.auditLog.create({
          data: {
            user_id: user.user_id,
            action_details: `Recorded unpasteurized drop-off (${data.volume} mL) for donor #${donorId}, routed to lab as batch ${batch.batch_code}`,
          },
        });
      });
    }

    revalidatePath("/dashboard/donors");
    revalidatePath("/dashboard/laboratory");
    return { success: true };
  } catch (err) {
    console.error("[recordDropoff] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}
