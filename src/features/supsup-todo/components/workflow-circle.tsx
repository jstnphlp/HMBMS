"use client";

import { Button } from "@/core/ui/button";
import { cn } from "@/core/utils/cn";
import { AlertTriangle, Check, Clock, X } from "lucide-react";

export type WorkflowCircleState =
  | "not_started"
  | "active"
  | "waiting"
  | "completed"
  | "failed";

interface WorkflowCircleProps {
  label: string;
  state: WorkflowCircleState;
  onClick?: () => void;
  disabled?: boolean;
  onBlockedClick?: () => void;
  compact?: boolean;
}

export function WorkflowCircle({
  label,
  state,
  onClick,
  disabled,
  onBlockedClick,
  compact = false,
}: WorkflowCircleProps) {
  const blockedClickable = disabled && !!onBlockedClick;
  const clickable = (!!onClick && !disabled) || blockedClickable;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center text-center",
        compact ? "min-w-14 gap-1.5" : "min-w-20 gap-2"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={blockedClickable ? onBlockedClick : onClick}
        disabled={!clickable}
        title={label}
        className={cn(
          "h-9 w-9 rounded-full border text-xs transition-colors",
          compact && "h-7 w-7",
          state === "not_started" &&
            "border-border bg-muted text-muted-foreground",
          state === "active" &&
            "border-blue-500 bg-blue-500 text-white hover:bg-blue-600",
          state === "waiting" &&
            "border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-600",
          state === "completed" &&
            "border-green-600 bg-green-600 text-white hover:bg-green-700",
          state === "failed" &&
            "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
          clickable && "cursor-pointer",
          !clickable && "cursor-default opacity-80"
        )}
      >
        {state === "completed" ? (
          <Check className={compact ? "size-3.5" : "size-4"} />
        ) : state === "failed" ? (
          <X className={compact ? "size-3.5" : "size-4"} />
        ) : state === "waiting" ? (
          <Clock className={compact ? "size-3.5" : "size-4"} />
        ) : state === "active" ? (
          <AlertTriangle className={compact ? "size-3.5" : "size-4"} />
        ) : (
          <span
            className={cn(
              "block rounded-full bg-current",
              compact ? "h-1.5 w-1.5" : "h-2 w-2"
            )}
          />
        )}
      </Button>
      <span
        className={cn(
          "max-w-24 break-words text-muted-foreground",
          compact ? "text-[10px] leading-3" : "text-[11px] leading-4"
        )}
      >
        {label}
      </span>
    </div>
  );
}
