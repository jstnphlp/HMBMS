"use server";

import { db } from "@/core/db";

export type DispensingMetrics = {
  totalDispensedMl: number;
  totalRevenue: number;
  activeBeneficiaries: number;
  todayDistributions: number;
};

export type BeneficiaryEntry = {
  beneficiary_id: number;
  contact_no: string;
  remarks: string | null;
  lastDispensingDate: string | null;
  totalVolume: number;
  dispensingCount: number;
};

export type DispensingLogEntry = {
  dis_id: number;
  dispensingDate: string;
  batchCode: string;
  beneficiaryId: string;
  beneficiaryContact: string;
  volume: number;
  price: number;
  total: number;
  dispensedByName: string;
  remarks: string | null;
};

export type AvailableBatch = {
  batch_id: number;
  batch_code: string;
  available_vol: number;
  status: string;
};

export async function getDispensingMetrics(): Promise<DispensingMetrics> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [volumeAgg, beneficiaryCount, todayCount] =
    await Promise.all([
      db.dispensing.aggregate({ _sum: { volume: true, total: true } }),
      db.beneficiary.count(),
      db.dispensing.count({
        where: { dispensing_date: { gte: startOfDay } },
      }),
    ]);

  return {
    totalDispensedMl: volumeAgg._sum.volume ?? 0,
    totalRevenue: volumeAgg._sum.total ?? 0,
    activeBeneficiaries: beneficiaryCount,
    todayDistributions: todayCount,
  };
}

export async function getBeneficiaries(): Promise<BeneficiaryEntry[]> {
  const beneficiaries = await db.beneficiary.findMany({
    take: 25,
    select: {
      beneficiary_id: true,
      contact_no: true,
      remarks: true,
    },
    orderBy: { beneficiary_id: "desc" },
  });

  const beneficiaryIds = beneficiaries.map((b) => b.beneficiary_id);
  const [dispensingStats, latestDispensings] = beneficiaryIds.length
    ? await Promise.all([
        db.dispensing.groupBy({
          by: ["beneficiary_id"],
          where: { beneficiary_id: { in: beneficiaryIds } },
          _sum: { volume: true },
          _count: true,
        }),
        db.dispensing.findMany({
          where: { beneficiary_id: { in: beneficiaryIds } },
          select: { beneficiary_id: true, dispensing_date: true },
          orderBy: { dispensing_date: "desc" },
        }),
      ])
    : [[], []];

  const statsByRecipient = new Map(
    dispensingStats.map((stat) => [
      stat.beneficiary_id,
      {
        totalVolume: stat._sum.volume ?? 0,
        dispensingCount: stat._count,
      },
    ])
  );
  const latestByRecipient = new Map<
    number,
    (typeof latestDispensings)[number]
  >();

  for (const dispensing of latestDispensings) {
    if (!latestByRecipient.has(dispensing.beneficiary_id)) {
      latestByRecipient.set(dispensing.beneficiary_id, dispensing);
    }
  }

  return beneficiaries.map((b) => {
    const stats = statsByRecipient.get(b.beneficiary_id);
    const lastDispensing = latestByRecipient.get(b.beneficiary_id) ?? null;

    return {
      beneficiary_id: b.beneficiary_id,
      contact_no: b.contact_no,
      remarks: b.remarks,
      lastDispensingDate: lastDispensing?.dispensing_date.toISOString() ?? null,
      totalVolume: stats?.totalVolume ?? 0,
      dispensingCount: stats?.dispensingCount ?? 0,
    };
  });
}

export async function getDispensingLogs(
  limit = 25
): Promise<DispensingLogEntry[]> {
  const dispensings = await db.dispensing.findMany({
    take: limit,
    orderBy: { dispensing_date: "desc" },
    include: {
      batch: { select: { batch_code: true } },
      beneficiary: { select: { beneficiary_id: true, contact_no: true } },
      dispenser: { select: { email: true } },
    },
  });

  return dispensings.map((d) => ({
    dis_id: d.dis_id,
    dispensingDate: d.dispensing_date.toISOString(),
    batchCode: d.batch.batch_code,
    beneficiaryId: `REC-${String(d.beneficiary.beneficiary_id).padStart(4, "0")}`,
    beneficiaryContact: d.beneficiary.contact_no,
    volume: d.volume,
    price: d.price,
    total: d.total,
    dispensedByName: d.dispenser.email,
    remarks: d.remarks,
  }));
}

export async function getAvailableBatches(): Promise<AvailableBatch[]> {
  const batches = await db.batch.findMany({
    where: {
      status: "AVAILABLE",
      inventory: { isNot: null },
    },
    include: {
      inventory: { select: { available_vol: true } },
    },
    take: 50,
    orderBy: { created_at: "desc" },
  });

  return batches
    .filter((b) => b.inventory && b.inventory.available_vol > 0)
    .map((b) => ({
      batch_id: b.batch_id,
      batch_code: b.batch_code,
      available_vol: b.inventory!.available_vol,
      status: b.status,
    }));
}
