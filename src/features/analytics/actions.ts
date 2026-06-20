"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { generateReportSchema } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";
import {
  type AnalyticsSummary,
  getAnalyticsSummary,
  getProgramDistribution,
  getReports,
  getVolumeTrends,
  type ProgramDistSegment,
  type ReportWithUser,
  type VolumeTrendPoint,
} from "./queries";
import type { GenerateReportInput } from "./schemas";
import type { Report } from "@/generated/prisma/client";

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

    const report = await db.report.create({
      data: {
        report_code,
        type: input.type,
        program: input.program === "ALL" ? null : input.program,
        date_from: input.date_from,
        date_to: input.date_to,
        generated_by: staffUser.user_id,
      },
    });

    await db.auditLog.create({
      data: {
        user_id: staffUser.user_id,
        action_details: `Generated report ${report_code} (${input.type})`,
      },
    });

    revalidatePath("/dashboard/analytics");
    return { success: true, data: report };
  } catch (err) {
    console.error("[generateReport] error:", err);
    return {
      success: false,
      errors: { _form: [mapPrismaError(err)] },
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
