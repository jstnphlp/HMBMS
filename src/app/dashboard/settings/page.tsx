import {
  getStaffMembers,
  getActiveStaffCount,
  getRecentAuditLogs,
} from "@/features/settings/queries";
import { SettingsPageContent } from "@/features/settings/components/settings-page-content";

export default async function SettingsPage() {
  const [staff, activeCount, auditLogs] = await Promise.all([
    getStaffMembers(),
    getActiveStaffCount(),
    getRecentAuditLogs(10),
  ]);

  const formattedLogs = auditLogs.map((log) => ({
    id: String(log.log_id),
    description: log.action_details,
    source: log.user?.full_name || log.user?.email || "System",
    timestamp: new Date(log.action_date).toLocaleString(),
  }));

  return (
    <SettingsPageContent
      staff={staff}
      activeCount={activeCount}
      auditLogs={formattedLogs}
    />
  );
}
