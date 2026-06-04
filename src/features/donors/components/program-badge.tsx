"use client";

import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";

interface ProgramBadgeProps {
  program: string | null;
  className?: string;
}

const programLabels: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

const programStyles: Record<string, string> = {
  SUPSUP_TODO: "bg-sky-50 text-sky-700 border-sky-200",
  MILKY_WAY: "bg-violet-50 text-violet-700 border-violet-200",
  MOMS_ACT: "bg-amber-50 text-amber-700 border-amber-200",
};

export function ProgramBadge({ program, className }: ProgramBadgeProps) {
  if (!program) {
    return (
      <Badge
        className={cn(
          "bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[11px]",
          className
        )}
      >
        No Program
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "px-2 py-0.5 text-[11px] font-medium border",
        programStyles[program] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {programLabels[program] ?? program}
    </Badge>
  );
}
