"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { Textarea } from "@/core/ui/textarea";
import { cn } from "@/core/utils/cn";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Loader2,
} from "lucide-react";
import { updateDonor } from "@/features/donors/actions";
import { StartWorkflowDialog } from "@/features/donors/components/start-workflow-dialog";
import type { DonorDetail } from "@/features/donors/queries";
import type { SupsupTodoWorkflowDetail } from "../queries";
import {
  getConsentBlockReason,
} from "../eligibility";
import {
  recordPostLabResult,
  recordPreLabResult,
  updateBottlingLabeling,
  updateColdChain,
  updateDonorConsent,
  updateDonorScreening,
  updateLactationExtraction,
  updatePasteurization,
  updatePostLabSentToLab,
  updatePreLabInCollection,
  updatePreLabSentToLab,
} from "../actions";
import {
  WorkflowCircle,
  type WorkflowCircleState,
} from "./workflow-circle";

export type StepTarget =
  | { type: "screening" }
  | { type: "consent" }
  | { type: "extraction"; workflowId: number }
  | { type: "bottling"; workflowId: number }
  | { type: "cold_chain"; workflowId: number }
  | { type: "pre_collection"; workflowId: number }
  | { type: "pre_sent"; workflowId: number }
  | { type: "pre_result"; workflowId: number }
  | { type: "pasteurization"; workflowId: number }
  | { type: "post_sent"; workflowId: number }
  | { type: "post_result"; workflowId: number };

interface SupsupTodoDetailsModalProps {
  donor: DonorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => Promise<void> | void;
}

export function SupsupTodoDetailsModal({
  donor,
  open,
  onOpenChange,
  onUpdated,
}: SupsupTodoDetailsModalProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [stepTarget, setStepTarget] = useState<StepTarget | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showFullDonorDetails, setShowFullDonorDetails] = useState(false);
  const [isSavingProfile, saveProfileTransition] = useTransition();
  const profileFormRef = useRef<HTMLFormElement>(null);

  function toggleExpanded(id: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const workflows = donor.supSupTodoWorkflows;
  const eligibility = donor.supSupTodoEligibility;
  const consentBlockReason = getConsentBlockReason(eligibility);

  function handleConsentClick() {
    if (consentBlockReason) {
      toast.warning(consentBlockReason);
      return;
    }

    setStepTarget({ type: "consent" });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsEditingProfile(false);
      setShowFullDonorDetails(false);
    }

    onOpenChange(nextOpen);
  }

  function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(profileFormRef.current!);

    saveProfileTransition(async () => {
      const result = await updateDonor(donor.donor_id, formData);

      if (result.success) {
        toast.success("Donor details updated successfully.");
        setIsEditingProfile(false);
        await onUpdated?.();
      } else {
        const firstError = Object.values(result.errors ?? {}).flat()[0];
        toast.error(firstError ?? "Failed to update donor details.");
      }
    });
  }

  function targetWorkflow() {
    return stepTarget && "workflowId" in stepTarget
      ? workflows.find((workflow) => workflow.workflow_id === stepTarget.workflowId) ?? null
      : null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="!w-[95vw] !max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">
              Supsup Todo Donor Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {donor.first_name} {donor.last_name} &bull; D-
              {donor.donor_id.toString().padStart(4, "0")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto space-y-6 pr-1">
            <section className="rounded border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Donor Summary
                </h3>
                <div className="flex items-center gap-1">
                  {!isEditingProfile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setShowFullDonorDetails(true);
                        setIsEditingProfile(true);
                      }}
                      aria-label="Edit donor details"
                    >
                      <Edit className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setShowFullDonorDetails((current) => !current)}
                  >
                    {showFullDonorDetails ? "Hide" : "Full Donor Details"}
                  </Button>
                </div>
              </div>

              <DonorSummary donor={donor} eligibility={eligibility} />

              {showFullDonorDetails && (
                <div className="mt-5 border-t border-border pt-5">
                  {isEditingProfile ? (
                    <DonorProfileEditForm
                      donor={donor}
                      formRef={profileFormRef}
                      isPending={isSavingProfile}
                      onCancel={() => setIsEditingProfile(false)}
                      onSubmit={handleSaveProfile}
                    />
                  ) : (
                    <DonorProfileView donor={donor} />
                  )}
                </div>
              )}
            </section>

            <section className="rounded border border-border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Donor Eligibility / Consent
                </h3>
                <Badge className="bg-muted text-muted-foreground">
                  Donor-level
                </Badge>
              </div>
              <div className="flex items-start gap-4">
                <WorkflowCircle
                  label="Screening"
                  state={
                    eligibility?.screening_result === "PASS"
                      ? "completed"
                      : eligibility?.screening_result === "FAIL"
                        ? "failed"
                        : "active"
                  }
                  onClick={() => setStepTarget({ type: "screening" })}
                />
                <Connector />
                <WorkflowCircle
                  label="Interview & Consent"
                  state={
                    eligibility?.screening_result === "FAIL"
                      ? "not_started"
                      : eligibility?.consent_signed
                        ? "completed"
                        : "not_started"
                  }
                  disabled={!!consentBlockReason}
                  onClick={() => setStepTarget({ type: "consent" })}
                  onBlockedClick={handleConsentClick}
                />
              </div>
              {consentBlockReason && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {consentBlockReason}
                </p>
              )}
            </section>

            <section className="rounded border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Donation / Sample History
                </h3>
                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary">
                      {workflows.length} samples
                    </Badge>
                    <StartWorkflowDialog
                      donorId={donor.donor_id}
                      donorName={`${donor.first_name} ${donor.last_name}`}
                      donorStatus={donor.status}
                      eligibility={eligibility}
                      onStarted={onUpdated}
                    />
                  </div>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {workflows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No Supsup Todo donation workflows yet.
                  </div>
                ) : (
                  workflows.map((workflow) => {
                    const isExpanded = expandedIds.has(workflow.workflow_id);

                    return (
                      <div key={workflow.workflow_id}>
                        <div
                          className="grid w-full cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 md:grid-cols-[auto_120px_90px_130px_minmax(180px,1fr)_140px_auto]"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpanded(workflow.workflow_id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleExpanded(workflow.workflow_id);
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? "Collapse sample tracker"
                                : "Expand sample tracker"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(workflow.workflow_id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                          <SampleRowSummary
                            workflow={workflow}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="justify-self-start md:justify-self-end"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isExpanded) toggleExpanded(workflow.workflow_id);
                            }}
                          >
                            View Tracker
                          </Button>
                        </div>
                        {isExpanded && (
                          <SampleTracker
                            workflow={workflow}
                            onSelectStep={setStepTarget}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <StepActionDialog
        donorId={donor.donor_id}
        target={stepTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setStepTarget(null);
        }}
        onUpdated={onUpdated}
        workflow={targetWorkflow()}
        eligibility={eligibility}
      />
    </>
  );
}

function DonorSummary({
  donor,
  eligibility,
}: {
  donor: DonorDetail;
  eligibility: DonorDetail["supSupTodoEligibility"];
}) {
  const eligibilityStatus =
    eligibility?.screening_result === "FAIL"
      ? "Screening Failed"
      : eligibility?.screening_result === "PASS" && eligibility.consent_signed
        ? "Eligible"
        : eligibility?.screening_result === "PASS"
          ? "Screening Passed"
          : "Pending Screening";

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <DetailItem label="Donor Name" value={`${donor.first_name} ${donor.last_name}`} />
      <DetailItem label="Donor ID" value={`D-${donor.donor_id.toString().padStart(4, "0")}`} />
      <DetailItem label="Contact Number" value={donor.contact_no} />
      <DetailItem label="Donor Status" value={statusLabel(donor.status)} />
      <DetailItem
        label="Total Donated Volume"
        value={`${donor.total_volume.toLocaleString()} mL`}
      />
      <DetailItem label="Donation Count" value={donor.donation_count.toLocaleString()} />
      <DetailItem label="Eligibility Status" value={eligibilityStatus} className="md:col-span-3" />
    </div>
  );
}

function DonorProfileView({ donor }: { donor: DonorDetail }) {
  return (
    <div className="space-y-5">
      <DetailSection title="Personal Information">
        <DetailItem label="First Name" value={donor.first_name} />
        <DetailItem label="Middle Name" value={donor.middle_name} />
        <DetailItem label="Last Name" value={donor.last_name} />
        <DetailItem label="Birthdate" value={formatDate(donor.birthdate)} />
        <DetailItem label="Civil Status" value={donor.civil_status} />
        <DetailItem label="Religion" value={donor.religion} />
        <DetailItem label="Occupation" value={donor.occupation} />
      </DetailSection>

      <DetailSection title="Contact Information">
        <DetailItem label="Contact Number" value={donor.contact_no} />
        <DetailItem label="Address" value={donor.address} className="md:col-span-2" />
      </DetailSection>

      <DetailSection title="Spouse Information">
        <DetailItem label="Spouse Name" value={donor.spouse_name} />
        <DetailItem label="Spouse Occupation" value={donor.spouse_occupation} />
        <DetailItem label="Spouse Contact Number" value={donor.spouse_contact_no} />
      </DetailSection>

      <DetailSection title="Pregnancy / Delivery Information">
        <DetailItem label="Delivery Date" value={formatDate(donor.delivery_date)} />
        <DetailItem label="Delivery Place" value={donor.delivery_place} />
        <DetailItem label="Delivery Type" value={donor.delivery_type} />
        <DetailItem label="AOG" value={donor.aog} />
        <DetailItem
          label="Additional Details"
          value={donor.pregnancy_delivery_details}
          className="md:col-span-2"
        />
      </DetailSection>

      <DetailSection title="Infant Information">
        <DetailItem label="Infant Name" value={donor.infant_name} />
        <DetailItem label="Infant Birthdate" value={formatDate(donor.infant_birthdate)} />
        <DetailItem label="Infant Sex" value={donor.infant_sex} />
        <DetailItem label="Infant Birth Weight" value={donor.infant_birth_weight} />
        <DetailItem
          label="Additional Infant Details"
          value={donor.infant_details}
          className="md:col-span-2"
        />
      </DetailSection>

      <DetailSection title="Donor Status / Registration">
        <DetailItem label="Donor Status" value={statusLabel(donor.status)} />
        <DetailItem label="Registration Date" value={formatDate(donor.registration)} />
        <DetailItem
          label="Total Volume"
          value={`${donor.total_volume.toLocaleString()} mL`}
        />
        <DetailItem
          label="Donation Count"
          value={donor.donation_count.toLocaleString()}
        />
      </DetailSection>
    </div>
  );
}

function DonorProfileEditForm({
  donor,
  formRef,
  isPending,
  onCancel,
  onSubmit,
}: {
  donor: DonorDetail;
  formRef: React.RefObject<HTMLFormElement | null>;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
      <DetailSection title="Personal Information">
        <EditField label="First Name" name="first_name" defaultValue={donor.first_name} required />
        <EditField label="Middle Name" name="middle_name" defaultValue={donor.middle_name ?? ""} />
        <EditField label="Last Name" name="last_name" defaultValue={donor.last_name} required />
        <EditField
          label="Birthdate"
          name="birthdate"
          type="date"
          defaultValue={dateInputValue(donor.birthdate)}
          required
        />
        <EditSelect
          label="Civil Status"
          name="civil_status"
          defaultValue={donor.civil_status}
          options={["Single", "Married", "Widowed", "Separated", "Divorced"]}
        />
        <EditField label="Religion" name="religion" defaultValue={donor.religion ?? ""} />
        <EditField label="Occupation" name="occupation" defaultValue={donor.occupation ?? ""} />
      </DetailSection>

      <DetailSection title="Contact Information">
        <EditField label="Contact Number" name="contact_no" defaultValue={donor.contact_no} required />
        <EditField
          label="Address"
          name="address"
          defaultValue={donor.address}
          required
          className="md:col-span-2"
        />
      </DetailSection>

      <DetailSection title="Spouse Information">
        <EditField label="Spouse Name" name="spouse_name" defaultValue={donor.spouse_name ?? ""} />
        <EditField
          label="Spouse Occupation"
          name="spouse_occupation"
          defaultValue={donor.spouse_occupation ?? ""}
        />
        <EditField
          label="Spouse Contact Number"
          name="spouse_contact_no"
          defaultValue={donor.spouse_contact_no ?? ""}
        />
      </DetailSection>

      <DetailSection title="Pregnancy / Delivery Information">
        <EditField
          label="Delivery Date"
          name="delivery_date"
          type="date"
          defaultValue={dateInputValue(donor.delivery_date)}
        />
        <EditField
          label="Delivery Place"
          name="delivery_place"
          defaultValue={donor.delivery_place ?? ""}
        />
        <EditSelect
          label="Delivery Type"
          name="delivery_type"
          defaultValue={donor.delivery_type ?? ""}
          options={["", "Normal", "Cesarean", "Assisted"]}
        />
        <EditField label="AOG" name="aog" defaultValue={donor.aog ?? ""} />
        <EditTextArea
          label="Additional Pregnancy / Delivery Details"
          name="pregnancy_delivery_details"
          defaultValue={donor.pregnancy_delivery_details ?? ""}
          className="md:col-span-2"
        />
      </DetailSection>

      <DetailSection title="Infant Information">
        <EditField label="Infant Name" name="infant_name" defaultValue={donor.infant_name ?? ""} />
        <EditField
          label="Infant Birthdate"
          name="infant_birthdate"
          type="date"
          defaultValue={dateInputValue(donor.infant_birthdate)}
        />
        <EditSelect
          label="Infant Sex"
          name="infant_sex"
          defaultValue={donor.infant_sex ?? ""}
          options={["", "Male", "Female"]}
        />
        <EditField
          label="Infant Birth Weight"
          name="infant_birth_weight"
          defaultValue={donor.infant_birth_weight ?? ""}
        />
        <EditTextArea
          label="Additional Infant Details"
          name="infant_details"
          defaultValue={donor.infant_details ?? ""}
          className="md:col-span-2"
        />
      </DetailSection>

      <DetailSection title="Donor Status / Registration">
        <EditSelect
          label="Donor Status"
          name="status"
          defaultValue={donor.status}
          options={["ACTIVE", "INACTIVE"]}
        />
        <DetailItem label="Registration Date" value={formatDate(donor.registration)} />
      </DetailSection>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save Donor Details
        </Button>
      </div>
    </form>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded border border-border/50 bg-muted/20 px-3 py-2", className)}>
      <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium text-foreground">
        {displayValue(value)}
      </span>
    </div>
  );
}

function EditField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={`profile-${name}`} className="text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={`profile-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="bg-background border-border"
      />
    </div>
  );
}

function EditTextArea({
  label,
  name,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={`profile-${name}`} className="text-foreground">
        {label}
      </Label>
      <Textarea
        id={`profile-${name}`}
        name={name}
        defaultValue={defaultValue}
        className="min-h-20 bg-background border-border"
      />
    </div>
  );
}

function EditSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`profile-${name}`} className="text-foreground">
        {label}
      </Label>
      <select
        id={`profile-${name}`}
        name={name}
        defaultValue={defaultValue}
        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option ? statusLabel(option) : "Select"}
          </option>
        ))}
      </select>
    </div>
  );
}

function displayValue(value: React.ReactNode) {
  if (value === null || value === undefined || value === "" || value === "--") {
    return "—";
  }
  return value;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function dateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

function dateTimeInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

function numberInputValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}

function Connector({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "h-px bg-border",
        compact ? "mt-3 w-4 flex-none" : "mt-4 flex-1"
      )}
    />
  );
}

function SampleRowSummary({
  workflow,
}: {
  workflow: SupsupTodoWorkflowDetail;
}) {
  return (
    <>
      <span className="font-semibold text-foreground">
        Sample #{workflow.sample_no}
      </span>
      <span className="text-muted-foreground">
        {workflow.extracted_volume ?? workflow.collection?.volume ?? 0} mL
      </span>
      <span className="text-muted-foreground">Supsup Todo</span>
      <div className="font-medium text-foreground">
        {sampleStageLabel(workflow)}
      </div>
      <Badge
        className={cn(
          "w-fit",
          workflow.final_status.includes("FAILED") ||
            workflow.final_status === "DISPOSED"
            ? "bg-destructive/10 text-destructive"
            : workflow.final_status.includes("READY")
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
        )}
      >
        {statusLabel(workflow.final_status)}
      </Badge>
    </>
  );
}

export function SampleTracker({
  workflow,
  onSelectStep,
  compact = false,
}: {
  workflow: SupsupTodoWorkflowDetail;
  onSelectStep: (target: StepTarget) => void;
  compact?: boolean;
}) {
  const stopped = workflow.current_step === "DISPOSED";
  const inCollectionComplete =
    workflow.pre_collection_confirmed || !!workflow.cold_chain_started_at;
  const phaseBodyClass = compact
    ? "space-y-3 bg-muted/20 px-3 py-3"
    : "space-y-5 bg-muted/20 px-6 py-5";

  return (
    <div className={phaseBodyClass}>
      <TrackerPhase title="Phase 1: Collection Preparation" compact={compact}>
        <WorkflowCircle
          label="Lactation & Extraction"
          state={stateFor(workflow, "extraction")}
          disabled={stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "extraction", workflowId: workflow.workflow_id })
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Bottling / Labeling"
          state={stateFor(workflow, "bottling")}
          disabled={!workflow.extraction_completed_at || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "bottling", workflowId: workflow.workflow_id })
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Cold Chain"
          state={stateFor(workflow, "cold_chain")}
          disabled={!workflow.label_confirmed || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "cold_chain", workflowId: workflow.workflow_id })
          }
        />
      </TrackerPhase>

      <TrackerPhase title="Phase 2: Pre-Pasteur Lab Test" compact={compact}>
        <WorkflowCircle
          label="In Collection"
          state={stateFor(workflow, "pre_collection")}
          disabled
          compact={compact}
          onBlockedClick={() =>
            toast.info(
              inCollectionComplete
                ? "This status is automatically set after collection preparation is completed."
                : "Complete Cold Chain before this sample enters Collections."
            )
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Sent to Lab"
          state={stateFor(workflow, "pre_sent")}
          disabled={!inCollectionComplete || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "pre_sent", workflowId: workflow.workflow_id })
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Lab Result"
          state={stateFor(workflow, "pre_result")}
          disabled={!workflow.pre_sent_to_lab || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "pre_result", workflowId: workflow.workflow_id })
          }
        />
      </TrackerPhase>

      <TrackerPhase title="Phase 3: Post-Pasteur Lab Test" compact={compact}>
        <WorkflowCircle
          label="Pasteurization"
          state={stateFor(workflow, "pasteurization")}
          disabled={workflow.pre_lab_result !== "PASS" || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({
              type: "pasteurization",
              workflowId: workflow.workflow_id,
            })
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Sent to Lab"
          state={stateFor(workflow, "post_sent")}
          disabled={!workflow.pasteurization_confirmed || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "post_sent", workflowId: workflow.workflow_id })
          }
        />
        <Connector compact={compact} />
        <WorkflowCircle
          label="Lab Result"
          state={stateFor(workflow, "post_result")}
          disabled={!workflow.post_sent_to_lab || stopped}
          compact={compact}
          onClick={() =>
            onSelectStep({ type: "post_result", workflowId: workflow.workflow_id })
          }
        />
      </TrackerPhase>
    </div>
  );
}

function TrackerPhase({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("rounded border border-border bg-card", compact ? "p-3" : "p-4")}>
      <h4
        className={cn(
          "font-semibold uppercase tracking-wider text-foreground",
          compact ? "mb-3 text-[10px]" : "mb-4 text-xs"
        )}
      >
        {title}
      </h4>
      <div className={cn("flex items-start", compact ? "gap-1" : "gap-2")}>
        {children}
      </div>
    </section>
  );
}

function stateFor(
  workflow: SupsupTodoWorkflowDetail,
  step:
    | "extraction"
    | "bottling"
    | "cold_chain"
    | "pre_collection"
    | "pre_sent"
    | "pre_result"
    | "pasteurization"
    | "post_sent"
    | "post_result"
): WorkflowCircleState {
  if (step === "extraction") {
    return workflow.extraction_completed_at ? "completed" : "active";
  }
  if (step === "bottling") {
    return workflow.label_confirmed
      ? "completed"
      : workflow.current_step === "BOTTLING_LABELING"
        ? "active"
        : "not_started";
  }
  if (step === "cold_chain") {
    return workflow.placed_in_cooler
      ? "completed"
      : workflow.current_step === "COLD_CHAIN"
        ? "active"
        : "not_started";
  }
  if (step === "pre_collection") {
    return workflow.pre_collection_confirmed || workflow.cold_chain_started_at
      ? "completed"
      : workflow.current_step === "PRE_IN_COLLECTION"
        ? "active"
        : "not_started";
  }
  if (step === "pre_sent") {
    return workflow.pre_sent_to_lab
      ? "completed"
      : workflow.current_step === "PRE_SENT_TO_LAB"
        ? "active"
        : "not_started";
  }
  if (step === "pre_result") {
    if (workflow.pre_lab_result === "FAIL") return "failed";
    if (workflow.pre_lab_result === "PASS") return "completed";
    return workflow.pre_sent_to_lab ? "waiting" : "not_started";
  }
  if (step === "pasteurization") {
    return workflow.pasteurization_confirmed
      ? "completed"
      : workflow.current_step === "PASTEURIZATION"
        ? "active"
        : "not_started";
  }
  if (step === "post_sent") {
    return workflow.post_sent_to_lab
      ? "completed"
      : workflow.current_step === "POST_SENT_TO_LAB"
        ? "active"
        : "not_started";
  }
  if (workflow.post_lab_result === "FAIL") return "failed";
  if (workflow.post_lab_result === "PASS") return "completed";
  return workflow.post_sent_to_lab ? "waiting" : "not_started";
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function labStatusLabel(workflow: SupsupTodoWorkflowDetail) {
  if (workflow.final_status === "PRE_LAB_FAILED") return "Pre-Lab Failed";
  if (workflow.final_status === "POST_LAB_FAILED") return "Post-Lab Failed";
  if (workflow.final_status === "WAITING_PRE_LAB_RESULT") {
    return "Pre-Lab Pending";
  }
  if (workflow.final_status === "WAITING_POST_LAB_RESULT") {
    return "Post-Lab Pending";
  }
  if (
    workflow.final_status === "READY_FOR_DISPENSING" ||
    workflow.final_status === "READY_FOR_STORAGE"
  ) {
    return "Ready for Dispensing";
  }
  if (workflow.final_status === "READY_FOR_PASTEURIZATION") {
    return "Ready for Pasteurization";
  }
  return "In Progress";
}

function sampleStageLabel(workflow: SupsupTodoWorkflowDetail) {
  if (
    workflow.current_step === "LACTATION_EXTRACTION" ||
    workflow.current_step === "BOTTLING_LABELING" ||
    workflow.current_step === "COLD_CHAIN"
  ) {
    return "Collection Preparation";
  }

  return labStatusLabel(workflow);
}

export function StepActionDialog({
  donorId,
  target,
  onOpenChange,
  onUpdated,
  workflow,
  eligibility,
}: {
  donorId: number;
  target: StepTarget | null;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => Promise<void> | void;
  workflow: SupsupTodoWorkflowDetail | null;
  eligibility: DonorDetail["supSupTodoEligibility"];
}) {
  const [isPending, startTransition] = useTransition();
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    target: StepTarget;
    raw: Record<string, FormDataEntryValue>;
  } | null>(null);
  const title = target ? titleFor(target.type) : "";

  function saveStep(
    submitTarget: StepTarget,
    raw: Record<string, FormDataEntryValue>
  ) {
    startTransition(async () => {
      const result = await submitStep(donorId, submitTarget, raw);
      if (result.success) {
        toast.success(successMessageFor(submitTarget, raw));
        setPendingConfirmation(null);
        await onUpdated?.();
        onOpenChange(false);
      } else {
        const firstError = Object.values(result.errors).flat()[0];
        toast.error(firstError ?? "Failed to save workflow step.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) return;

    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries());

    if (target.type === "pre_result" || target.type === "post_result") {
      setPendingConfirmation({ target, raw });
      return;
    }

    saveStep(target, raw);
  }

  const confirmationResult = pendingConfirmation?.raw.lab_result;
  const isFailedConfirmation = confirmationResult === "FAIL";

  return (
    <>
      <Dialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null);
          onOpenChange(open);
        }}
      >
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Keep this update focused on the selected workflow step.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {target ? (
              <StepFields
                target={target}
                workflow={workflow}
                eligibility={eligibility}
              />
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Approve / Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingConfirmation}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null);
        }}
      >
        <DialogContent className="max-w-sm bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base">
              {isFailedConfirmation
                ? "Confirm Failed Lab Result"
                : "Confirm Passed Lab Result"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isFailedConfirmation
                ? "Are you sure this milk sample failed the lab test? This will mark the sample for disposal."
                : "Are you sure this milk sample passed the lab test? This will move the sample to the next workflow stage."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setPendingConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isFailedConfirmation ? "destructive" : "default"}
              disabled={isPending || !pendingConfirmation}
              onClick={() => {
                if (pendingConfirmation) {
                  saveStep(pendingConfirmation.target, pendingConfirmation.raw);
                }
              }}
            >
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {isFailedConfirmation ? "Confirm Failed" : "Confirm Passed"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepFields({
  target,
  workflow,
  eligibility,
}: {
  target: StepTarget;
  workflow: SupsupTodoWorkflowDetail | null;
  eligibility: DonorDetail["supSupTodoEligibility"];
}) {
  const nowDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const nowDateTime = useMemo(
    () => new Date().toISOString().slice(0, 16),
    []
  );

  if (target.type === "screening") {
    return (
      <>
        <SelectField
          label="Screening Result"
          name="screening_result"
          options={["PASS", "FAIL"]}
          defaultValue={eligibility?.screening_result ?? undefined}
        />
        <TextField
          label="Screening Date"
          name="screening_date"
          type="date"
          defaultValue={dateInputValue(eligibility?.screening_date) || nowDate}
        />
        <NotesField defaultValue={eligibility?.staff_notes ?? ""} />
      </>
    );
  }

  if (target.type === "consent") {
    return (
      <>
        <SelectField
          label="Consent Signed"
          name="consent_signed"
          options={["true", "false"]}
          defaultValue={eligibility?.consent_signed ? "true" : "false"}
        />
        <TextField
          label="Consent Date"
          name="consent_date"
          type="date"
          defaultValue={dateInputValue(eligibility?.consent_date) || nowDate}
        />
        <NotesField defaultValue={eligibility?.staff_notes ?? ""} />
      </>
    );
  }

  if (target.type === "extraction") {
    return (
      <>
        <TextField
          label="Extraction Date/Time"
          name="extraction_completed_at"
          type="datetime-local"
          defaultValue={dateTimeInputValue(workflow?.extraction_completed_at) || nowDateTime}
        />
        <TextField
          label="Extracted Volume in mL"
          name="extracted_volume"
          type="number"
          min="1"
          defaultValue={numberInputValue(workflow?.extracted_volume)}
        />
        <NotesField defaultValue={workflow?.extraction_notes ?? ""} />
      </>
    );
  }

  if (target.type === "bottling") {
    return (
      <>
        <TextField label="Bottle Number" name="bottle_no" defaultValue={workflow?.bottle_no ?? ""} />
        <NotesField defaultValue={workflow?.bottling_notes ?? ""} />
      </>
    );
  }

  if (target.type === "cold_chain") {
    return (
      <>
        <TextField
          label="Cold Chain Start Time"
          name="cold_chain_started_at"
          type="datetime-local"
          defaultValue={dateTimeInputValue(workflow?.cold_chain_started_at) || nowDateTime}
        />
        <NotesField defaultValue={workflow?.cold_chain_notes ?? ""} />
      </>
    );
  }

  if (target.type === "pre_collection") {
    return (
      <>
        <SelectField
          label="Collection Confirmed"
          name="collection_confirmed"
          options={["true", "false"]}
          defaultValue={workflow?.pre_collection_confirmed ? "true" : "false"}
        />
        <NotesField defaultValue={workflow?.pre_in_collection_notes ?? ""} />
      </>
    );
  }

  if (target.type === "pre_sent") {
    return (
      <SentToLabFields
        sampleVolume={workflow?.pre_sample_volume}
        sentDate={workflow?.pre_sample_sent_at}
        expectedResultDate={workflow?.pre_expected_result_date}
        notes={workflow?.pre_sent_notes}
        fallbackSentDate={nowDate}
      />
    );
  }

  if (target.type === "pre_result" || target.type === "post_result") {
    return (
      <>
        <SelectField
          label="Lab Result"
          name="lab_result"
          options={["PASS", "FAIL"]}
          defaultValue={
            target.type === "pre_result"
              ? workflow?.pre_lab_result ?? undefined
              : workflow?.post_lab_result ?? undefined
          }
        />
        <TextField
          label="Result Received Date"
          name="result_received_date"
          type="date"
          defaultValue={
            dateInputValue(
              target.type === "pre_result"
                ? workflow?.pre_lab_received_at
                : workflow?.post_lab_received_at
            ) || nowDate
          }
        />
        <NotesField
          defaultValue={
            target.type === "pre_result"
              ? workflow?.pre_lab_notes ?? ""
              : workflow?.post_lab_notes ?? ""
          }
        />
      </>
    );
  }

  if (target.type === "pasteurization") {
    return (
      <>
        <TextField
          label="Pasteurization Date"
          name="pasteurization_date"
          type="date"
          defaultValue={dateInputValue(workflow?.pasteurization_completed_at) || nowDate}
        />
        <NotesField defaultValue={workflow?.pasteurization_notes ?? ""} />
      </>
    );
  }

  return (
    <SentToLabFields
      sampleVolume={workflow?.post_sample_volume}
      sentDate={workflow?.post_sample_sent_at}
      expectedResultDate={workflow?.post_expected_result_date}
      notes={workflow?.post_sent_notes}
      fallbackSentDate={nowDate}
    />
  );
}

function addDaysInputValue(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function SentToLabFields({
  sampleVolume,
  sentDate,
  expectedResultDate,
  notes,
  fallbackSentDate,
}: {
  sampleVolume: number | null | undefined;
  sentDate: Date | string | null | undefined;
  expectedResultDate: Date | string | null | undefined;
  notes: string | null | undefined;
  fallbackSentDate: string;
}) {
  const initialSentDate = dateInputValue(sentDate) || fallbackSentDate;
  const [currentSentDate, setCurrentSentDate] = useState(initialSentDate);
  const [currentExpectedDate, setCurrentExpectedDate] = useState(
    dateInputValue(expectedResultDate) || addDaysInputValue(initialSentDate, 14)
  );

  return (
    <>
      <TextField
        label="Sample Volume in mL"
        name="sample_volume"
        type="number"
        max="5"
        step="0.1"
        defaultValue={numberInputValue(sampleVolume)}
      />
      <div className="grid gap-2">
        <Label htmlFor="sent_date">Sent Date</Label>
        <Input
          id="sent_date"
          name="sent_date"
          type="date"
          value={currentSentDate}
          onChange={(e) => {
            setCurrentSentDate(e.target.value);
            setCurrentExpectedDate(addDaysInputValue(e.target.value, 14));
          }}
          required
          className="bg-card border-border"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expected_result_date">Expected Result Date</Label>
        <Input
          id="expected_result_date"
          name="expected_result_date"
          type="date"
          value={currentExpectedDate}
          onChange={(e) => setCurrentExpectedDate(e.target.value)}
          required
          className="bg-card border-border"
        />
      </div>
      <NotesField defaultValue={notes ?? ""} />
    </>
  );
}

async function submitStep(
  donorId: number,
  target: StepTarget,
  raw: Record<string, FormDataEntryValue>
) {
  if (target.type === "screening") return updateDonorScreening(donorId, raw);
  if (target.type === "consent") return updateDonorConsent(donorId, raw);
  if (target.type === "extraction") {
    return updateLactationExtraction(target.workflowId, raw);
  }
  if (target.type === "bottling") {
    return updateBottlingLabeling(target.workflowId, raw);
  }
  if (target.type === "cold_chain") return updateColdChain(target.workflowId, raw);
  if (target.type === "pre_collection") {
    return updatePreLabInCollection(target.workflowId, raw);
  }
  if (target.type === "pre_sent") return updatePreLabSentToLab(target.workflowId, raw);
  if (target.type === "pre_result") return recordPreLabResult(target.workflowId, raw);
  if (target.type === "pasteurization") {
    return updatePasteurization(target.workflowId, raw);
  }
  if (target.type === "post_sent") return updatePostLabSentToLab(target.workflowId, raw);
  return recordPostLabResult(target.workflowId, raw);
}

function successMessageFor(
  target: StepTarget,
  raw: Record<string, FormDataEntryValue>
) {
  if (target.type === "screening") {
    return raw.screening_result === "FAIL"
      ? "Screening marked as failed."
      : "Screening passed.";
  }

  if (target.type === "consent") {
    return raw.consent_signed === "true"
      ? "Interview and consent completed."
      : "Interview and consent updated.";
  }

  return "Workflow step saved.";
}

function titleFor(type: StepTarget["type"]) {
  const labels: Record<StepTarget["type"], string> = {
    screening: "Screening",
    consent: "Interview & Consent",
    extraction: "Lactation & Extraction",
    bottling: "Bottling / Labeling",
    cold_chain: "Cold Chain",
    pre_collection: "Pre-Pasteur In Collection",
    pre_sent: "Pre-Pasteur Sent to Lab",
    pre_result: "Pre-Pasteur Lab Result",
    pasteurization: "Pasteurization",
    post_sent: "Post-Pasteur Sent to Lab",
    post_result: "Post-Pasteur Lab Result",
  };
  return labels[type];
}

function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  min,
  max,
  step,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        required={required}
        className="bg-card border-border"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "true" ? "Yes" : option === "false" ? "No" : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function NotesField({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="staff_notes">Staff Notes</Label>
      <Textarea
        id="staff_notes"
        name="staff_notes"
        defaultValue={defaultValue}
        className="min-h-20 bg-card border-border"
      />
    </div>
  );
}
