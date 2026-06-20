"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { ReportFilters } from "./report-filters";
import { KpiCards } from "./kpi-cards";
import { ReportsTable } from "./reports-table";
import { generateReportAndRefreshAnalytics } from "../actions";
import { Card, CardContent, CardHeader } from "@/core/ui/card";
import { Skeleton } from "@/core/ui/skeleton";
import { toast } from "sonner";
import type {
  AnalyticsSummary,
  VolumeTrendPoint,
  ProgramDistSegment,
  ReportWithUser,
} from "../queries";

const VolumeTrendsChart = dynamic(
  () => import("./volume-trends-chart").then((mod) => mod.VolumeTrendsChart),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton className="col-span-12 lg:col-span-8" />,
  }
);

const ProgramDistributionChart = dynamic(
  () =>
    import("./program-distribution-chart").then(
      (mod) => mod.ProgramDistributionChart
    ),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton className="col-span-12 lg:col-span-4" />,
  }
);

function ChartLoadingSkeleton({ className }: { className: string }) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-border bg-card">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

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

      const result = await generateReportAndRefreshAnalytics({
        type: reportType as
          | "Inventory Levels"
          | "Donor Acquisition"
          | "Lab Testing Yields"
          | "Dispensation Logs",
        program: program as "ALL" | "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT",
        date_from: from,
        date_to: to,
      });

      if (result.success) {
        toast.success("Report generated successfully.");
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = errors
          ? Object.values(errors).flat()[0]
          : "Failed to generate report";
        toast.error(firstError ?? "Failed to generate report");
        return;
      }

      setSummary(result.summary);
      setVolumeTrends(result.volumeTrends);
      setProgramDist(result.programDist);
      setReports(result.reports);
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
