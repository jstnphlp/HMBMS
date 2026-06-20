import {
  getInventorySummary,
  getCollectionLogs,
  getDisposalLogs,
} from "@/features/inventory/queries";
import { InventoryMetrics } from "@/features/inventory/components/inventory-metrics";
import { InventoryTabs } from "@/features/inventory/components/inventory-tabs";
import { measure } from "@/core/utils/perf";

export default async function InventoryPage() {
  const [summary, collections, disposals] = await measure(
    "inventory page load",
    () =>
      Promise.all([
        getInventorySummary(),
        getCollectionLogs(),
        getDisposalLogs(),
      ])
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
            Inventory Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Master view of milk intake, stock levels, and disposal records.
          </p>
        </div>
      </div>
      <InventoryMetrics summary={summary} />
      <InventoryTabs collections={collections} disposals={disposals} />
    </div>
  );
}
