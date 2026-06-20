import { Card, CardContent, CardHeader } from "@/core/ui/card";
import { Skeleton } from "@/core/ui/skeleton";

export function MetricCardSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="rounded border-border">
          <CardContent className="p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-3 h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card className="overflow-hidden rounded border-border">
      <CardHeader className="border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-5 gap-4 border-b border-border bg-card px-4 py-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </div>
        <div className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="grid grid-cols-5 gap-4 px-4 py-3">
              {Array.from({ length: 5 }).map((_, col) => (
                <Skeleton key={col} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton({
  className,
  titleWidth = "w-40",
}: {
  className?: string;
  titleWidth?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b border-border bg-card">
        <Skeleton className={`h-4 ${titleWidth}`} />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export function PageHeaderSkeleton({
  withDescription = true,
}: {
  withDescription?: boolean;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <Skeleton className="h-7 w-56" />
        {withDescription ? <Skeleton className="mt-2 h-4 w-96" /> : null}
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}
