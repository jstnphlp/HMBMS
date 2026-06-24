"use server";

import { db } from "@/core/db";

export type AnalyticsSummary = {
  totalVolume: number;
  activeDonors: number;
  recipientsServed: number;
  discardRate: number;
};

export type VolumeTrendPoint = {
  week: string;
  input: number;
  output: number;
};

export type ProgramDistSegment = {
  program: string;
  volume: number;
  percentage: number;
};

export type ReportWithUser = {
  report_id: number;
  report_code: string;
  type: string;
  program: string | null;
  date_from: Date;
  date_to: Date;
  generated_at: Date;
  generated_by: number;
  user: { email: string; role: string };
};

export type ReportCategory =
  | "ALL"
  | "COLLECTION"
  | "PROCESSING"
  | "INVENTORY"
  | "DISPENSING"
  | "DISPOSAL"
  | "DONOR"
  | "RECIPIENT";

export type ReportPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export type GeneratedCollectionReport = {
  totalCollectedVolume: number;
  collectionRecords: number;
  collectionsByProgram: { program: string; volume: number; count: number }[];
  collectionsByDonor: { donorName: string; volume: number; count: number }[];
  averageCollectionVolume: number;
  failedOrRejectedCollections: number;
};

export type GeneratedProcessingReport = {
  prePasteurization: {
    totalTested: number;
    passed: number;
    failed: number;
    awaitingResult: number;
  };
  pasteurizationBatches: {
    totalBatches: number;
    totalProcessedVolume: number;
    completed: number;
    inProgress: number;
  };
  postPasteurization: {
    totalTested: number;
    passed: number;
    failed: number;
    awaitingResult: number;
  };
  processingLosses: number;
};

export type GeneratedDispensingReport = {
  totalDispensedVolume: number;
  dispensingTransactions: number;
  recipientsServed: number;
  beneficiariesServed: number;
  volumeBySource: { source: string; volume: number }[];
  paymentStatusSummary: { status: string; count: number; volume: number }[];
  releasedByStaff: { staffName: string; count: number; volume: number }[];
};

export type GeneratedDisposalReport = {
  totalDisposedVolume: number;
  disposedRecords: number;
  reasons: { reason: string; count: number; volume: number }[];
  failedPrePasteurizationCount: number;
  failedPostPasteurizationCount: number;
  expiredMilkCount: number;
};

export type GeneratedInventoryReport = {
  availableStockVolume: number;
  inventoryRecords: number;
  availableBatches: number;
  expiredCollectionCount: number;
  disposedBatches: number;
};

export type GeneratedDonorReport = {
  registeredDonors: number;
  activeDonors: number;
  inactiveDonors: number;
  donorsWithCollections: number;
  donorCollections: { donorName: string; count: number; volume: number }[];
};

export type GeneratedRecipientReport = {
  registeredRecipients: number;
  activeRecipients: number;
  inactiveRecipients: number;
  requestCount: number;
  recipientsServed: number;
  beneficiariesServed: number;
};

export type GeneratedReport = {
  title: string;
  period: ReportPeriod;
  category: ReportCategory;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  collection?: GeneratedCollectionReport;
  processing?: GeneratedProcessingReport;
  inventory?: GeneratedInventoryReport;
  dispensing?: GeneratedDispensingReport;
  disposal?: GeneratedDisposalReport;
  donor?: GeneratedDonorReport;
  recipient?: GeneratedRecipientReport;
  hasRecords: boolean;
};

function normalizeDateRange(dateFrom?: Date, dateTo?: Date) {
  const end = dateTo ?? new Date();
  const start =
    dateFrom ?? new Date(end.getFullYear(), end.getMonth() - 2, end.getDate());
  const maxRangeMs = 93 * 24 * 60 * 60 * 1000;

  if (end.getTime() - start.getTime() > maxRangeMs) {
    return { dateFrom: new Date(end.getTime() - maxRangeMs), dateTo: end };
  }

  return { dateFrom: start, dateTo: end };
}

function reportTitle(period: ReportPeriod, category: ReportCategory, dateFrom: Date) {
  const categoryLabel =
    category === "ALL"
      ? "Operations"
      : category.charAt(0) + category.slice(1).toLowerCase();

  if (period === "MONTHLY") {
    const month = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(dateFrom);
    return `${month} ${categoryLabel} Report`;
  }

  if (period === "YEARLY") {
    return `${dateFrom.getFullYear()} ${categoryLabel} Report`;
  }

  const periodLabel = period.charAt(0) + period.slice(1).toLowerCase();
  return `${periodLabel} ${categoryLabel} Report`;
}

export async function getCollectionReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedCollectionReport> {
  const programFilter =
    program && program !== "ALL"
      ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" }
      : {};
  const [aggregate, byProgram, collections] = await Promise.all([
    db.collection.aggregate({
      _sum: { volume: true },
      _avg: { volume: true },
      _count: true,
      where: { collection_date: { gte: startDate, lte: endDate }, ...programFilter },
    }),
    db.collection.groupBy({
      by: ["program"],
      _sum: { volume: true },
      _count: true,
      where: { collection_date: { gte: startDate, lte: endDate }, ...programFilter },
    }),
    db.collection.findMany({
      where: { collection_date: { gte: startDate, lte: endDate }, ...programFilter },
      include: {
        donor: { select: { first_name: true, last_name: true } },
        supSupTodoWorkflow: {
          select: {
            pre_lab_result: true,
            post_lab_result: true,
            final_status: true,
          },
        },
      },
    }),
  ]);

  const donorMap = new Map<string, { volume: number; count: number }>();
  let failedOrRejectedCollections = 0;

  for (const collection of collections) {
    const donorName = `${collection.donor.first_name} ${collection.donor.last_name}`;
    const current = donorMap.get(donorName) ?? { volume: 0, count: 0 };
    current.volume += collection.volume;
    current.count += 1;
    donorMap.set(donorName, current);

    const workflow = collection.supSupTodoWorkflow;
    if (
      workflow?.pre_lab_result === "FAIL" ||
      workflow?.post_lab_result === "FAIL" ||
      workflow?.final_status === "DISPOSED"
    ) {
      failedOrRejectedCollections += 1;
    }
  }

  return {
    totalCollectedVolume: aggregate._sum.volume ?? 0,
    collectionRecords: aggregate._count,
    collectionsByProgram: byProgram.map((row) => ({
      program: row.program,
      volume: row._sum.volume ?? 0,
      count: row._count,
    })),
    collectionsByDonor: [...donorMap.entries()]
      .map(([donorName, data]) => ({ donorName, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10),
    averageCollectionVolume: aggregate._avg.volume ?? 0,
    failedOrRejectedCollections,
  };
}

async function labStageSummary(stage: "PRE_PASTEURIZATION" | "POST_PASTEURIZATION", startDate: Date, endDate: Date) {
  const rows = await db.labResult.groupBy({
    by: ["result"],
    _count: true,
    where: {
      stage,
      test_date: { gte: startDate, lte: endDate },
    },
  });

  const count = (result: "PASS" | "FAIL" | "PENDING") =>
    rows.find((row) => row.result === result)?._count ?? 0;

  return {
    totalTested: rows.reduce((sum, row) => sum + row._count, 0),
    passed: count("PASS"),
    failed: count("FAIL"),
    awaitingResult: count("PENDING"),
  };
}

export async function getProcessingReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedProcessingReport> {
  const batchProgramFilter =
    program && program !== "ALL"
      ? {
          collections: {
            some: { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" },
          },
        }
      : {};
  const [prePasteurization, postPasteurization, batches, disposals] =
    await Promise.all([
      labStageSummary("PRE_PASTEURIZATION", startDate, endDate),
      labStageSummary("POST_PASTEURIZATION", startDate, endDate),
      db.batch.findMany({
        where: { created_at: { gte: startDate, lte: endDate }, ...batchProgramFilter },
        select: {
          status: true,
          total_volume: true,
          remaining_volume: true,
        },
      }),
      db.disposal.aggregate({
        _sum: { volume: true },
        where: { disposal_date: { gte: startDate, lte: endDate }, batch: batchProgramFilter },
      }),
    ]);

  return {
    prePasteurization,
    pasteurizationBatches: {
      totalBatches: batches.length,
      totalProcessedVolume: batches.reduce(
        (sum, batch) => sum + batch.total_volume,
        0
      ),
      completed: batches.filter((batch) =>
        ["AVAILABLE", "DISPENSED", "DISPOSED"].includes(batch.status)
      ).length,
      inProgress: batches.filter((batch) =>
        ["POOLING", "TESTING", "PASTEURIZED"].includes(batch.status)
      ).length,
    },
    postPasteurization,
    processingLosses: disposals._sum.volume ?? 0,
  };
}

export async function getDispensingReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedDispensingReport> {
  const programFilter =
    program && program !== "ALL"
      ? {
          batch: {
            collections: {
              some: { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" },
            },
          },
        }
      : {};
  const dispensings = await db.dispensing.findMany({
    where: { dispensing_date: { gte: startDate, lte: endDate }, ...programFilter },
    include: {
      batch: { select: { batch_code: true } },
      dispenser: { select: { email: true, full_name: true } },
      milkRequest: { select: { recipient_id: true, payment_status: true } },
    },
  });

  const beneficiaries = new Set<number>();
  const recipients = new Set<number>();
  const sourceMap = new Map<string, number>();
  const paymentMap = new Map<string, { count: number; volume: number }>();
  const staffMap = new Map<string, { count: number; volume: number }>();

  for (const dispensing of dispensings) {
    beneficiaries.add(dispensing.beneficiary_id);
    if (dispensing.milkRequest?.recipient_id) {
      recipients.add(dispensing.milkRequest.recipient_id);
    }

    sourceMap.set(
      dispensing.batch.batch_code,
      (sourceMap.get(dispensing.batch.batch_code) ?? 0) + dispensing.volume
    );

    const paymentStatus =
      dispensing.payment_status ?? dispensing.milkRequest?.payment_status ?? "NOT_SET";
    const payment = paymentMap.get(paymentStatus) ?? { count: 0, volume: 0 };
    payment.count += 1;
    payment.volume += dispensing.volume;
    paymentMap.set(paymentStatus, payment);

    const staffName = dispensing.dispenser.full_name || dispensing.dispenser.email;
    const staff = staffMap.get(staffName) ?? { count: 0, volume: 0 };
    staff.count += 1;
    staff.volume += dispensing.volume;
    staffMap.set(staffName, staff);
  }

  return {
    totalDispensedVolume: dispensings.reduce(
      (sum, dispensing) => sum + dispensing.volume,
      0
    ),
    dispensingTransactions: dispensings.length,
    recipientsServed: recipients.size,
    beneficiariesServed: beneficiaries.size,
    volumeBySource: [...sourceMap.entries()].map(([source, volume]) => ({
      source,
      volume,
    })),
    paymentStatusSummary: [...paymentMap.entries()].map(([status, data]) => ({
      status,
      ...data,
    })),
    releasedByStaff: [...staffMap.entries()].map(([staffName, data]) => ({
      staffName,
      ...data,
    })),
  };
}

export async function getDisposalReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedDisposalReport> {
  const programFilter =
    program && program !== "ALL"
      ? {
          batch: {
            collections: {
              some: { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" },
            },
          },
        }
      : {};
  const [aggregate, reasons, failedPre, failedPost, expiredMilkCount] =
    await Promise.all([
      db.disposal.aggregate({
        _sum: { volume: true },
        _count: true,
        where: { disposal_date: { gte: startDate, lte: endDate }, ...programFilter },
      }),
      db.disposal.groupBy({
        by: ["reason"],
        _sum: { volume: true },
        _count: true,
        where: { disposal_date: { gte: startDate, lte: endDate }, ...programFilter },
      }),
      db.labResult.count({
        where: {
          stage: "PRE_PASTEURIZATION",
          result: "FAIL",
          test_date: { gte: startDate, lte: endDate },
        },
      }),
      db.labResult.count({
        where: {
          stage: "POST_PASTEURIZATION",
          result: "FAIL",
          test_date: { gte: startDate, lte: endDate },
        },
      }),
      db.collection.count({
        where: {
          expiration_date: { gte: startDate, lte: endDate },
          ...(program && program !== "ALL" ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" } : {}),
          batch: { status: { not: "AVAILABLE" } },
        },
      }),
    ]);

  return {
    totalDisposedVolume: aggregate._sum.volume ?? 0,
    disposedRecords: aggregate._count,
    reasons: reasons.map((row) => ({
      reason: row.reason,
      count: row._count,
      volume: row._sum.volume ?? 0,
    })),
    failedPrePasteurizationCount: failedPre,
    failedPostPasteurizationCount: failedPost,
    expiredMilkCount,
  };
}

export async function getInventoryReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedInventoryReport> {
  const batchProgramFilter =
    program && program !== "ALL"
      ? {
          collections: {
            some: { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" },
          },
        }
      : {};

  const [inventory, availableBatches, expiredCollectionCount, disposedBatches] =
    await Promise.all([
      db.inventory.findMany({
        where: {
          last_updated: { gte: startDate, lte: endDate },
          batch: batchProgramFilter,
        },
        select: { available_vol: true },
      }),
      db.batch.count({
        where: {
          status: "AVAILABLE",
          remaining_volume: { gt: 0 },
          ...batchProgramFilter,
        },
      }),
      db.collection.count({
        where: {
          expiration_date: { gte: startDate, lte: endDate },
          ...(program && program !== "ALL" ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" } : {}),
        },
      }),
      db.batch.count({
        where: {
          status: "DISPOSED",
          created_at: { gte: startDate, lte: endDate },
          ...batchProgramFilter,
        },
      }),
    ]);

  return {
    availableStockVolume: inventory.reduce(
      (sum, row) => sum + row.available_vol,
      0
    ),
    inventoryRecords: inventory.length,
    availableBatches,
    expiredCollectionCount,
    disposedBatches,
  };
}

export async function getDonorReport({
  startDate,
  endDate,
  program,
}: {
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedDonorReport> {
  const collectionProgramFilter =
    program && program !== "ALL"
      ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" }
      : {};
  const [registeredDonors, activeDonors, inactiveDonors, collections] =
    await Promise.all([
      db.donor.count({ where: { registration: { gte: startDate, lte: endDate } } }),
      db.donor.count({ where: { status: "ACTIVE" } }),
      db.donor.count({ where: { status: "INACTIVE" } }),
      db.collection.findMany({
        where: {
          collection_date: { gte: startDate, lte: endDate },
          ...collectionProgramFilter,
        },
        include: {
          donor: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

  const donorMap = new Map<string, { count: number; volume: number }>();
  for (const collection of collections) {
    const donorName = `${collection.donor.first_name} ${collection.donor.last_name}`;
    const current = donorMap.get(donorName) ?? { count: 0, volume: 0 };
    current.count += 1;
    current.volume += collection.volume;
    donorMap.set(donorName, current);
  }

  return {
    registeredDonors,
    activeDonors,
    inactiveDonors,
    donorsWithCollections: donorMap.size,
    donorCollections: [...donorMap.entries()]
      .map(([donorName, data]) => ({ donorName, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10),
  };
}

export async function getRecipientReport({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}): Promise<GeneratedRecipientReport> {
  const [
    registeredRecipients,
    activeRecipients,
    inactiveRecipients,
    requestCount,
    servedRecipients,
    servedBeneficiaries,
  ] = await Promise.all([
    db.recipient.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
    db.recipient.count({ where: { status: "ACTIVE" } }),
    db.recipient.count({ where: { status: "INACTIVE" } }),
    db.milkRequest.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
    db.milkRequest.groupBy({
      by: ["recipient_id"],
      where: {
        status: "RELEASED",
        released_at: { gte: startDate, lte: endDate },
      },
    }),
    db.dispensing.groupBy({
      by: ["beneficiary_id"],
      where: { dispensing_date: { gte: startDate, lte: endDate } },
    }),
  ]);

  return {
    registeredRecipients,
    activeRecipients,
    inactiveRecipients,
    requestCount,
    recipientsServed: servedRecipients.length,
    beneficiariesServed: servedBeneficiaries.length,
  };
}

export async function getGeneratedReport({
  period,
  category,
  startDate,
  endDate,
  program,
}: {
  period: ReportPeriod;
  category: ReportCategory;
  startDate: Date;
  endDate: Date;
  program?: string;
}): Promise<GeneratedReport> {
  const includeCollection = category === "ALL" || category === "COLLECTION";
  const includeProcessing = category === "ALL" || category === "PROCESSING";
  const includeInventory = category === "ALL" || category === "INVENTORY";
  const includeDispensing = category === "ALL" || category === "DISPENSING";
  const includeDisposal = category === "ALL" || category === "DISPOSAL";
  const includeDonor = category === "ALL" || category === "DONOR";
  const includeRecipient = category === "ALL" || category === "RECIPIENT";

  const [collection, processing, inventory, dispensing, disposal, donor, recipient] = await Promise.all([
    includeCollection
      ? getCollectionReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeProcessing
      ? getProcessingReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeInventory
      ? getInventoryReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeDispensing
      ? getDispensingReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeDisposal
      ? getDisposalReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeDonor
      ? getDonorReport({ startDate, endDate, program })
      : Promise.resolve(undefined),
    includeRecipient
      ? getRecipientReport({ startDate, endDate })
      : Promise.resolve(undefined),
  ]);

  const hasRecords = Boolean(
    (collection && collection.collectionRecords > 0) ||
      (processing && processing.pasteurizationBatches.totalBatches > 0) ||
      (processing && processing.prePasteurization.totalTested > 0) ||
      (processing && processing.postPasteurization.totalTested > 0) ||
      (inventory && inventory.inventoryRecords > 0) ||
      (dispensing && dispensing.dispensingTransactions > 0) ||
      (disposal && disposal.disposedRecords > 0) ||
      (donor && (donor.registeredDonors > 0 || donor.donorsWithCollections > 0)) ||
      (recipient && (recipient.registeredRecipients > 0 || recipient.requestCount > 0))
  );

  return {
    title: reportTitle(period, category, startDate),
    period,
    category,
    dateFrom: startDate.toISOString(),
    dateTo: endDate.toISOString(),
    generatedAt: new Date().toISOString(),
    collection,
    processing,
    inventory,
    dispensing,
    disposal,
    donor,
    recipient,
    hasRecords,
  };
}

export async function getAnalyticsSummary(
  dateFrom: Date,
  dateTo: Date,
  program?: string
): Promise<AnalyticsSummary> {
  const programFilter =
    program && program !== "ALL" ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" } : {};

  const volumeResult = await db.collection.aggregate({
    _sum: { volume: true },
    where: {
      collection_date: { gte: dateFrom, lte: dateTo },
      ...programFilter,
    },
  });

  const activeDonors = await db.donor.count({
    where: { status: "ACTIVE" },
  });

  const recipientsServed = await db.dispensing.groupBy({
    by: ["beneficiary_id"],
    where: {
      dispensing_date: { gte: dateFrom, lte: dateTo },
    },
  });

  const disposedResult = await db.disposal.aggregate({
    _sum: { volume: true },
    where: {
      disposal_date: { gte: dateFrom, lte: dateTo },
    },
  });

  const totalVolume = volumeResult._sum.volume ?? 0;
  const disposedVolume = disposedResult._sum.volume ?? 0;
  const discardRate =
    totalVolume > 0
      ? parseFloat(((disposedVolume / totalVolume) * 100).toFixed(1))
      : 0;

  return {
    totalVolume,
    activeDonors,
    recipientsServed: recipientsServed.length,
    discardRate,
  };
}

export async function getVolumeTrends(
  dateFrom?: Date,
  dateTo?: Date,
  program?: string
): Promise<VolumeTrendPoint[]> {
  const range = normalizeDateRange(dateFrom, dateTo);
  const programFilter =
    program && program !== "ALL" ? { program: program as "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT" } : {};

  // TODO: Replace this bounded JS grouping with SQL date_trunc/week aggregation
  // once Prisma raw query typing is centralized for analytics queries.
  const collections = await db.collection.findMany({
    where: {
      collection_date: { gte: range.dateFrom, lte: range.dateTo },
      ...programFilter,
    },
    select: { collection_date: true, volume: true },
    orderBy: { collection_date: "asc" },
  });

  const dispensings = await db.dispensing.findMany({
    where: {
      dispensing_date: { gte: range.dateFrom, lte: range.dateTo },
    },
    select: { dispensing_date: true, volume: true },
    orderBy: { dispensing_date: "asc" },
  });

  const weeklyMap: Record<string, { input: number; output: number }> = {};

  for (const c of collections) {
    const week = getWeekLabel(c.collection_date, range.dateFrom);
    if (!weeklyMap[week]) weeklyMap[week] = { input: 0, output: 0 };
    weeklyMap[week].input += c.volume;
  }

  for (const d of dispensings) {
    const week = getWeekLabel(d.dispensing_date, range.dateFrom);
    if (!weeklyMap[week]) weeklyMap[week] = { input: 0, output: 0 };
    weeklyMap[week].output += d.volume;
  }

  return Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({ week, ...data }));
}

export async function getProgramDistribution(
  dateFrom: Date,
  dateTo: Date
): Promise<ProgramDistSegment[]> {
  const result = await db.collection.groupBy({
    by: ["program"],
    _sum: { volume: true },
    where: {
      collection_date: { gte: dateFrom, lte: dateTo },
    },
  });

  const total = result.reduce((sum, r) => sum + (r._sum.volume ?? 0), 0);

  return result.map((r) => ({
    program: r.program,
    volume: r._sum.volume ?? 0,
    percentage:
      total > 0
        ? parseFloat((((r._sum.volume ?? 0) / total) * 100).toFixed(1))
        : 0,
  }));
}

export async function getReports(): Promise<ReportWithUser[]> {
  return db.report.findMany({
    take: 25,
    orderBy: { generated_at: "desc" },
    include: {
      user: { select: { email: true, role: true } },
    },
  });
}

function getWeekLabel(date: Date, rangeStart: Date): string {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNum =
    Math.floor((date.getTime() - rangeStart.getTime()) / msPerWeek) + 1;
  return `Week ${weekNum}`;
}
