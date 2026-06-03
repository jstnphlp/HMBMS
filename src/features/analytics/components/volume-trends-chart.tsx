"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";

interface VolumeDataPoint {
  week: string;
  donated: number;
  dispensed: number;
}

const volumeData: VolumeDataPoint[] = [
  { week: "Week 1", donated: 950, dispensed: 640 },
  { week: "Week 2", donated: 1180, dispensed: 1020 },
  { week: "Week 3", donated: 800, dispensed: 880 },
  { week: "Week 4", donated: 1320, dispensed: 1280 },
];

export function VolumeTrendsChart() {
  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHeader className="border-b border-border bg-card">
        <CardTitle className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
          Volume Trends (Input vs Output)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                tickFormatter={(value: number) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.375rem",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                }}
                cursor={{ fill: "var(--accent)", opacity: 0.3 }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: "12px", color: "var(--muted-foreground)" }}
              />
              <Bar
                dataKey="donated"
                name="Donated Volume (Input)"
                fill="var(--primary)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="dispensed"
                name="Dispensed Volume (Output)"
                fill="var(--secondary)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-primary" />
            <span>Donated Volume (Input)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-secondary" />
            <span>Dispensed Volume (Output)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
