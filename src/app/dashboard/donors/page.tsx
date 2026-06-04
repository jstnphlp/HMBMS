import {
  getDonorsWithStats,
  getDonorById,
  getDonorMetrics,
} from "@/features/donors/queries";
import { DonorMetricCards } from "@/features/donors/components/donor-metric-cards";
import { DonorRegistry } from "@/features/donors/components/donor-registry";
import type { DonorDetail } from "@/features/donors/queries";

interface DonorsPageProps {
  searchParams: Promise<{ query?: string }>;
}

export default async function DonorsPage({ searchParams }: DonorsPageProps) {
  const params = await searchParams;
  const query = params.query ?? "";

  const [donors, metrics] = await Promise.all([
    getDonorsWithStats(query || undefined),
    getDonorMetrics(),
  ]);

  const donorDetails: Record<number, DonorDetail> = {};
  await Promise.all(
    donors.slice(0, 20).map(async (d) => {
      const detail = await getDonorById(d.donor_id);
      if (detail) {
        donorDetails[d.donor_id] = detail;
      }
    })
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
        donorDetails={donorDetails}
        searchQuery={query}
      />
    </div>
  );
}
