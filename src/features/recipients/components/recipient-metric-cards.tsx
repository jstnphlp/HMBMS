"use client";

import { Card, CardContent } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
import { Users, UserCheck, Droplets, Timer } from "lucide-react";
import type { RecipientMetrics } from "../queries";

interface RecipientMetricCardsProps {
  metrics: RecipientMetrics;
}

const metricConfig = [
  {
    key: "total_recipients" as const,
    label: "Total Recipients",
    icon: Users,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "active_recipients" as const,
    label: "Active Recipients",
    icon: UserCheck,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "total_volume_dispensed" as const,
    label: "Total Volume Dispensed",
    icon: Droplets,
    format: (v: number) => `${v.toLocaleString()} mL`,
  },
  {
    key: "pending_allocations" as const,
    label: "Pending Allocations",
    icon: Timer,
    format: (v: number) => v.toLocaleString(),
  },
];

export function RecipientMetricCards({ metrics }: RecipientMetricCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metricConfig.map((item) => {
        const Icon = item.icon;
        const value = metrics[item.key];

        return (
          <Card
            key={item.key}
            className={cn(
              "bg-surface border-border shadow-sm",
              "hover:bg-muted/30 transition-colors"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {item.label}
                </span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {item.format(value)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
