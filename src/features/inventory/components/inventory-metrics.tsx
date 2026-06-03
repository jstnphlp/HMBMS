"use client";

import { Card, CardContent } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
import { Droplets, Heart, Truck, Trash2, TrendingUp } from "lucide-react";
import type { InventorySummary } from "../queries";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClassName?: string;
  subtext?: string;
}

function MetricCard({ label, value, icon: Icon, iconClassName, subtext }: MetricCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <span className="text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          <Icon className={cn("h-4 w-4 text-primary", iconClassName)} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subtext && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
              <TrendingUp className="h-3 w-3" />
              {subtext}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InventoryMetricsProps {
  summary: InventorySummary;
}

export function InventoryMetrics({ summary }: InventoryMetricsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Available Stock"
        value={`${summary.totalStockMl.toLocaleString()} mL`}
        icon={Droplets}
        subtext={`${summary.activeBatches} batches`}
      />
      <MetricCard
        label="Total Collected"
        value={`${summary.totalCollections.toLocaleString()}`}
        icon={Heart}
        subtext="all time"
      />
      <MetricCard
        label="Total Dispensed"
        value={`${summary.totalDispensedMl.toLocaleString()} mL`}
        icon={Truck}
      />
      <MetricCard
        label="Total Disposed"
        value={`${summary.totalDisposedMl.toLocaleString()} mL`}
        icon={Trash2}
        iconClassName="text-destructive"
      />
    </div>
  );
}
