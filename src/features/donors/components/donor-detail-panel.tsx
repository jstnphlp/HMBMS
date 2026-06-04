"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/core/ui/button";
import { Badge } from "@/core/ui/badge";
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
import { Separator } from "@/core/ui/separator";
import { DonorStatusBadge } from "./donor-status-badge";
import { ProgramBadge } from "./program-badge";
import { cn } from "@/core/utils/cn";
import { updateDonor } from "../actions";
import { LogDropoffModal } from "./log-dropoff-modal";
import { DonorHistoryModal } from "./donor-history-modal";
import {
  Phone,
  Home,
  Edit,
  Check,
  FileText,
  X,
  Loader2,
} from "lucide-react";
import type { DonorDetail } from "../queries";

interface DonorDetailPanelProps {
  donor: DonorDetail;
  onClose: () => void;
  className?: string;
}

const screeningSteps = [
  "Interview",
  "Blood Test",
  "Home Visit",
  "Cleared",
];

export function DonorDetailPanel({
  donor,
  onClose,
  className,
}: DonorDetailPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [dropoffOpen, setDropoffOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  function formatDate(date: Date | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  function getInitials(first: string, last: string) {
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  }

  const registrationDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(donor.registration));

  const completedSteps =
    donor.status === "ACTIVE" ? screeningSteps.length : 1;

  return (
    <>
      <section
        className={cn(
          "flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-surface border border-border rounded-lg overflow-hidden",
          className
        )}
      >
        {/* Profile Header */}
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
                  ID: D-{donor.donor_id.toString().padStart(4, "0")} &bull; Since{" "}
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

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Screening Tracker */}
          <div>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
              Screening Tracker
            </h3>
            <div className="flex justify-between items-center relative px-2">
              <div className="absolute top-3 left-6 right-6 h-0.5 bg-border -z-10" />
              <div
                className="absolute top-3 left-6 h-0.5 bg-emerald-600 -z-10 transition-all"
                style={{
                  width: `calc(${((completedSteps - 1) / (screeningSteps.length - 1)) * 100}% - ${((completedSteps - 1) / (screeningSteps.length - 1)) * 48}px)`,
                }}
              />
              {screeningSteps.map((step, i) => {
                const isCompleted = i < completedSteps;
                const isCurrent = i === completedSteps - 1;
                return (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1 relative z-0 bg-surface px-1"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-surface text-[14px]",
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-border text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-3" />
                      ) : (
                        <span className="text-[10px]">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px]",
                        isCurrent
                          ? "font-bold text-emerald-700"
                          : "text-muted-foreground"
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
              Donation Metrics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 p-3 rounded border border-border/50">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Total Volume
                </span>
                <span className="text-[20px] font-bold text-primary">
                  {donor.total_volume.toLocaleString()}{" "}
                  <span className="text-[12px] font-normal text-muted-foreground">
                    mL
                  </span>
                </span>
              </div>
              <div className="bg-muted/50 p-3 rounded border border-border/50">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Donation Count
                </span>
                <span className="text-[20px] font-bold text-primary">
                  {donor.donation_count}{" "}
                  <span className="text-[12px] font-normal text-muted-foreground">
                    batches
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center justify-between">
              Contact Info
              <Button
                variant="link"
                className="text-primary h-auto p-0 text-[10px] font-normal"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            </h3>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-start gap-2">
                <Phone className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{donor.contact_no}</span>
              </div>
              <div className="flex items-start gap-2">
                <Home className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">{donor.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-foreground">
                  Civil Status: {donor.civil_status}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Collections */}
          {donor.collections.length > 0 && (
            <div>
              <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                Recent Collections
              </h3>
              <div className="space-y-2">
                {donor.collections.slice(0, 5).map((c) => (
                  <div
                    key={c.ctn}
                    className="flex justify-between items-center text-[12px] py-1.5 px-2 rounded bg-muted/30"
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        CTN-{c.ctn.toString().padStart(4, "0")}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {formatDate(c.collection_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {c.volume} mL
                      </span>
                      {c.batch && (
                        <Badge className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0">
                          {c.batch.batch_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3 border-t border-border bg-card shrink-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-8 text-xs border-border"
            onClick={() => setDropoffOpen(true)}
          >
            Log Drop-off
          </Button>
          <Button
            className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setHistoryOpen(true)}
          >
            View History
          </Button>
        </div>
      </section>

      <DonorEditDialog
        donor={donor}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <LogDropoffModal
        donorId={donor.donor_id}
        donorName={`${donor.first_name} ${donor.last_name}`}
        open={dropoffOpen}
        onOpenChange={setDropoffOpen}
      />

      <DonorHistoryModal
        donor={donor}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </>
  );
}

function DonorEditDialog({
  donor,
  open,
  onOpenChange,
}: {
  donor: DonorDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

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
        onOpenChange(false);
      } else {
        const errors = result.errors as Record<string, string[]>;
        const firstError = Object.values(errors).flat()[0];
        toast.error(firstError ?? "Failed to update donor.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Edit Donor Information
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the donor&apos;s profile and status.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Status
            </h3>
            <Separator className="flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-foreground">
                Donor Status
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select name="status" defaultValue={donor.status}>
                <SelectTrigger
                  id="status"
                  className="bg-card border-border text-foreground w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Personal Information */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Personal Information
            </h3>
            <Separator className="flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <EditField
              label="First Name"
              name="first_name"
              defaultValue={donor.first_name}
              required
            />
            <EditField
              label="Middle Name"
              name="middle_name"
              defaultValue={donor.middle_name ?? ""}
            />
            <EditField
              label="Last Name"
              name="last_name"
              defaultValue={donor.last_name}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <EditField
              label="Date of Birth"
              name="birthdate"
              type="date"
              defaultValue={toDateString(donor.birthdate)}
              required
            />
            <EditField
              label="Contact Number"
              name="contact_no"
              placeholder="09XXXXXXXXX"
              defaultValue={donor.contact_no}
              required
            />
            <div className="grid gap-2">
              <Label htmlFor="civil_status" className="text-foreground">
                Civil Status
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Select name="civil_status" defaultValue={donor.civil_status}>
                <SelectTrigger
                  id="civil_status"
                  className="bg-card border-border text-foreground w-full"
                >
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <EditField
              label="Address"
              name="address"
              defaultValue={donor.address}
              required
            />
            <div className="grid grid-cols-2 gap-4 items-end">
              <EditField
                label="Religion"
                name="religion"
                defaultValue={donor.religion ?? ""}
              />
              <EditField
                label="Occupation"
                name="occupation"
                defaultValue={donor.occupation ?? ""}
              />
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Spouse Information */}
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
              Spouse Information
            </h3>
            <Separator className="flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <EditField
              label="Name of Spouse"
              name="spouse_name"
              defaultValue={donor.spouse_name ?? ""}
            />
            <EditField
              label="Spouse Occupation"
              name="spouse_occupation"
              defaultValue={donor.spouse_occupation ?? ""}
            />
            <EditField
              label="Spouse Contact No."
              name="spouse_contact_no"
              placeholder="09XXXXXXXXX"
              defaultValue={donor.spouse_contact_no ?? ""}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-border text-foreground"
              onClick={() => onOpenChange(false)}
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
  type = "text",
  placeholder,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
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
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="bg-card border-border text-foreground"
      />
    </div>
  );
}
