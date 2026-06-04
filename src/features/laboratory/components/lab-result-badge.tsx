"use client";

import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";

interface LabResultBadgeProps {
  result: "PASS" | "FAIL" | "PENDING";
  className?: string;
}

export function LabResultBadge({ result, className }: LabResultBadgeProps) {
  const config = {
    PASS: {
      label: "Cleared",
      className:
        "bg-primary/10 text-primary border border-primary/20",
      dotClass: "bg-primary",
    },
    FAIL: {
      label: "Flagged",
      className:
        "bg-destructive/10 text-destructive border border-destructive/20",
      dotClass: "bg-destructive",
    },
    PENDING: {
      label: "Pending",
      className:
        "bg-muted text-muted-foreground border border-border",
      dotClass: "bg-muted-foreground",
    },
  } as const;

  const { label, className: badgeClass, dotClass } = config[result];

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded",
        badgeClass,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      {label}
    </Badge>
  );
}
