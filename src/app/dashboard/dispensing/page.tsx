import {
  getDispensingMetrics,
  getBeneficiaries,
  getDispensingLogs,
  getAvailableBatches,
} from "@/features/dispensing/queries";
import { DispensingPageContent } from "@/features/dispensing/components/dispensing-page-content";

export default async function DispensingPage() {
  const [metrics, beneficiaries, logs, batches] = await Promise.all([
    getDispensingMetrics(),
    getBeneficiaries(),
    getDispensingLogs(),
    getAvailableBatches(),
  ]);

  return (
    <DispensingPageContent
      metrics={metrics}
      beneficiaries={beneficiaries}
      logs={logs}
      batches={batches}
      dispensedBy={1}
    />
  );
}
