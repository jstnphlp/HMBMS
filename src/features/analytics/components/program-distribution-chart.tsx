"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { cn } from "@/core/utils/cn";
import type { ProgramDistSegment } from "../queries";

interface ProgramDistributionChartProps {
  data: ProgramDistSegment[];
}

const PROGRAM_COLORS: Record<string, string> = {
  SUPSUP_TODO: "var(--primary)",
  MILKY_WAY: "var(--chart-4)",
  MOMS_ACT: "var(--chart-5)",
};

const PROGRAM_LABELS: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

export function ProgramDistributionChart({
  data,
}: ProgramDistributionChartProps) {
  const chartData = data.map((d) => ({
    name: PROGRAM_LABELS[d.program] ?? d.program,
    value: d.percentage,
    color: PROGRAM_COLORS[d.program] ?? "var(--muted-foreground)",
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="col-span-12 lg:col-span-4">
      <CardHeader className="border-b border-border bg-card">
        <CardTitle className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Distribution by Program
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <div className="relative h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) => [`${value}%`, "Share"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-card shadow-inner">
            <span className="text-lg font-bold text-foreground">
              {total > 0 ? `${Math.round(total)}%` : "—"}
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 text-xs">
          {chartData.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No program data in this range.
            </p>
          )}
          {chartData.map((segment) => (
            <div
              key={segment.name}
              className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn("h-3 w-3 rounded-full")}
                  style={{ backgroundColor: segment.color }}
                />
                <span>{segment.name}</span>
              </div>
              <span className="font-semibold">{segment.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
