import { cn } from "@/core/utils/cn";
import { Users, Droplets, AlertTriangle } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClassName?: string;
  badge?: { text: string; variant: "error" | "primary" | "default" };
  subtext?: string;
}

function StatCard({ label, value, icon: Icon, iconClassName, badge, subtext }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between border border-border bg-background p-4 rounded-sm">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className={cn("h-4 w-4 text-primary", iconClassName)} />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {badge && (
          <span
            className={cn(
              "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium mb-1",
              badge.variant === "error"
                ? "bg-destructive/10 text-destructive"
                : badge.variant === "primary"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {badge.text}
          </span>
        )}
        {subtext && (
          <span className="mb-1 text-xs text-muted-foreground">{subtext}</span>
        )}
      </div>
    </div>
  );
}

interface SettingsStatsProps {
  staffCount: number;
  offlineCount?: number;
}

export function SettingsStats({ staffCount, offlineCount = 0 }: SettingsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        label="Active Staff"
        value={staffCount}
        icon={Users}
        badge={
          offlineCount > 0
            ? { text: `${offlineCount} offline`, variant: "error" }
            : undefined
        }
      />
      <StatCard
        label="System Status"
        value="Optimal"
        icon={Droplets}
        badge={{ text: "99.9% Uptime", variant: "primary" }}
      />
      <StatCard
        label="Security Alerts"
        value={0}
        icon={AlertTriangle}
        iconClassName="text-destructive"
        subtext="Last 24 hours"
      />
    </div>
  );
}
