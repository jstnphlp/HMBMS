"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/core/ui/dialog";
import { DonorStatusBadge } from "./donor-status-badge";
import { ProgramBadge } from "./program-badge";
import { StartWorkflowDialog } from "./start-workflow-dialog";
import {
  StepActionDialog,
  SupsupTodoDetailsModal,
  type StepTarget,
} from "@/features/supsup-todo/components/supsup-todo-details-modal";
import {
  getConsentBlockReason,
  getSupsupTodoStartBlockReason,
} from "@/features/supsup-todo/eligibility";
import { updateDonor } from "../actions";
import { cn } from "@/core/utils/cn";
import { formatDonorTrackingNo } from "@/core/utils/tracking";
import {
  Edit,
  FileText,
  Home,
  Loader2,
  Phone,
  X,
} from "lucide-react";
import type { DonorDetail } from "../queries";

interface DonorDetailPanelProps {
  donor: DonorDetail;
  onClose: () => void;
  onDonorUpdated?: () => Promise<void> | void;
  className?: string;
}

export function DonorDetailPanel({
  donor,
  onClose,
  onDonorUpdated,
  className,
}: DonorDetailPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stepTarget, setStepTarget] = useState<StepTarget | null>(null);

  const eligibility = donor.supSupTodoEligibility;
  const recentWorkflows = donor.supSupTodoWorkflows.slice(0, 3);
  const startBlockReason = getSupsupTodoStartBlockReason(eligibility);
  const consentBlockReason = getConsentBlockReason(eligibility);

  function getInitials(first: string, last: string) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  }

  function formatDate(date: Date | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function statusLabel(status: string) {
    return status
      .toLowerCase()
      .split("_")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ");
  }

  const registrationDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(donor.registration));

  return (
    <>
      <section
        className={cn(
          "flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-surface border border-border rounded-lg overflow-hidden",
          className
        )}
      >
        <div className="p-4 border-b border-border bg-card shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-muted text-primary flex items-center justify-center font-bold text-lg border border-border shadow-sm">
                {getInitials(donor.first_name, donor.last_name)}
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground leading-tight">
                  {donor.first_name} {donor.last_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  ID: {formatDonorTrackingNo(donor.donor_id)} &bull; Since{" "}
                  {registrationDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-primary"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={onClose}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ProgramBadge program={donor.program} />
            <DonorStatusBadge status={donor.status} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Donation Metrics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox
                label="Total Volume"
                value={`${donor.total_volume.toLocaleString()} mL`}
              />
              <MetricBox
                label="Donation Count"
                value={donor.donation_count.toLocaleString()}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Contact Info
            </h3>
            <div className="space-y-2 text-[13px]">
              <InfoRow icon={<Phone className="size-4" />} value={donor.contact_no} />
              <InfoRow icon={<Home className="size-4" />} value={donor.address} />
              <InfoRow
                icon={<FileText className="size-4" />}
                value={`Civil Status: ${donor.civil_status}`}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Donation Eligibility
            </h3>
            <div className="grid gap-2 text-[12px]">
              <StatusRow
                label="Screening"
                value={
                  eligibility?.screening_result === "PASS"
                    ? "Passed"
                    : eligibility?.screening_result === "FAIL"
                      ? "Failed"
                      : "Pending"
                }
                tone={
                  eligibility?.screening_result === "PASS"
                    ? "success"
                    : eligibility?.screening_result === "FAIL"
                      ? "danger"
                      : "muted"
                }
                onClick={() => setStepTarget({ type: "screening" })}
              />
              <StatusRow
                label="Interview & Consent"
                value={
                  eligibility?.consent_signed
                    ? "Signed"
                    : eligibility?.consent_date
                      ? "Declined"
                      : "Not Signed"
                }
                tone={eligibility?.consent_signed ? "success" : "muted"}
                onClick={() => {
                  if (consentBlockReason) {
                    toast.warning(consentBlockReason);
                    return;
                  }
                  setStepTarget({ type: "consent" });
                }}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Recent Donation Samples
            </h3>
            <div className="space-y-2">
              {recentWorkflows.length > 0 ? (
                recentWorkflows.map((workflow) => (
                  <div
                    key={workflow.workflow_id}
                    className="rounded border border-border/50 bg-muted/30 px-3 py-2 text-[12px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {workflow.tracking_no}
                      </span>
                      <span className="font-semibold text-primary">
                        {workflow.extracted_volume ??
                          workflow.collection?.volume ??
                          "--"}{" "}
                        mL
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-muted-foreground">
                      <ProgramBadge
                        program={workflow.collection?.program ?? workflow.program}
                      />
                      <span className="text-right">
                        {statusLabel(workflow.final_status)}
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {formatDate(workflow.collection?.collection_date ?? null)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded border border-border/50 bg-muted/30 px-3 py-4 text-center text-[12px] text-muted-foreground">
                  No donation samples yet.
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="mt-3 h-8 w-full text-xs border-border"
              onClick={() => setDetailsOpen(true)}
            >
              <FileText className="size-3.5 mr-1.5" />
              View All Details
            </Button>
          </section>
        </div>

        <div className="p-3 border-t border-border bg-card shrink-0 grid gap-2">
          <StartWorkflowDialog
            donorId={donor.donor_id}
            donorName={`${donor.first_name} ${donor.last_name}`}
            donorStatus={donor.status}
            eligibility={eligibility}
            className="h-8 w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onStarted={async () => {
              await onDonorUpdated?.();
              setDetailsOpen(true);
            }}
          />
          {(startBlockReason || donor.status === "INACTIVE") && (
            <p className="text-[11px] leading-4 text-muted-foreground">
              {donor.status === "INACTIVE"
                ? "Inactive donors cannot start a workflow."
                : startBlockReason}
            </p>
          )}
        </div>
      </section>

      <DonorEditDialog
        donor={donor}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onDonorUpdated}
      />

      <SupsupTodoDetailsModal
        donor={donor}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdated={onDonorUpdated}
      />

      <StepActionDialog
        donorId={donor.donor_id}
        target={stepTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStepTarget(null);
        }}
        onUpdated={onDonorUpdated}
        workflow={null}
        eligibility={eligibility}
      />
    </>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 p-3 rounded border border-border/50">
      <span className="text-[11px] text-muted-foreground block mb-1">
        {label}
      </span>
      <span className="text-[18px] font-bold text-primary">{value}</span>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "muted";
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold",
          tone === "success" && "text-primary",
          tone === "danger" && "text-destructive",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="flex items-center justify-between rounded border border-border/50 bg-muted/30 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded border border-border/50 bg-muted/30 px-3 py-2">
      {content}
    </div>
  );
}

function DonorEditDialog({
  donor,
  open,
  onOpenChange,
  onSaved,
}: {
  donor: DonorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<DonorDetail["status"]>(donor.status);
  const [civilStatus, setCivilStatus] = useState(donor.civil_status);

  function resetFormState() {
    setStatus(donor.status);
    setCivilStatus(donor.civil_status);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetFormState();
    }

    onOpenChange(nextOpen);
  }

  function toDateString(date: Date | string) {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = await updateDonor(donor.donor_id, formData);

      if (result.success) {
        toast.success("Donor information updated successfully.");
        await onSaved?.();
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to update donor.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Edit Donor Information
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update this donor&apos;s profile and status.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input
            type="hidden"
            name="birthdate"
            value={toDateString(donor.birthdate)}
          />
          <input type="hidden" name="middle_name" value={donor.middle_name ?? ""} />
          <input type="hidden" name="religion" value={donor.religion ?? ""} />
          <input type="hidden" name="occupation" value={donor.occupation ?? ""} />
          <input type="hidden" name="spouse_name" value={donor.spouse_name ?? ""} />
          <input
            type="hidden"
            name="spouse_occupation"
            value={donor.spouse_occupation ?? ""}
          />
          <input
            type="hidden"
            name="spouse_contact_no"
            value={donor.spouse_contact_no ?? ""}
          />
          <input
            type="hidden"
            name="delivery_date"
            value={donor.delivery_date ? toDateString(donor.delivery_date) : ""}
          />
          <input type="hidden" name="delivery_place" value={donor.delivery_place ?? ""} />
          <input type="hidden" name="delivery_type" value={donor.delivery_type ?? ""} />
          <input type="hidden" name="aog" value={donor.aog ?? ""} />
          <input
            type="hidden"
            name="pregnancy_delivery_details"
            value={donor.pregnancy_delivery_details ?? ""}
          />
          <input type="hidden" name="infant_name" value={donor.infant_name ?? ""} />
          <input
            type="hidden"
            name="infant_birthdate"
            value={donor.infant_birthdate ? toDateString(donor.infant_birthdate) : ""}
          />
          <input type="hidden" name="infant_sex" value={donor.infant_sex ?? ""} />
          <input
            type="hidden"
            name="infant_birth_weight"
            value={donor.infant_birth_weight ?? ""}
          />
          <input type="hidden" name="infant_details" value={donor.infant_details ?? ""} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EditField
              label="First Name"
              name="first_name"
              defaultValue={donor.first_name}
              required
            />
            <EditField
              label="Last Name"
              name="last_name"
              defaultValue={donor.last_name}
              required
            />
            <EditField
              label="Contact Number"
              name="contact_no"
              defaultValue={donor.contact_no}
              required
            />
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-foreground">
                Status
              </Label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={(value) => setStatus(value as DonorDetail["status"])}>
                <SelectTrigger id="status" className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <EditField
            label="Address"
            name="address"
            defaultValue={donor.address}
            required
          />

          <div className="grid gap-2">
            <Label htmlFor="civil_status" className="text-foreground">
              Civil Status
            </Label>
            <input type="hidden" name="civil_status" value={civilStatus} />
            <Select value={civilStatus} onValueChange={setCivilStatus}>
              <SelectTrigger id="civil_status" className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
                <SelectItem value="Separated">Separated</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border text-foreground"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditField({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name} className="text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="bg-card border-border text-foreground"
      />
    </div>
  );
}
