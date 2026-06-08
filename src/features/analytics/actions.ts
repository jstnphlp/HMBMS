"use server";

import { db } from "@/core/db";
import { revalidatePath } from "next/cache";
import { generateReportSchema } from "./schemas";
import { mapPrismaError } from "@/core/utils/prisma-error";

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
