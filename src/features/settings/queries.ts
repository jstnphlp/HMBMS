"use server";

import { db } from "@/core/db";

export async function getStaffMembers() {
  return db.user.findMany({
    orderBy: { created_at: "asc" },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });
}

export async function getActiveStaffCount() {
  return db.user.count({ where: { is_active: true } });
}

export async function getRecentAuditLogs(limit = 10) {
  return db.auditLog.findMany({
    orderBy: { action_date: "desc" },
    take: limit,
    include: {
      user: {
        select: { email: true, full_name: true },
      },
    },
  });
}
