"use client";

import { cn } from "@/core/utils/cn";
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface KpiCardData {
  label: string;
  value: string;
  unit?: string;
  trend: {
    text: string;
    direction: "up" | "down" | "stable";
  };
  variant: "default" | "warning";
}

const kpiData: KpiCardData[] = [
  {
    label: "Total Volume Processed",
    value: "4,250",
    unit: "mL",
    trend: { text: "12% vs last month", direction: "up" },
    variant: "default",
  },
  {
    label: "Active Donors",
    value: "184",
    trend: { text: "5 new this week", direction: "up" },
    variant: "default",
  },
  {
    label: "Recipients Served",
    value: "312",
    trend: { text: "Stable", direction: "stable" },
    variant: "default",
  },
  {
    label: "Discard Rate",
    value: "3.2",
    unit: "%",
    trend: { text: "+0.4% vs last month", direction: "down" },
    variant: "warning",
  },
];

function TrendIcon({
  direction,
  className,
}: {
  direction: "up" | "down" | "stable";
  className?: string;
}) {
  if (direction === "up")
    return <TrendingUp className={cn("h-4 w-4", className)} />;
  if (direction === "down")
    return <TrendingDown className={cn("h-4 w-4", className)} />;
  return <Minus className={cn("h-4 w-4", className)} />;
}

function KpiCard({ data }: { data: KpiCardData }) {
  return (
    <div className="relative overflow-hidden rounded border border-border bg-card p-4">
      <div
        className={cn(
          "absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-bl-full opacity-50",
          data.variant === "warning"
            ? "bg-destructive/10"
            : "bg-accent"
        )}
      />
      <span className="text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
        {data.label}
      </span>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground">
          {data.value}
        </span>
        {data.unit && (
          <span className="mb-1 text-sm text-muted-foreground">
            {data.unit}
          </span>
        )}
      </div>
      <div
        className={cn(
          "mt-2 flex items-center gap-1 text-sm font-medium",
          data.trend.direction === "down" && data.variant === "warning"
            ? "text-destructive"
            : "text-primary"
        )}
      >
        <TrendIcon direction={data.trend.direction} className="h-4 w-4" />
        {data.trend.text}
      </div>
    </div>
  );
}

export function KpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((item) => (
        <KpiCard key={item.label} data={item} />
      ))}
    </div>
  );
}
