"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { registerDonorSchema } from "./schemas";

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
    infant_name: formData.get("infant_name") as string,
    infant_birthdate: formData.get("infant_birthdate") as string,
    infant_sex: formData.get("infant_sex") as string,
    infant_birth_weight: formData.get("infant_birth_weight") as string,
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
    return {
      success: false,
      errors: { _form: ["No admin user found to assign as owner."] },
    };
  }

  await db.donor.create({
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
      infant_name: data.infant_name || null,
      infant_birthdate: data.infant_birthdate ?? null,
      infant_sex: data.infant_sex || null,
      infant_birth_weight: data.infant_birth_weight || null,
    },
  });

  revalidatePath("/dashboard/donors");
  return { success: true };
}
