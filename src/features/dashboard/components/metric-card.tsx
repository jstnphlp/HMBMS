import { cn } from "@/core/utils/cn";
import {
  Droplets,
  FlaskConical,
  Heart,
  Truck,
} from "lucide-react";

interface DashboardSummary {
  totalStock: number;
  pendingLabTests: number;
  activeDonors: number;
  awaitingDispensing: number;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClassName?: string;
  badge?: { text: string; variant: "urgent" | "default" };
  subtext?: string;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  badge,
  subtext,
}: MetricCardProps) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-2 flex items-start justify-between">
        <span className="text-xs leading-4 font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <Icon className={cn("h-4 w-4 text-primary", iconClassName)} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {badge && (
          <span
            className={cn(
              "ml-2 rounded-sm px-2 py-0.5 text-[10px] font-bold",
              badge.variant === "urgent"
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-foreground"
            )}
          >
            {badge.text}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-muted-foreground">{subtext}</span>
        )}
      </div>
    </div>
  );
}

export function MetricCards({
  summary,
}: {
  summary: DashboardSummary;
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Stock (mL)"
        value={summary.totalStock.toLocaleString()}
        icon={Droplets}
      />
      <MetricCard
        label="Pending Lab Tests"
        value={summary.pendingLabTests.toLocaleString()}
        icon={FlaskConical}
        badge={
          summary.pendingLabTests > 0
            ? { text: `${summary.pendingLabTests} PENDING`, variant: "urgent" }
            : undefined
        }
      />
      <MetricCard
        label="Active Donors"
        value={summary.activeDonors.toLocaleString()}
        icon={Heart}
      />
      <MetricCard
        label="Batches Awaiting Dispensing"
        value={summary.awaitingDispensing.toLocaleString()}
        icon={Truck}
      />
    </div>
  );
}
