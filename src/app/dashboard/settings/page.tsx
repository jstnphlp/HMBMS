import { getStaffDirectory, getStaffCount, getRecentAuditLogs } from "@/features/settings/queries";
import { SettingsPageContent } from "@/features/settings/components/settings-page-content";

export default async function SettingsPage() {
  const [staff, staffCount, auditLogs] = await Promise.all([
    getStaffDirectory(),
    getStaffCount(),
    getRecentAuditLogs(5),
  ]);

  const formattedLogs = auditLogs.map((log) => ({
    id: String(log.log_id),
    description: log.action_details,
    source: log.user?.email ?? "System",
    timestamp: new Date(log.action_date).toLocaleString(),
    color: "primary" as const,
  }));

  return (
    <SettingsPageContent
      staff={staff}
      staffCount={staffCount.total}
      auditLogs={formattedLogs}
    />
  );
}
