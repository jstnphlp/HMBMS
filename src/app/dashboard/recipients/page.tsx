import {
  getRecipientsWithStats,
  getRecipientMetrics,
} from "@/features/recipients/queries";
import { RecipientMetricCards } from "@/features/recipients/components/recipient-metric-cards";
import { RecipientRegistry } from "@/features/recipients/components/recipient-registry";
import { measure } from "@/core/utils/perf";

export default async function RecipientsPage() {
  const [recipients, metrics] = await measure("recipients page load", () =>
    Promise.all([
      getRecipientsWithStats(),
      getRecipientMetrics(),
    ])
  );

  return (
    <div className="mx-auto max-w-full overflow-x-hidden space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          Recipient Management
        </h1>
      </div>
      <RecipientMetricCards metrics={metrics} />
      <RecipientRegistry recipients={recipients} />
    </div>
  );
}
