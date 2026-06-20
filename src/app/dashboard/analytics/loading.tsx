import {
  ChartSkeleton,
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "../loading-ui";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <PageHeaderSkeleton />
      <div className="rounded border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-9 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
          <div className="h-9 rounded bg-muted" />
        </div>
      </div>
      <MetricCardSkeletons />
      <div className="grid grid-cols-12 gap-6">
        <ChartSkeleton className="col-span-12 lg:col-span-8" />
        <ChartSkeleton className="col-span-12 lg:col-span-4" />
      </div>
      <TableSkeleton rows={5} />
    </div>
  );
}
