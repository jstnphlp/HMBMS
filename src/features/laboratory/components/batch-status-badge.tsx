"use client";

import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";

interface BatchStatusBadgeProps {
  status: string;
  className?: string;
}

export function BatchStatusBadge({ status, className }: BatchStatusBadgeProps) {
  const config: Record<
    string,
    { label: string; className: string; dotClass: string }
  > = {
    POOLING: {
      label: "Pooling",
      className: "bg-muted text-muted-foreground border border-border",
      dotClass: "bg-muted-foreground",
    },
    TESTING: {
      label: "In Testing",
      className:
        "bg-secondary text-secondary-foreground border border-secondary",
      dotClass: "bg-secondary-foreground",
    },
    PASTEURIZED: {
      label: "Pasteurized",
      className:
        "bg-primary/10 text-primary border border-primary/20",
      dotClass: "bg-primary",
    },
    AVAILABLE: {
      label: "Available",
      className:
        "bg-green-600/10 text-green-700 border border-green-600/30",
      dotClass: "bg-green-600",
    },
    DISPOSED: {
      label: "Disposed",
      className:
        "bg-destructive/10 text-destructive border border-destructive/20",
      dotClass: "bg-destructive",
    },
  };

  const match = config[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground",
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded",
        match.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", match.dotClass)} />
      {match.label}
    </Badge>
  );
}
