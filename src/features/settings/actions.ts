"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";

export async function updateStaffRole(userId: number, role: "ADMIN" | "STAFF" | "DONOR") {
  try {
    await db.user.update({
      where: { user_id: userId },
      data: { role },
    });
    revalidatePath("/dashboard/settings");
    return { success: true as const, data: null };
  } catch {
    return {
      success: false as const,
      errors: { general: ["Failed to update staff role"] },
    };
  }
}
