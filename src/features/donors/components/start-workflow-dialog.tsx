"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/core/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { Label } from "@/core/ui/label";
import { cn } from "@/core/utils/cn";
import { getSupsupTodoStartBlockReason } from "@/features/supsup-todo/eligibility";
import { startSupsupTodoDonation } from "@/features/supsup-todo/actions";
import { Droplets, Loader2 } from "lucide-react";
import type { DonorDetail } from "../queries";

type WorkflowProgram = "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT";

const PROGRAM_OPTIONS: { value: WorkflowProgram; label: string }[] = [
  { value: "SUPSUP_TODO", label: "Supsup Todo" },
  { value: "MILKY_WAY", label: "Milky Way" },
  { value: "MOMS_ACT", label: "Mom's Act" },
];

interface StartWorkflowDialogProps {
  donorId: number;
  donorName: string;
  donorStatus: DonorDetail["status"];
  eligibility: DonorDetail["supSupTodoEligibility"];
  onStarted?: () => Promise<void> | void;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
}

export function StartWorkflowDialog({
  donorId,
  donorName,
  donorStatus,
  eligibility,
  onStarted,
  className,
  size = "sm",
}: StartWorkflowDialogProps) {
  const [open, setOpen] = useState(false);
  const [program, setProgram] = useState<WorkflowProgram>("SUPSUP_TODO");
  const [isPending, startTransition] = useTransition();
  const startBlockReason = getSupsupTodoStartBlockReason(eligibility);
  const isInactive = donorStatus === "INACTIVE";

  function handleContinue() {
    if (program === "MILKY_WAY") {
      toast.info("Milky Way workflow is not yet implemented.");
      setOpen(false);
      return;
    }

    if (program === "MOMS_ACT") {
      toast.info("Mom's Act workflow is not yet implemented.");
      setOpen(false);
      return;
    }

    if (startBlockReason) {
      toast.warning(startBlockReason);
      return;
    }

    startTransition(async () => {
      const result = await startSupsupTodoDonation(donorId);

      if (result.success) {
        toast.success("Supsup Todo donation workflow started.");
        setOpen(false);
        await onStarted?.();
      } else {
        const firstError = Object.values(result.errors).flat()[0];
        toast.error(firstError ?? "Failed to start Supsup Todo donation.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={size}
        className={cn("gap-1.5", className)}
        disabled={isPending || isInactive}
        onClick={() => setOpen(true)}
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Droplets className="size-3.5" />
        )}
        Start
      </Button>

      <DialogContent className="max-w-sm bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-base">
            Start Donor Workflow
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose which milk collection program to start for this donor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Donor: <span className="font-medium text-foreground">{donorName}</span>
          </p>
          <div className="grid gap-2">
            {PROGRAM_OPTIONS.map((option) => (
              <Label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                  program === option.value && "border-primary bg-primary/5"
                )}
              >
                <input
                  type="radio"
                  name="workflow-program"
                  value={option.value}
                  checked={program === option.value}
                  onChange={() => setProgram(option.value)}
                  className="size-4 accent-primary"
                />
                <span>{option.label}</span>
              </Label>
            ))}
          </div>
          {program === "SUPSUP_TODO" && startBlockReason ? (
            <p className="rounded border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {startBlockReason}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isPending} onClick={handleContinue}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
