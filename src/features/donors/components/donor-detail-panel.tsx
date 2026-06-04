"use client";

import { Button } from "@/core/ui/button";
import { Badge } from "@/core/ui/badge";
import { DonorStatusBadge } from "./donor-status-badge";
import { ProgramBadge } from "./program-badge";
import { cn } from "@/core/utils/cn";
import {
  Phone,
  Home,
  Edit,
  Check,
  FileText,
} from "lucide-react";
import type { DonorDetail } from "../queries";

interface DonorDetailPanelProps {
  donor: DonorDetail;
  className?: string;
}

const screeningSteps = [
  "Interview",
  "Blood Test",
  "Home Visit",
  "Cleared",
];

export function DonorDetailPanel({ donor, className }: DonorDetailPanelProps) {
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
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-primary">
            <Edit className="size-4" />
          </Button>
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
            {/* Connecting Line Background */}
            <div className="absolute top-3 left-6 right-6 h-0.5 bg-border -z-10" />
            {/* Progress Line */}
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
        >
          Log Drop-off
        </Button>
        <Button className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          View History
        </Button>
      </div>
    </section>
  );
}
