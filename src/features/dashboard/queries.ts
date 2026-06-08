"use server";

import { db } from "@/core/db";

export async function getDashboardSummary() {
  const [totalStockResult, pendingLabTests, activeDonors, awaitingDispensing] =
    await Promise.all([
      db.inventory.aggregate({ _sum: { available_vol: true } }),
      db.labResult.count({ where: { result: "PENDING" } }),
      db.donor.count({ where: { status: "ACTIVE" } }),
      db.batch.count({ where: { status: "AVAILABLE" } }),
    ]);

  return {
    totalStock: totalStockResult._sum.available_vol ?? 0,
    pendingLabTests,
    activeDonors,
    awaitingDispensing,
  };
}

export async function getRecentInventory() {
  return db.batch.findMany({
    orderBy: { created_at: "desc" },
    take: 10,
    include: {
      collections: {
        take: 1,
        include: {
          donor: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      inventory: {
        select: { available_vol: true },
      },
    },
  });
}
