"use client";

import { useState } from "react";
import { DispensingMetricCards } from "./dispensing-metrics";
import { DispensingTable } from "./dispensing-table";
import { DispensingDetailPanel } from "./dispensing-detail-panel";
import { DispensingFilters } from "./dispensing-filters";
import type {
  DispensingMetrics,
  BeneficiaryEntry,
  DispensingLogEntry,
  AvailableBatch,
} from "../queries";

interface DispensingViewProps {
  metrics: DispensingMetrics;
  beneficiaries: BeneficiaryEntry[];
  logs: DispensingLogEntry[];
  batches: AvailableBatch[];
  dispensedBy: number;
}

export function DispensingView({
  metrics,
  beneficiaries,
  logs,
  batches,
  dispensedBy,
}: DispensingViewProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("ALL");

  const filtered = logs.filter((d) => {
    const matchesSearch =
      search === "" ||
      d.batchCode.toLowerCase().includes(search.toLowerCase()) ||
      d.beneficiaryId.toLowerCase().includes(search.toLowerCase()) ||
      d.beneficiaryContact.includes(search);
    const matchesProgram =
      programFilter === "ALL" || d.batchCode.includes(programFilter);
    return matchesSearch && matchesProgram;
  });

  const selectedDispensing = selectedId
    ? logs.find((d) => d.dis_id === selectedId) ?? null
    : null;

  return (
    <div className="mx-auto max-w-full space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
            Dispensing &amp; Recipient Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage active prescriptions, allocate batch resources, and log
            distribution.
          </p>
        </div>
      </div>

      <DispensingMetricCards metrics={metrics} />

      <div className="h-[calc(100vh-280px)] flex flex-col xl:flex-row gap-6 min-h-0">
        <div className="xl:flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <DispensingFilters
            search={search}
            onSearchChange={setSearch}
            programFilter={programFilter}
            onProgramChange={setProgramFilter}
          />
          <DispensingTable
            logs={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        <div className="xl:w-[380px] shrink-0 xl:sticky xl:top-0 xl:self-start xl:max-h-[calc(100vh-280px)] xl:overflow-y-auto">
          <DispensingDetailPanel
            selectedDispensing={selectedDispensing}
            batches={batches}
            beneficiaries={beneficiaries}
            dispensedBy={dispensedBy}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  );
}
