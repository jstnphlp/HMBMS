import { DistributionPageContent } from "@/features/distribution/components/distribution-page-content";
import { getDistributionData } from "@/features/distribution/queries";
import { measure } from "@/core/utils/perf";

export default async function DistributionPage() {
  const data = await measure("distribution page load", () =>
    getDistributionData()
  );

  return <DistributionPageContent data={data} />;
}
