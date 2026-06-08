"use client";

import { cn } from "@/core/utils/cn";
import { TrendingUp, ChevronDown, MoreHorizontal } from "lucide-react";
import type { AnalyticsSummary } from "../queries";

interface KpiCardsProps {
  summary: AnalyticsSummary;
}

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
    return <ChevronDown className={cn("h-4 w-4", className)} />;
  return <MoreHorizontal className={cn("h-4 w-4", className)} />;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const cards = [
    {
      label: "Total Volume Processed",
      value: summary.totalVolume.toLocaleString(),
      unit: "mL",
      trend: { text: "All time collections", direction: "stable" as const },
      variant: "default" as const,
    },
    {
      label: "Active Donors",
      value: summary.activeDonors.toLocaleString(),
      trend: { text: "Currently registered", direction: "up" as const },
      variant: "default" as const,
    },
    {
      label: "Recipients Served",
      value: summary.recipientsServed.toLocaleString(),
      trend: { text: "Unique beneficiaries", direction: "stable" as const },
      variant: "default" as const,
    },
    {
      label: "Discard Rate",
      value: summary.discardRate.toString(),
      unit: "%",
      trend: {
        text: summary.discardRate > 5 ? "Above target" : "Within target",
        direction: (summary.discardRate > 5 ? "down" : "stable") as
          | "up"
          | "down"
          | "stable",
      },
      variant: (summary.discardRate > 5 ? "warning" : "default") as
        | "warning"
        | "default",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((data) => (
        <div
          key={data.label}
          className="relative overflow-hidden rounded border border-border bg-card p-4"
        >
          <div
            className={cn(
              "absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-bl-full opacity-50",
              data.variant === "warning" ? "bg-destructive/10" : "bg-accent"
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
      ))}
    </div>
  );
}
