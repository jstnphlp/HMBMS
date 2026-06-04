"use client";

import { Button } from "@/core/ui/button";
import { Badge } from "@/core/ui/badge";
import { Separator } from "@/core/ui/separator";
import { RecipientStatusBadge } from "./recipient-status-badge";
import { cn } from "@/core/utils/cn";
import {
  Phone,
  Edit,
  Droplets,
  History,
  MessageSquare,
} from "lucide-react";
import type { RecipientDetail } from "../queries";

interface RecipientDetailPanelProps {
  recipient: RecipientDetail;
  className?: string;
}

export function RecipientDetailPanel({
  recipient,
  className,
}: RecipientDetailPanelProps) {
  function formatDate(date: Date | string | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function formatFullDate(date: Date | string | null) {
    if (!date) return "--";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <section
      className={cn(
        "col-span-4 bg-surface border border-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden",
        className
      )}
    >
      {/* Profile Header */}
      <div className="p-4 border-b border-border bg-card flex justify-between items-start shrink-0">
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            Recipient Profile
          </h3>
          <p className="text-xs text-primary font-medium">
            REC-{String(recipient.beneficiary_id).padStart(4, "0")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:bg-muted px-2 py-1 h-7 text-xs gap-1 border border-transparent hover:border-border"
        >
          <Edit className="size-3.5" />
          Edit
        </Button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-xs text-muted-foreground">
              Contact Number
            </span>
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              {recipient.contact_no}
            </span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              Total Volume Received
            </span>
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Droplets className="size-3.5 text-muted-foreground" />
              {recipient.total_volume.toLocaleString()} mL
            </span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              Total Dispensings
            </span>
            <span className="font-medium text-foreground">
              {recipient.dispensing_count}
            </span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">
              Status
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <RecipientStatusBadge
                hasDispensings={recipient.dispensing_count > 0}
                lastDispensingDate={recipient.last_dispensing_date}
                totalVolume={recipient.total_volume}
              />
            </div>
          </div>
        </div>

        {/* Remarks */}
        {recipient.remarks && (
          <div>
            <span className="block text-xs text-muted-foreground mb-1">
              Remarks
            </span>
            <p className="text-sm text-foreground bg-muted/50 p-3 rounded border border-border/50">
              {recipient.remarks}
            </p>
          </div>
        )}

        <Separator className="bg-border" />

        {/* Dispensing Request Log */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
            <History className="size-4 text-muted-foreground" />
            Dispensing History
          </h4>
          {recipient.dispensings.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recipient.dispensings.slice(0, 10).map((d) => (
                <div
                  key={d.dis_id}
                  className="p-2.5 border border-border rounded bg-surface text-xs flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">
                      {formatDate(d.dispensing_date)}
                    </span>
                    <span className="text-primary font-bold">
                      {d.volume.toLocaleString()} mL
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Batch: {d.batch.batch_code}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                        {d.batch.status}
                      </span>
                    </span>
                  </div>
                  {d.remarks && (
                    <p className="text-muted-foreground italic">
                      {d.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground text-xs bg-muted/30 rounded border border-border/50">
              <Droplets className="size-5 mx-auto mb-2 text-muted-foreground/50" />
              No dispensing records yet.
            </div>
          )}
        </div>

        {/* SMS History */}
        {recipient.sms_history.length > 0 && (
          <>
            <Separator className="bg-border" />
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2 text-foreground">
                <MessageSquare className="size-4 text-muted-foreground" />
                SMS Notifications
              </h4>
              <div className="flex flex-col gap-2">
                {recipient.sms_history.slice(0, 5).map((s) => (
                  <div
                    key={s.sms_id}
                    className="p-2 border border-border rounded bg-surface text-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-foreground">
                        {formatFullDate(s.scheduled_at)}
                      </span>
                      <Badge
                        className={cn(
                          "text-[9px] px-1.5 py-0",
                          s.status === "SENT"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : s.status === "FAILED"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate">
                      {s.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-border bg-card shrink-0 flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-8 text-xs border-border"
        >
          <MessageSquare className="size-3.5 mr-1" />
          Send SMS
        </Button>
        <Button className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
          <Droplets className="size-3.5 mr-1" />
          Record Dispensing
        </Button>
      </div>
    </section>
  );
}
