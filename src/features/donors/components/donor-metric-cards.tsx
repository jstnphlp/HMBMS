"use client";

import { Card, CardContent } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";
import type { DonorMetrics } from "../queries";

interface DonorMetricCardsProps {
  metrics: DonorMetrics;
  className?: string;
}

const metricConfig = [
  {
    key: "total_donors" as const,
    label: "Total Donors",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
  },
  {
    key: "active_donors" as const,
    label: "Active Donors",
    icon: UserCheck,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "inactive_donors" as const,
    label: "Inactive Donors",
    icon: UserX,
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    key: "new_this_month" as const,
    label: "New This Month",
    icon: UserPlus,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
];

export function DonorMetricCards({
  metrics,
  className,
}: DonorMetricCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {metricConfig.map((item) => {
        const Icon = item.icon;
        const value = metrics[item.key];
        return (
          <Card
            key={item.key}
            className={cn(
              "border shadow-none py-0",
              item.borderColor
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </p>
                  <p className={cn("text-2xl font-bold mt-1", item.color)}>
                    {value.toLocaleString()}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    item.bgColor
                  )}
                >
                  <Icon className={cn("size-5", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
