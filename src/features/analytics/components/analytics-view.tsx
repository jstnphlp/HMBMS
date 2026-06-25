"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { ReportFilters } from "./report-filters";
import { GeneratedReportPreview } from "./generated-report-preview";
import { KpiCards } from "./kpi-cards";
import { ReportsTable } from "./reports-table";
import {
  generateGeneratedReport,
  generateReportAndRefreshAnalytics,
  loadSavedReport,
} from "../actions";
import {
  downloadCsv,
  isGeneratedReport,
  reportToCsvRows,
  rowsToCsv,
  safeFilename,
} from "../report-export";
import { Card, CardContent, CardHeader } from "@/core/ui/card";
import { Skeleton } from "@/core/ui/skeleton";
import { toast } from "sonner";
import type {
  AnalyticsSummary,
  GeneratedReport,
  ProgramDistSegment,
  ReportWithUser,
  VolumeTrendPoint,
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

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function rangeForPeriod({
  period,
  selectedDate,
  selectedMonth,
  selectedYear,
  dateFrom,
  dateTo,
}: {
  period: string;
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  dateFrom: string;
  dateTo: string;
}) {
  if (period === "DAILY") {
    const start = new Date(`${selectedDate}T00:00:00`);
    return { start, end: endOfDay(start) };
  }

  if (period === "WEEKLY") {
    const start = new Date(`${dateFrom}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end: endOfDay(end) };
  }

  if (period === "MONTHLY") {
    const [year, month] = selectedMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start, end: endOfDay(end) };
  }

  if (period === "YEARLY") {
    const year = Number(selectedYear);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    return { start, end: endOfDay(end) };
  }

  const start = new Date(`${dateFrom}T00:00:00`);
  const end = endOfDay(new Date(`${dateTo}T00:00:00`));
  return { start, end };
}

export function AnalyticsView({
  initialSummary,
  initialVolumeTrends,
  initialProgramDist,
  initialReports,
}: AnalyticsViewProps) {
  const [reportPeriod, setReportPeriod] = useState("MONTHLY");
  const [reportCategory, setReportCategory] = useState("ALL");
  const [program, setProgram] = useState("ALL");
  const [dateFrom, setDateFrom] = useState(startOfMonthISO());
  const [dateTo, setDateTo] = useState(todayISO());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO());
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [summary, setSummary] = useState(initialSummary);
  const [volumeTrends, setVolumeTrends] = useState(initialVolumeTrends);
  const [programDist, setProgramDist] = useState(initialProgramDist);
  const [reports, setReports] = useState(initialReports);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(
    null
  );
  const [selectedSavedReportId, setSelectedSavedReportId] = useState<number | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function selectedRange() {
    return rangeForPeriod({
      period: reportPeriod,
      selectedDate,
      selectedMonth,
      selectedYear,
      dateFrom,
      dateTo,
    });
  }

  function handleGenerate() {
    startTransition(async () => {
      const { start, end } = selectedRange();
      if (start > end) {
        toast.error("Start date must be before or equal to end date.");
        return;
      }

      const result = await generateGeneratedReport({
        period: reportPeriod,
        category: reportCategory,
        program,
        date_from: start,
        date_to: end,
      });

      if (!result.success) {
        const firstError = Object.values(result.errors).flat()[0];
        toast.error(firstError ?? "Failed to generate report");
        return;
      }

      setGeneratedReport(result.generatedReport);
      setSelectedSavedReportId(null);
      setDateFrom(toDateInput(start));
      setDateTo(toDateInput(end));
      toast.success("Report preview generated.");
    });
  }

  function handleSaveReport() {
    startSaveTransition(async () => {
      if (!generatedReport) {
        toast.error("No report selected to save.");
        return;
      }

      const start = new Date(generatedReport.dateFrom);
      const end = new Date(generatedReport.dateTo);
      if (start > end) {
        toast.error("Start date must be before or equal to end date.");
        return;
      }

      const result = await generateReportAndRefreshAnalytics({
        period: generatedReport.period,
        category: generatedReport.category as
          | "ALL"
          | "COLLECTION"
          | "PROCESSING"
          | "INVENTORY"
          | "DISPENSING"
          | "DISPOSAL"
          | "DONOR"
          | "RECIPIENT",
        program: (generatedReport.program ?? "ALL") as
          | "ALL"
          | "SUPSUP_TODO"
          | "MILKY_WAY"
          | "MOMS_ACT",
        date_from: start,
        date_to: end,
        report_data: generatedReport,
      });

      if (result.success) {
        toast.success("Report saved successfully.");
      } else {
        const firstError = Object.values(result.errors).flat()[0];
        toast.error(firstError ?? "Failed to save report");
        return;
      }

      setSummary(result.summary);
      setVolumeTrends(result.volumeTrends);
      setProgramDist(result.programDist);
      setReports(result.reports);
    });
  }

  function handleSelectSavedReport(report: ReportWithUser) {
    startTransition(async () => {
      const result = await loadSavedReport(report.report_id);

      if (!result.success || !result.generatedReport) {
        const firstError = Object.values(result.errors ?? {}).flat()[0];
        toast.error(firstError ?? "Saved report data is unavailable.");
        return;
      }

      setGeneratedReport(result.generatedReport);
      setSelectedSavedReportId(report.report_id);
    });
  }

  function exportReport(report: GeneratedReport) {
    const code = report.reportCode ?? "generated-report";
    const csv = rowsToCsv(reportToCsvRows(report));
    downloadCsv(`${safeFilename(code)}.csv`, csv);
    toast.success("Report exported successfully.");
  }

  function handleExportCurrentReport() {
    if (!generatedReport) {
      toast.error("No report selected to export.");
      return;
    }

    exportReport(generatedReport);
  }

  function handleExportSavedReport(report: ReportWithUser) {
    if (isGeneratedReport(report.data)) {
      exportReport({
        ...report.data,
        reportId: report.report_id,
        reportCode: report.report_code,
        generatedAt: report.generated_at.toISOString(),
        generatedBy: report.user.full_name || report.user.email,
      });
      return;
    }

    startTransition(async () => {
      const result = await loadSavedReport(report.report_id);
      if (!result.success || !result.generatedReport) {
        const firstError = Object.values(result.errors ?? {}).flat()[0];
        toast.error(firstError ?? "Saved report data is unavailable.");
        return;
      }

      exportReport(result.generatedReport);
    });
  }

  function handlePeriodChange(value: string) {
    setReportPeriod(value);
    if (value === "WEEKLY") {
      const start = new Date(`${dateFrom}T00:00:00`);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDateTo(toDateInput(end));
    }
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    if (reportPeriod === "WEEKLY") {
      const start = new Date(`${value}T00:00:00`);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setDateTo(toDateInput(end));
    }
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <ReportFilters
        reportPeriod={reportPeriod}
        onReportPeriodChange={handlePeriodChange}
        reportCategory={reportCategory}
        onReportCategoryChange={setReportCategory}
        program={program}
        onProgramChange={setProgram}
        dateFrom={dateFrom}
        onDateFromChange={handleDateFromChange}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onSelectedYearChange={setSelectedYear}
        onGenerate={handleGenerate}
        isPending={isPending}
        onSaveReport={handleSaveReport}
        isSaving={isSaving}
        canSave={Boolean(generatedReport) && selectedSavedReportId === null}
        onExportReport={handleExportCurrentReport}
        canExport={Boolean(generatedReport)}
      />
      <GeneratedReportPreview report={generatedReport} />
      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <KpiCards summary={summary} />
        <div className="mt-6 grid grid-cols-12 gap-6">
          <VolumeTrendsChart data={volumeTrends} />
          <ProgramDistributionChart data={programDist} />
        </div>
      </div>
      <ReportsTable
        reports={reports}
        selectedReportId={selectedSavedReportId}
        onSelectReport={handleSelectSavedReport}
        onExportReport={handleExportSavedReport}
      />
    </div>
  );
}
