"use client";

import { Badge } from "@/core/ui/badge";
import { cn } from "@/core/utils/cn";

interface DonorStatusBadgeProps {
  status: "ACTIVE" | "INACTIVE";
  className?: string;
}

export function DonorStatusBadge({ status, className }: DonorStatusBadgeProps) {
  const isActive = status === "ACTIVE";

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold border",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isActive ? "bg-emerald-600" : "bg-red-600"
        )}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
