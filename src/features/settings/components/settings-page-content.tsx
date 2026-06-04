"use client";

import { SettingsStats } from "./settings-stats";
import { StaffDirectoryTable } from "./staff-directory-table";
import { SystemProtocols } from "./system-protocols";
import { RecentActivity } from "./recent-activity";
import { Button } from "@/core/ui/button";
import { Download, Plus } from "lucide-react";

interface StaffMember {
  user_id: number;
  email: string;
  role: string;
}

interface AuditLogEntry {
  id: string;
  description: string;
  highlight?: string;
  source: string;
  timestamp: string;
  color: "primary" | "tertiary" | "muted";
}

interface SettingsPageContentProps {
  staff: StaffMember[];
  staffCount: number;
  auditLogs: AuditLogEntry[];
}

export function SettingsPageContent({
  staff,
  staffCount,
  auditLogs,
}: SettingsPageContentProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            System Settings &amp; Administration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage hospital staff access, configure system protocols, and
            monitor security logs.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 border-border text-foreground text-xs font-medium"
          >
            <Download className="h-4 w-4" />
            Export Audit Log
          </Button>
          <Button className="gap-2 text-xs font-medium">
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <SettingsStats staffCount={staffCount} />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Staff Directory Table — 8 columns */}
        <div className="col-span-1 md:col-span-8">
          <StaffDirectoryTable staff={staff} />
        </div>

        {/* Right Panel — 4 columns */}
        <div className="col-span-1 flex flex-col gap-4 md:col-span-4">
          <SystemProtocols />
          <RecentActivity items={auditLogs} />
        </div>
      </div>
    </div>
  );
}
