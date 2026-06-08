"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { createStaffSchema, updateStaffSchema } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";

export async function createStaffMember(rawInput: unknown) {
  const parsed = createStaffSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { email, full_name, role, password } = parsed.data;

  try {
    const user = await db.user.create({
      data: {
        auth_id: `manual-${Date.now()}`,
        email,
        full_name,
        role,
        password,
        is_active: true,
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
          action_details: `Created staff member: ${full_name} (${email}) as ${role}`,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true, data: user };
  } catch (err) {
    console.error("[createStaffMember]", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function toggleStaffActive(userId: number, isActive: boolean) {
  try {
    await db.user.update({
      where: { user_id: userId },
      data: { is_active: isActive },
    });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `${isActive ? "Activated" : "Deactivated"} staff member #${userId}`,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    console.error("[toggleStaffActive]", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function updateStaffMember(rawInput: unknown) {
  const parsed = updateStaffSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { user_id, email, full_name, role, password } = parsed.data;

  try {
    const updateData: Record<string, unknown> = { email, full_name, role };
    if (password) {
      updateData.password = password;
    }

    const user = await db.user.update({
      where: { user_id },
      data: updateData,
    });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `Updated staff member #${user_id}: ${full_name} (${email})`,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true, data: user };
  } catch (err) {
    console.error("[updateStaffMember]", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function deleteStaffMember(userId: number) {
  try {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    const targetUser = await db.user.findUnique({
      where: { user_id: userId },
    });

    if (targetUser?.role === "ADMIN" && adminCount <= 1) {
      return {
        success: false,
        errors: { _form: ["Cannot delete the last admin account."] },
      };
    }

    await db.user.delete({ where: { user_id: userId } });

    const actingUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { user_id: true },
    });

    if (actingUser) {
      await db.auditLog.create({
        data: {
          user_id: actingUser.user_id,
          action_details: `Deleted staff member #${userId} (${targetUser?.full_name ?? targetUser?.email ?? "unknown"})`,
        },
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err) {
    console.error("[deleteStaffMember]", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}
