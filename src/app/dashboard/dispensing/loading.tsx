import {
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "../loading-ui";

export default function DispensingLoading() {
  return (
    <div className="mx-auto max-w-full space-y-6">
      <PageHeaderSkeleton />
      <MetricCardSkeletons />
      <div className="flex h-[calc(100vh-280px)] flex-col gap-6 xl:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <div className="h-10 rounded border border-border bg-card" />
          <TableSkeleton rows={10} />
        </div>
        <div className="h-full w-full rounded-lg border border-border bg-card p-4 xl:w-[380px]">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="mt-6 space-y-3">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
