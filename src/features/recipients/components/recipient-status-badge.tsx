import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";

interface RecipientStatusBadgeProps {
  hasDispensings: boolean;
  lastDispensingDate: Date | null;
  totalVolume: number;
}

export function RecipientStatusBadge({
  hasDispensings,
  lastDispensingDate,
  totalVolume,
}: RecipientStatusBadgeProps) {
  if (!hasDispensings) {
    return (
      <Badge
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          "bg-destructive/10 text-destructive border-destructive/20"
        )}
      >
        Pending Allocation
      </Badge>
    );
  }

  if (lastDispensingDate) {
    const now = new Date();
    const lastDate = new Date(lastDispensingDate);
    const isToday =
      lastDate.getFullYear() === now.getFullYear() &&
      lastDate.getMonth() === now.getMonth() &&
      lastDate.getDate() === now.getDate();

    if (isToday) {
      return (
        <Badge
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
            "bg-primary/10 text-primary border-primary/20"
          )}
        >
          Fulfilled Today
        </Badge>
      );
    }
  }

  if (totalVolume > 1000) {
    return (
      <Badge
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          "bg-secondary text-secondary-foreground border-border"
        )}
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        "bg-muted text-muted-foreground border-border"
      )}
    >
      Active
    </Badge>
  );
}

interface UrgencyBadgeProps {
  totalVolume: number;
  dispensingCount: number;
}

export function UrgencyBadge({
  totalVolume,
  dispensingCount,
}: UrgencyBadgeProps) {
  if (dispensingCount === 0) {
    return (
      <Badge
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
          "bg-destructive/10 text-destructive border-destructive/20"
        )}
      >
        Urgent
      </Badge>
    );
  }

  if (totalVolume < 200) {
    return (
      <Badge
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold",
          "bg-primary/10 text-primary border-primary/20"
        )}
      >
        Standard
      </Badge>
    );
  }

  return null;
}
