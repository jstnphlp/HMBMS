"use client";

import { Badge } from "@/core/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import type { GeneratedReport } from "../queries";

const PROGRAM_LABELS: Record<string, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function volume(value: number) {
  return `${Math.round(value).toLocaleString()} mL`;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function DetailTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-muted-foreground" colSpan={columns.length}>
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-border">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function GeneratedReportPreview({
  report,
}: {
  report: GeneratedReport | null;
}) {
  if (!report) return null;

  const summaryCards = [
    report.collection
      ? {
          label: "Total Collected",
          value: volume(report.collection.totalCollectedVolume),
        }
      : null,
    report.processing
      ? {
          label: "Total Processed",
          value: volume(report.processing.pasteurizationBatches.totalProcessedVolume),
        }
      : null,
    report.inventory
      ? {
          label: "Available Stock",
          value: volume(report.inventory.availableStockVolume),
        }
      : null,
    report.dispensing
      ? {
          label: "Total Dispensed",
          value: volume(report.dispensing.totalDispensedVolume),
        }
      : null,
    report.disposal
      ? {
          label: "Total Disposed",
          value: volume(report.disposal.totalDisposedVolume),
        }
      : null,
    report.donor
      ? {
          label: "Registered Donors",
          value: report.donor.registeredDonors.toLocaleString(),
        }
      : null,
    report.recipient
      ? {
          label: "Registered Recipients",
          value: report.recipient.registeredRecipients.toLocaleString(),
        }
      : null,
  ].filter((card): card is { label: string; value: string } => Boolean(card));

  return (
    <Card className="rounded border-border bg-card">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">{report.title}</CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatDate(report.dateFrom)} - {formatDate(report.dateTo)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Generated {formatDateTime(report.generatedAt)}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{report.period.replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{report.category.replaceAll("_", " ")}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {!report.hasRecords && (
          <div className="rounded border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No records found for this report period.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>

        {report.collection && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Collection Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Collection Records"
                value={report.collection.collectionRecords.toLocaleString()}
              />
              <SummaryCard
                label="Average Volume"
                value={volume(report.collection.averageCollectionVolume)}
              />
              <SummaryCard
                label="Failed / Rejected"
                value={report.collection.failedOrRejectedCollections.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["Program", "Records", "Volume"]}
              rows={report.collection.collectionsByProgram.map((row) => [
                PROGRAM_LABELS[row.program] ?? row.program,
                row.count,
                volume(row.volume),
              ])}
            />
            <DetailTable
              columns={["Donor", "Records", "Volume"]}
              rows={report.collection.collectionsByDonor.map((row) => [
                row.donorName,
                row.count,
                volume(row.volume),
              ])}
            />
          </section>
        )}

        {report.processing && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Processing Report</h3>
            <DetailTable
              columns={["Stage", "Total Tested", "Passed", "Failed", "Awaiting Result"]}
              rows={[
                [
                  "Pre-pasteurization",
                  report.processing.prePasteurization.totalTested,
                  report.processing.prePasteurization.passed,
                  report.processing.prePasteurization.failed,
                  report.processing.prePasteurization.awaitingResult,
                ],
                [
                  "Post-pasteurization",
                  report.processing.postPasteurization.totalTested,
                  report.processing.postPasteurization.passed,
                  report.processing.postPasteurization.failed,
                  report.processing.postPasteurization.awaitingResult,
                ],
              ]}
            />
            <DetailTable
              columns={["Batches", "Processed Volume", "Completed", "In Progress", "Losses"]}
              rows={[
                [
                  report.processing.pasteurizationBatches.totalBatches,
                  volume(report.processing.pasteurizationBatches.totalProcessedVolume),
                  report.processing.pasteurizationBatches.completed,
                  report.processing.pasteurizationBatches.inProgress,
                  volume(report.processing.processingLosses),
                ],
              ]}
            />
          </section>
        )}

        {report.dispensing && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Dispensing Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Transactions"
                value={report.dispensing.dispensingTransactions.toLocaleString()}
              />
              <SummaryCard
                label="Recipients Served"
                value={report.dispensing.recipientsServed.toLocaleString()}
              />
              <SummaryCard
                label="Beneficiaries Served"
                value={report.dispensing.beneficiariesServed.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["CTN / Batch", "Volume"]}
              rows={report.dispensing.volumeBySource.map((row) => [
                row.source,
                volume(row.volume),
              ])}
            />
            <DetailTable
              columns={["Payment Status", "Transactions", "Volume"]}
              rows={report.dispensing.paymentStatusSummary.map((row) => [
                row.status.replaceAll("_", " "),
                row.count,
                volume(row.volume),
              ])}
            />
            <DetailTable
              columns={["Released By", "Transactions", "Volume"]}
              rows={report.dispensing.releasedByStaff.map((row) => [
                row.staffName,
                row.count,
                volume(row.volume),
              ])}
            />
          </section>
        )}

        {report.inventory && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Inventory Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Inventory Records"
                value={report.inventory.inventoryRecords.toLocaleString()}
              />
              <SummaryCard
                label="Available Batches"
                value={report.inventory.availableBatches.toLocaleString()}
              />
              <SummaryCard
                label="Expired Collections"
                value={report.inventory.expiredCollectionCount.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["Available Stock", "Disposed Batches"]}
              rows={[
                [
                  volume(report.inventory.availableStockVolume),
                  report.inventory.disposedBatches,
                ],
              ]}
            />
          </section>
        )}

        {report.disposal && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Disposal Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Disposed Records"
                value={report.disposal.disposedRecords.toLocaleString()}
              />
              <SummaryCard
                label="Failed Pre-Pasteurization"
                value={report.disposal.failedPrePasteurizationCount.toLocaleString()}
              />
              <SummaryCard
                label="Failed Post-Pasteurization"
                value={report.disposal.failedPostPasteurizationCount.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["Reason", "Records", "Volume"]}
              rows={report.disposal.reasons.map((row) => [
                row.reason,
                row.count,
                volume(row.volume),
              ])}
            />
          </section>
        )}

        {report.donor && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Donor Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Active Donors"
                value={report.donor.activeDonors.toLocaleString()}
              />
              <SummaryCard
                label="Inactive Donors"
                value={report.donor.inactiveDonors.toLocaleString()}
              />
              <SummaryCard
                label="Donors With Collections"
                value={report.donor.donorsWithCollections.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["Donor", "Collections", "Volume"]}
              rows={report.donor.donorCollections.map((row) => [
                row.donorName,
                row.count,
                volume(row.volume),
              ])}
            />
          </section>
        )}

        {report.recipient && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Recipient Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Active Recipients"
                value={report.recipient.activeRecipients.toLocaleString()}
              />
              <SummaryCard
                label="Inactive Recipients"
                value={report.recipient.inactiveRecipients.toLocaleString()}
              />
              <SummaryCard
                label="Requests"
                value={report.recipient.requestCount.toLocaleString()}
              />
            </div>
            <DetailTable
              columns={["Recipients Served", "Beneficiaries Served"]}
              rows={[
                [
                  report.recipient.recipientsServed,
                  report.recipient.beneficiariesServed,
                ],
              ]}
            />
          </section>
        )}
      </CardContent>
    </Card>
  );
}
