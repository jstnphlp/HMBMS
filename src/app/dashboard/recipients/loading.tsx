import {
  MetricCardSkeletons,
  PageHeaderSkeleton,
  TableSkeleton,
} from "../loading-ui";

export default function RecipientsLoading() {
  return (
    <div className="mx-auto max-w-full space-y-6">
      <PageHeaderSkeleton withDescription={false} />
      <MetricCardSkeletons />
      <div className="grid h-[calc(100vh-13rem)] grid-cols-[minmax(0,2fr)_minmax(320px,400px)] gap-4">
        <TableSkeleton rows={10} />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="mt-2 h-3 w-24 rounded bg-muted" />
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="h-14 rounded bg-muted" />
            <div className="h-14 rounded bg-muted" />
            <div className="h-14 rounded bg-muted" />
            <div className="h-14 rounded bg-muted" />
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
