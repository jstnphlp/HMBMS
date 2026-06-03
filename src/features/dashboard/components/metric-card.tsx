import { cn } from "@/core/utils/cn";
import {
  Droplets,
  FlaskConical,
  Heart,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClassName?: string;
  trend?: { value: string; positive?: boolean };
  badge?: { text: string; variant: "urgent" | "default" };
  subtext?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  trend,
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
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
            <TrendingUp className="h-3 w-3" />
            {trend.value}
          </span>
        )}
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

export function MetricCards() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Stock (mL)"
        value="142,500"
        icon={Droplets}
        trend={{ value: "+5.2%", positive: true }}
      />
      <MetricCard
        label="Pending Lab Tests"
        value="34"
        icon={FlaskConical}
        badge={{ text: "12 URGENT", variant: "urgent" }}
      />
      <MetricCard
        label="Active Donors"
        value="128"
        icon={Heart}
        trend={{ value: "+12 this mo", positive: true }}
      />
      <MetricCard
        label="Urgent Requests"
        value="5"
        icon={AlertTriangle}
        iconClassName="text-destructive"
        subtext="NICU Wards"
      />
    </div>
  );
}
