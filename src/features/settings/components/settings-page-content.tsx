"use client";

import { useState } from "react";
import { SettingsStats } from "./settings-stats";
import { StaffDirectoryTable } from "./staff-directory-table";
import { RecentActivity } from "./recent-activity";
import { AddStaffDialog } from "./add-staff-dialog";
import { EditStaffSheet } from "./edit-staff-sheet";
import { Button } from "@/core/ui/button";
import { Download } from "lucide-react";

interface StaffMember {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

interface AuditLogEntry {
  id: string;
  description: string;
  source: string;
  timestamp: string;
}

interface SettingsPageContentProps {
  staff: StaffMember[];
  activeCount: number;
  auditLogs: AuditLogEntry[];
}

export function SettingsPageContent({
  staff,
  activeCount,
  auditLogs,
}: SettingsPageContentProps) {
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            System Settings &amp; Administration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff access and monitor system activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 border-border text-foreground text-xs font-medium"
            disabled
            title="TODO: Implement audit log export"
          >
            <Download className="h-4 w-4" />
            Export Audit Log
          </Button>
          <AddStaffDialog />
        </div>
      </div>

      <SettingsStats activeCount={activeCount} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="col-span-1 md:col-span-8">
          <StaffDirectoryTable
            staff={staff}
            onEdit={(member) => setSelectedUser(member)}
          />
        </div>

        <div className="col-span-1 md:col-span-4 md:sticky md:top-0 md:self-start md:max-h-screen md:overflow-y-auto">
          <RecentActivity items={auditLogs} />
        </div>
      </div>

      <EditStaffSheet
        user={selectedUser}
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      />
    </div>
  );
}
