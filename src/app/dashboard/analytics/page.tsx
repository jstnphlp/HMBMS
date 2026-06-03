import { ReportFilters } from "@/features/analytics/components/report-filters";
import { KpiCards } from "@/features/analytics/components/kpi-cards";
import { VolumeTrendsChart } from "@/features/analytics/components/volume-trends-chart";
import { ProgramDistributionChart } from "@/features/analytics/components/program-distribution-chart";
import { ReportsTable } from "@/features/analytics/components/reports-table";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <ReportFilters />
      <KpiCards />
      <div className="grid grid-cols-12 gap-6">
        <VolumeTrendsChart />
        <ProgramDistributionChart />
      </div>
      <ReportsTable />
    </div>
  );
}
