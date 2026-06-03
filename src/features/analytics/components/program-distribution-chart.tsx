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

interface ProgramSegment {
  name: string;
  value: number;
  color: string;
}

const programData: ProgramSegment[] = [
  { name: "NICU Level III", value: 60, color: "var(--primary)" },
  { name: "Step-Down Unit", value: 25, color: "var(--chart-4)" },
  { name: "Outpatient / Community", value: 15, color: "var(--chart-5)" },
];

export function ProgramDistributionChart() {
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
                data={programData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {programData.map((entry) => (
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
            <span className="text-lg font-bold text-foreground">100%</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 text-xs">
          {programData.map((segment) => (
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
