import {
  getBatchesForLab,
  getBatchLabDetail,
} from "@/features/laboratory/queries";
import { LaboratoryView } from "@/features/laboratory/components/laboratory-view";
import { FlaskConical } from "lucide-react";
import { measure } from "@/core/utils/perf";

export default async function LaboratoryPage() {
  const { batches, initialDetail } = await measure(
    "laboratory page load",
    async () => {
      const batches = await getBatchesForLab();
      const firstBatchId = batches[0]?.batch_id ?? null;
      const initialDetail = firstBatchId
        ? await getBatchLabDetail(firstBatchId)
        : null;

      return { batches, initialDetail };
    }
  );

  return (
    <div className="mx-auto max-w-[1400px] flex flex-col h-[calc(100vh-3.5rem-3rem)]">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="size-5 text-primary" />
            <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
              Collections
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage collection samples, lab testing, and pasteurization workflows.
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <LaboratoryView
        batches={batches}
        initialBatchDetail={initialDetail}
      />
    </div>
  );
}
