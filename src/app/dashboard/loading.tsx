import {
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "./loading-ui";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <MetricCardSkeletons />
      <TableSkeleton />
    </div>
  );
}
