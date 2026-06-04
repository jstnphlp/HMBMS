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

  const [volumeAgg, dispensings, beneficiaryCount, todayCount] =
    await Promise.all([
      db.dispensing.aggregate({ _sum: { volume: true, total: true } }),
      db.dispensing.count(),
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
    include: {
      dispensings: {
        orderBy: { dispensing_date: "desc" },
      },
    },
    orderBy: { beneficiary_id: "desc" },
  });

  return beneficiaries.map((b) => {
    const totalVolume = b.dispensings.reduce((sum, d) => sum + d.volume, 0);
    const lastDispensing = b.dispensings[0] ?? null;

    return {
      beneficiary_id: b.beneficiary_id,
      contact_no: b.contact_no,
      remarks: b.remarks,
      lastDispensingDate: lastDispensing?.dispensing_date.toISOString() ?? null,
      totalVolume,
      dispensingCount: b.dispensings.length,
    };
  });
}

export async function getDispensingLogs(
  limit = 50
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
