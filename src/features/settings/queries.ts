"use server";

import { db } from "@/core/db";

export async function getStaffDirectory() {
  return db.user.findMany({
    select: {
      user_id: true,
      email: true,
      role: true,
    },
    orderBy: { user_id: "asc" },
  });
}

export async function getStaffCount() {
  const total = await db.user.count();
  return { total };
}

export async function getRecentAuditLogs(limit = 5) {
  return db.auditLog.findMany({
    orderBy: { action_date: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
  });
}
