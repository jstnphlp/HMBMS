import {
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "../loading-ui";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <MetricCardSkeletons count={3} />
      <TableSkeleton rows={8} />
    </div>
  );
}
