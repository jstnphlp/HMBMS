"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { generatedReportSchema, generateReportSchema } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  type AnalyticsSummary,
  getAnalyticsSummary,
  getGeneratedReport,
  getProgramDistribution,
  getReports,
  getVolumeTrends,
  type ProgramDistSegment,
  type ReportWithUser,
  type GeneratedReport,
  type ReportCategory,
  type ReportPeriod,
  type VolumeTrendPoint,
} from "./queries";
import type { GeneratedReportInput, GenerateReportInput } from "./schemas";
import type { Prisma, Report } from "@/generated/prisma/client";

const REPORT_CATEGORIES: ReportCategory[] = [
  "ALL",
  "COLLECTION",
  "PROCESSING",
  "INVENTORY",
  "DISPENSING",
  "DISPOSAL",
  "DONOR",
  "RECIPIENT",
];

const REPORT_PERIODS: ReportPeriod[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "CUSTOM",
];

function isReportCategory(value: string): value is ReportCategory {
  return REPORT_CATEGORIES.includes(value as ReportCategory);
}

function isReportPeriod(value: string | null | undefined): value is ReportPeriod {
  return REPORT_PERIODS.includes(value as ReportPeriod);
}

function isGeneratedReportPayload(value: unknown): value is GeneratedReport {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    "period" in value &&
    "category" in value &&
    "dateFrom" in value &&
    "dateTo" in value &&
    "generatedAt" in value
  );
}

function withSavedMetadata(
  report: GeneratedReport,
  saved: {
    report_id: number;
    report_code: string;
    generated_at: Date;
    user: { email: string; full_name: string };
  }
): GeneratedReport {
  return {
    ...report,
    reportId: saved.report_id,
    reportCode: saved.report_code,
    generatedAt: saved.generated_at.toISOString(),
    generatedBy: saved.user.full_name || saved.user.email,
  };
}

function toJsonPayload(report: GeneratedReport): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue;
}

type GenerateReportAndRefreshAnalyticsResult =
  | {
      success: true;
      report: Report;
      summary: AnalyticsSummary;
      volumeTrends: VolumeTrendPoint[];
      programDist: ProgramDistSegment[];
      reports: ReportWithUser[];
    }
  | {
      success: false;
      errors: Record<string, string[]>;
    };

type GenerateGeneratedReportResult =
  | {
      success: true;
      generatedReport: Awaited<ReturnType<typeof getGeneratedReport>>;
    }
  | {
      success: false;
      errors: Record<string, string[]>;
    };

export async function generateGeneratedReport(
  rawInput: unknown
): Promise<GenerateGeneratedReportResult> {
  const parsed = generatedReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const input: GeneratedReportInput = parsed.data;

  try {
    const generatedReport = await getGeneratedReport({
      period: input.period,
      category: input.category,
      startDate: input.date_from,
      endDate: input.date_to,
      program: input.program,
    });

    return { success: true, generatedReport };
  } catch (err) {
    console.error("[generateGeneratedReport] error:", err);
    return {
      success: false,
      errors: { _form: ["Failed to generate report data."] },
    };
  }
}

export async function generateReport(rawInput: unknown) {
  const parsed = generateReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;

  const staffUser = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!staffUser) {
    throw new Error(
      "Unauthenticated: no session user found. Auth must be wired before this action can run."
    );
  }

  try {
    const count = await db.report.count();
    const report_code = `RPT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    const generatedReport = isGeneratedReportPayload(input.report_data)
      ? input.report_data
      : await getGeneratedReport({
          period: input.period,
          category: input.category,
          startDate: input.date_from,
          endDate: input.date_to,
          program: input.program,
        });

    const report = await db.report.create({
      data: {
        report_code,
        type: input.category,
        period: input.period,
        report_title: generatedReport.title,
        program: input.program === "ALL" ? null : input.program,
        date_from: input.date_from,
        date_to: input.date_to,
        data: toJsonPayload(generatedReport),
        generated_by: staffUser.user_id,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: staffUser.user_id,
        action_details: `Generated report ${report_code} (${input.category})`,
      },
    });

    revalidatePath("/dashboard/analytics");
    return { success: true, data: report };
  } catch (err) {
    console.error("[saveReport] failed:", err);
    return {
      success: false,
      errors: { _form: [`Failed to save report: ${mapPrismaError(err)}`] },
    };
  }
}

export async function generateReportAndRefreshAnalytics(
  rawInput: unknown
): Promise<GenerateReportAndRefreshAnalyticsResult> {
  const parsed = generateReportSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const input: GenerateReportInput = parsed.data;
  const reportResult = await generateReport(input);

  if (!reportResult.success || !reportResult.data) {
    return {
      success: false,
      errors: (reportResult.errors ?? {
        _form: ["Failed to generate report"],
      }) as Record<string, string[]>,
    };
  }
  const report = reportResult.data;

  const [summary, volumeTrends, programDist, reports] = await Promise.all([
    getAnalyticsSummary(input.date_from, input.date_to, input.program),
    getVolumeTrends(input.date_from, input.date_to, input.program),
    getProgramDistribution(input.date_from, input.date_to),
    getReports(),
  ]);

  return {
    success: true,
    report,
    summary,
    volumeTrends,
    programDist,
    reports,
  };
}

export async function deleteReport(reportId: number) {
  try {
    const staffUser = await db.user.findFirst({ where: { role: "ADMIN" } });
    if (!staffUser) {
      throw new Error(
        "Unauthenticated: no session user found. Auth must be wired before this action can run."
      );
    }

    const report = await db.report.findUnique({
      where: { report_id: reportId },
    });

    await db.report.delete({ where: { report_id: reportId } });

    await db.auditLog.create({
      data: {
        user_id: staffUser.user_id,
        action_details: `Deleted report ${report?.report_code ?? reportId}`,
      },
    });

    revalidatePath("/dashboard/analytics");
    return { success: true };
  } catch (err) {
    console.error("[deleteReport] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
    };
  }
}

export async function loadSavedReport(reportId: number) {
  try {
    const report = await db.report.findUnique({
      where: { report_id: reportId },
      include: {
        user: { select: { email: true, role: true, full_name: true } },
      },
    });

    if (!report) {
      return {
        success: false,
        errors: { _form: ["Saved report was not found."] },
      };
    }

    if (isGeneratedReportPayload(report.data)) {
      return {
        success: true,
        generatedReport: withSavedMetadata(report.data, report),
      };
    }

    if (!isReportCategory(report.type)) {
      return {
        success: false,
        errors: { _form: ["Saved report data is unavailable."] },
      };
    }

    const generatedReport = await getGeneratedReport({
      period: isReportPeriod(report.period) ? report.period : "CUSTOM",
      category: report.type,
      startDate: report.date_from,
      endDate: report.date_to,
      program: report.program ?? "ALL",
    });

    return {
      success: true,
      generatedReport: withSavedMetadata(generatedReport, report),
    };
  } catch (err) {
    console.error("[loadSavedReport] error:", err);
    return {
      success: false,
      errors: { _form: ["Saved report data is unavailable."] },
    };
  }
}
