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
