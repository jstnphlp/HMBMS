"use client";

import { useState, useTransition } from "react";
import { ReportFilters } from "./report-filters";
import { KpiCards } from "./kpi-cards";
import { VolumeTrendsChart } from "./volume-trends-chart";
import { ProgramDistributionChart } from "./program-distribution-chart";
import { ReportsTable } from "./reports-table";
import { generateReport } from "../actions";
import { getAnalyticsSummary, getVolumeTrends, getProgramDistribution } from "../queries";
import { toast } from "sonner";
import type {
  AnalyticsSummary,
  VolumeTrendPoint,
  ProgramDistSegment,
  ReportWithUser,
} from "../queries";

interface AnalyticsViewProps {
  initialSummary: AnalyticsSummary;
  initialVolumeTrends: VolumeTrendPoint[];
  initialProgramDist: ProgramDistSegment[];
  initialReports: ReportWithUser[];
}

function startOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function AnalyticsView({
  initialSummary,
  initialVolumeTrends,
  initialProgramDist,
  initialReports,
}: AnalyticsViewProps) {
  const [reportType, setReportType] = useState("Inventory Levels");
  const [program, setProgram] = useState("ALL");
  const [dateFrom, setDateFrom] = useState(startOfMonthISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [summary, setSummary] = useState(initialSummary);
  const [volumeTrends, setVolumeTrends] = useState(initialVolumeTrends);
  const [programDist, setProgramDist] = useState(initialProgramDist);
  const [reports, setReports] = useState(initialReports);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);

      const [reportResult, newSummary, newTrends, newDist] = await Promise.all([
        generateReport({
          type: reportType as
            | "Inventory Levels"
            | "Donor Acquisition"
            | "Lab Testing Yields"
            | "Dispensation Logs",
          program: program as "ALL" | "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT",
          date_from: from,
          date_to: to,
        }),
        getAnalyticsSummary(from, to, program),
        getVolumeTrends(from, to, program),
        getProgramDistribution(from, to),
      ]);

      if (reportResult.success) {
        toast.success("Report generated successfully.");
      } else {
        const errors = reportResult.errors as Record<string, string[]>;
        const firstError = errors
          ? Object.values(errors).flat()[0]
          : "Failed to generate report";
        toast.error(firstError ?? "Failed to generate report");
      }

      setSummary(newSummary);
      setVolumeTrends(newTrends);
      setProgramDist(newDist);

      // Re-fetch reports
      const { getReports } = await import("../queries");
      const freshReports = await getReports();
      setReports(freshReports);
    });
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <ReportFilters
        reportType={reportType}
        onReportTypeChange={setReportType}
        program={program}
        onProgramChange={setProgram}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onGenerate={handleGenerate}
        isPending={isPending}
      />
      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <KpiCards summary={summary} />
        <div className="mt-6 grid grid-cols-12 gap-6">
          <VolumeTrendsChart data={volumeTrends} />
          <ProgramDistributionChart data={programDist} />
        </div>
      </div>
      <ReportsTable reports={reports} />
    </div>
  );
}
