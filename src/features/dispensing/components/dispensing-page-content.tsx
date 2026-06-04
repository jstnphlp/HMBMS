"use client";

import { DispensingMetricCards } from "./dispensing-metrics";
import { RecipientTable } from "./recipient-table";
import { DispensingLogTable } from "./dispensing-log-table";
import { RecordDispensingForm } from "./record-dispensing-form";
import type {
  DispensingMetrics,
  BeneficiaryEntry,
  DispensingLogEntry,
  AvailableBatch,
} from "../queries";

interface DispensingPageContentProps {
  metrics: DispensingMetrics;
  beneficiaries: BeneficiaryEntry[];
  logs: DispensingLogEntry[];
  batches: AvailableBatch[];
  dispensedBy: number;
}

export function DispensingPageContent({
  metrics,
  beneficiaries,
  logs,
  batches,
  dispensedBy,
}: DispensingPageContentProps) {
  return (
    <div className="mx-auto max-w-full space-y-6">
      {/* Page header — matches Stitch: mb-6 flex justify-between items-end */}
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

      {/* Metric Cards */}
      <DispensingMetricCards metrics={metrics} />

      {/* Main Grid — matches Stitch: grid-cols-1 xl:grid-cols-12 gap-6 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Tables (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <RecipientTable beneficiaries={beneficiaries} />
          <DispensingLogTable logs={logs} />
        </div>

        {/* Right: Form (4 cols) */}
        <div className="xl:col-span-4">
          <RecordDispensingForm
            batches={batches}
            beneficiaries={beneficiaries}
            dispensedBy={dispensedBy}
          />
        </div>
      </div>
    </div>
  );
}
