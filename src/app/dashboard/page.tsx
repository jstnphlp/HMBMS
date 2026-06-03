import { MetricCards } from "@/features/dashboard/components/metric-card";
import { InventoryTable } from "@/features/dashboard/components/inventory-table";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-6 text-lg leading-8 font-semibold tracking-tight text-foreground">
        Clinical Operations Dashboard
      </h1>
      <MetricCards />
      <InventoryTable />
    </div>
  );
}
