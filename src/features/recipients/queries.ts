"use server";

import { db } from "@/core/db";

export interface RecipientWithStats {
  beneficiary_id: number;
  name: string;
  contact_no: string;
  remarks: string | null;
  total_volume: number;
  dispensing_count: number;
  last_dispensing_date: Date | null;
  sms_count: number;
}

export interface RecipientDetail extends RecipientWithStats {
  dispensings: {
    dis_id: number;
    dispensing_date: Date;
    volume: number;
    price: number;
    total: number;
    remarks: string | null;
    batch: {
      batch_code: string;
      status: string;
    };
    dispenser: {
      email: string;
    };
  }[];
  sms_history: {
    sms_id: number;
    message: string;
    status: string;
    scheduled_at: Date;
    sent_at: Date | null;
  }[];
}

export interface RecipientMetrics {
  total_recipients: number;
  active_recipients: number;
  total_volume_dispensed: number;
  pending_allocations: number;
}

export async function getRecipientsWithStats(): Promise<RecipientWithStats[]> {
  const beneficiaries = await db.beneficiary.findMany({
    take: 25,
    select: {
      beneficiary_id: true,
      name: true,
      contact_no: true,
      remarks: true,
    },
    orderBy: { beneficiary_id: "desc" },
  });

  const beneficiaryIds = beneficiaries.map((b) => b.beneficiary_id);

  const [dispensingStats, latestDispensings, smsStats] = beneficiaryIds.length
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
        db.sMS.groupBy({
          by: ["beneficiary_id"],
          where: { beneficiary_id: { in: beneficiaryIds } },
          _count: true,
        }),
      ])
    : [[], [], []];

  const statsByRecipient = new Map(
    dispensingStats.map((stat) => [
      stat.beneficiary_id,
      {
        total_volume: stat._sum.volume ?? 0,
        dispensing_count: stat._count,
      },
    ])
  );
  const latestByRecipient = new Map<
    number,
    (typeof latestDispensings)[number]
  >();
  const smsCountByRecipient = new Map(
    smsStats.map((stat) => [stat.beneficiary_id, stat._count])
  );

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
      name: b.name,
      contact_no: b.contact_no,
      remarks: b.remarks,
      total_volume: stats?.total_volume ?? 0,
      dispensing_count: stats?.dispensing_count ?? 0,
      last_dispensing_date: lastDispensing?.dispensing_date ?? null,
      sms_count: smsCountByRecipient.get(b.beneficiary_id) ?? 0,
    };
  });
}

export async function getRecipientById(
  beneficiaryId: number
): Promise<RecipientDetail | null> {
  const beneficiary = await db.beneficiary.findUnique({
    where: { beneficiary_id: beneficiaryId },
    include: {
      dispensings: {
        orderBy: { dispensing_date: "desc" },
        include: {
          batch: { select: { batch_code: true, status: true } },
          dispenser: { select: { email: true } },
        },
      },
      sms: {
        orderBy: { scheduled_at: "desc" },
      },
    },
  });

  if (!beneficiary) return null;

  const totalVolume = beneficiary.dispensings.reduce(
    (sum, d) => sum + d.volume,
    0
  );
  const lastDispensing = beneficiary.dispensings[0] ?? null;

  return {
    beneficiary_id: beneficiary.beneficiary_id,
    name: beneficiary.name,
    contact_no: beneficiary.contact_no,
    remarks: beneficiary.remarks,
    total_volume: totalVolume,
    dispensing_count: beneficiary.dispensings.length,
    last_dispensing_date: lastDispensing?.dispensing_date ?? null,
    sms_count: beneficiary.sms.length,
    dispensings: beneficiary.dispensings.map((d) => ({
      dis_id: d.dis_id,
      dispensing_date: d.dispensing_date,
      volume: d.volume,
      price: d.price,
      total: d.total,
      remarks: d.remarks,
      batch: {
        batch_code: d.batch.batch_code,
        status: d.batch.status,
      },
      dispenser: {
        email: d.dispenser.email,
      },
    })),
    sms_history: beneficiary.sms.map((s) => ({
      sms_id: s.sms_id,
      message: s.message,
      status: s.status,
      scheduled_at: s.scheduled_at,
      sent_at: s.sent_at,
    })),
  };
}

export async function getRecipientMetrics(): Promise<RecipientMetrics> {
  const [totalBeneficiaries, volumeAgg, totalDispensings] =
    await Promise.all([
      db.beneficiary.count(),
      db.dispensing.aggregate({ _sum: { volume: true } }),
      db.dispensing.count(),
    ]);

  const activeRecipients = await db.beneficiary.count({
    where: {
      dispensings: {
        some: {},
      },
    },
  });

  return {
    total_recipients: totalBeneficiaries,
    active_recipients: activeRecipients,
    total_volume_dispensed: volumeAgg._sum.volume ?? 0,
    pending_allocations: totalDispensings > 0 ? 0 : totalBeneficiaries,
  };
}
