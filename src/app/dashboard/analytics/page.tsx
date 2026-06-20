import {
  getAnalyticsSummary,
  getVolumeTrends,
  getProgramDistribution,
  getReports,
} from "@/features/analytics/queries";
import { AnalyticsView } from "@/features/analytics/components/analytics-view";
import { measure } from "@/core/utils/perf";

export default async function AnalyticsPage() {
  const now = new Date();
  const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateTo = now;

  const [summary, volumeTrends, programDist, reports] = await measure(
    "analytics page load",
    () =>
      Promise.all([
        getAnalyticsSummary(dateFrom, dateTo),
        getVolumeTrends(dateFrom, dateTo),
        getProgramDistribution(dateFrom, dateTo),
        getReports(),
      ])
  );

  return (
    <AnalyticsView
      initialSummary={summary}
      initialVolumeTrends={volumeTrends}
      initialProgramDist={programDist}
      initialReports={reports}
    />
  );
}
