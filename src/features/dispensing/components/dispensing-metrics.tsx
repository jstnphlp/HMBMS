"use client";

import { Card, CardContent } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
import { Truck, DollarSign, Users, CalendarCheck } from "lucide-react";
import type { DispensingMetrics } from "../queries";

interface DispensingMetricCardsProps {
  metrics: DispensingMetrics;
  className?: string;
}

const metricConfig = [
  {
    key: "totalDispensedMl" as const,
    label: "Total Distributed",
    icon: Truck,
    format: (v: number) => `${v.toLocaleString()} mL`,
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
  },
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    format: (v: number) => `₱${v.toLocaleString()}`,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "activeBeneficiaries" as const,
    label: "Active Recipients",
    icon: Users,
    format: (v: number) => v.toLocaleString(),
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    key: "todayDistributions" as const,
    label: "Today's Distributions",
    icon: CalendarCheck,
    format: (v: number) => v.toLocaleString(),
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-primary/20",
  },
];

export function DispensingMetricCards({
  metrics,
  className,
}: DispensingMetricCardsProps) {
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
            className={cn("border shadow-none py-0", item.borderColor)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.label}
                  </p>
                  <p className={cn("text-2xl font-bold mt-1", item.color)}>
                    {item.format(value)}
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
