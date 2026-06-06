import {
  getRecipientsWithStats,
  getRecipientById,
  getRecipientMetrics,
} from "@/features/recipients/queries";
import { RecipientMetricCards } from "@/features/recipients/components/recipient-metric-cards";
import { RecipientRegistry } from "@/features/recipients/components/recipient-registry";
import type { RecipientDetail } from "@/features/recipients/queries";

export default async function RecipientsPage() {
  const [recipients, metrics] = await Promise.all([
    getRecipientsWithStats(),
    getRecipientMetrics(),
  ]);

  const recipientDetails: Record<number, RecipientDetail> = {};
  await Promise.all(
    recipients.slice(0, 20).map(async (r) => {
      const detail = await getRecipientById(r.beneficiary_id);
      if (detail) {
        recipientDetails[r.beneficiary_id] = detail;
      }
    })
  );

  return (
    <div className="mx-auto max-w-full overflow-x-hidden space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          Recipient Management
        </h1>
      </div>
      <RecipientMetricCards metrics={metrics} />
      <RecipientRegistry
        recipients={recipients}
        recipientDetails={recipientDetails}
      />
    </div>
  );
}
