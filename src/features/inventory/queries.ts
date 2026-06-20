"use server";

import { db } from "@/core/db";

export type InventorySummary = {
  totalStockMl: number;
  totalCollections: number;
  totalDispensedMl: number;
  totalDisposedMl: number;
  activeBatches: number;
};

export type CollectionLogEntry = {
  ctn: number;
  collectionDate: string;
  donorId: string;
  donorName: string;
  program: string;
  volume: number;
  batchCode: string | null;
  status: string;
};

export type DisposalLogEntry = {
  disposalId: number;
  disposalDate: string;
  batchCode: string;
  reason: string;
  volume: number;
  disposedByName: string;
  remarks: string | null;
};

export async function getInventorySummary(): Promise<InventorySummary> {
  const [inventoryAgg, collectionsAgg, dispensingsAgg, disposalsAgg, activeBatches] =
    await Promise.all([
      db.inventory.aggregate({ _sum: { available_vol: true } }),
      db.collection.aggregate({ _sum: { volume: true }, _count: true }),
      db.dispensing.aggregate({ _sum: { volume: true } }),
      db.disposal.aggregate({ _sum: { volume: true } }),
      db.batch.count({ where: { status: { notIn: ["DISPOSED", "DISPENSED"] } } }),
    ]);

  return {
    totalStockMl: inventoryAgg._sum.available_vol ?? 0,
    totalCollections: collectionsAgg._count,
    totalDispensedMl: dispensingsAgg._sum.volume ?? 0,
    totalDisposedMl: disposalsAgg._sum.volume ?? 0,
    activeBatches,
  };
}

export async function getCollectionLogs(limit = 25): Promise<CollectionLogEntry[]> {
  const collections = await db.collection.findMany({
    take: limit,
    orderBy: { collection_date: "desc" },
    include: {
      donor: { select: { donor_id: true, first_name: true, last_name: true } },
      batch: { select: { batch_code: true, status: true } },
    },
  });

  return collections.map((c) => ({
    ctn: c.ctn,
    collectionDate: c.collection_date.toISOString(),
    donorId: `DNR-${String(c.donor.donor_id).padStart(4, "0")}`,
    donorName: `${c.donor.first_name} ${c.donor.last_name}`,
    program: c.program,
    volume: c.volume,
    batchCode: c.batch?.batch_code ?? null,
    status: c.batch?.status ?? "UNASSIGNED",
  }));
}

export async function getDisposalLogs(limit = 25): Promise<DisposalLogEntry[]> {
  const disposals = await db.disposal.findMany({
    take: limit,
    orderBy: { disposal_date: "desc" },
    include: {
      batch: { select: { batch_code: true } },
      disposer: { select: { email: true } },
    },
  });

  return disposals.map((d) => ({
    disposalId: d.disposal_id,
    disposalDate: d.disposal_date.toISOString(),
    batchCode: d.batch.batch_code,
    reason: d.reason,
    volume: d.volume,
    disposedByName: d.disposer.email,
    remarks: d.remarks,
  }));
}
