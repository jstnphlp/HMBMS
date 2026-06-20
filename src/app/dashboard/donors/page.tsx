import {
  getDonorsWithStats,
  getDonorMetrics,
} from "@/features/donors/queries";
import { DonorMetricCards } from "@/features/donors/components/donor-metric-cards";
import { DonorRegistry } from "@/features/donors/components/donor-registry";
import { measure } from "@/core/utils/perf";

interface DonorsPageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function DonorsPage({ searchParams }: DonorsPageProps) {
  const params = await searchParams;
  const query = params.query ?? "";

  const [donors, metrics] = await measure("donors page load", () =>
    Promise.all([
      getDonorsWithStats(query || undefined),
      getDonorMetrics(),
    ])
  );

  return (
    <div className="mx-auto max-w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
          Donor Management
        </h1>
      </div>
      <DonorMetricCards metrics={metrics} />
      <DonorRegistry
        donors={donors}
        searchQuery={query}
      />
    </div>
  );
}
