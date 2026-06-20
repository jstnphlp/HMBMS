import { PageHeaderSkeleton, TableSkeleton } from "../loading-ui";

export default function LaboratoryLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem-3rem)] max-w-[1400px] flex-col gap-4">
      <PageHeaderSkeleton />
      <div className="h-10 w-96 rounded bg-muted" />
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <TableSkeleton rows={10} />
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-6 space-y-3">
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
          <div className="mt-8 h-48 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
