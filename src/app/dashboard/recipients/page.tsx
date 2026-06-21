import { RecipientsPageContent } from "@/features/recipients/components/recipients-page-content";
import { getRecipientMetrics, getRecipients } from "@/features/recipients/queries";
import { measure } from "@/core/utils/perf";

export default async function RecipientsPage() {
  const [metrics, recipients] = await measure("recipients page load", () =>
    Promise.all([getRecipientMetrics(), getRecipients()])
  );

  return <RecipientsPageContent metrics={metrics} recipients={recipients} />;
}
