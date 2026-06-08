import {
  getDispensingMetrics,
  getBeneficiaries,
  getDispensingLogs,
  getAvailableBatches,
} from "@/features/dispensing/queries";
import { DispensingView } from "@/features/dispensing/components/dispensing-view";

export default async function DispensingPage() {
  const [metrics, beneficiaries, logs, batches] = await Promise.all([
    getDispensingMetrics(),
    getBeneficiaries(),
    getDispensingLogs(),
    getAvailableBatches(),
  ]);

  return (
    <DispensingView
      metrics={metrics}
      beneficiaries={beneficiaries}
      logs={logs}
      batches={batches}
      dispensedBy={1}
    />
  );
}
