import {
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "../loading-ui";

export default function InventoryLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeaderSkeleton />
      <MetricCardSkeletons count={5} />
      <TableSkeleton rows={10} />
    </div>
  );
}
