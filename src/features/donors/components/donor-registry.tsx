"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/core/ui/skeleton";
import { DonorTable } from "./donor-table";
import { DonorDetailPanel } from "./donor-detail-panel";
import { getDonorDetail } from "../actions";
import type { DonorWithStats, DonorDetail } from "../queries";

interface DonorRegistryProps {
  donors: DonorWithStats[];
  searchQuery: string;
}

export function DonorRegistry({
  donors,
  searchQuery,
}: DonorRegistryProps) {
  const router = useRouter();
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(
    donors.length > 0 ? donors[0].donor_id : null
  );
  const [selectedDetail, setSelectedDetail] = useState<DonorDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(donors.length > 0);
  const [isDetailClosed, setIsDetailClosed] = useState(false);
  const selectedStillVisible =
    selectedDonorId !== null &&
    donors.some((donor) => donor.donor_id === selectedDonorId);
  const effectiveSelectedDonorId =
    donors.length === 0 || (selectedDonorId === null && isDetailClosed)
      ? null
      : selectedStillVisible
        ? selectedDonorId
        : donors[0]?.donor_id ?? null;

  useEffect(() => {
    if (!effectiveSelectedDonorId) {
      return;
    }

    let cancelled = false;

    getDonorDetail(effectiveSelectedDonorId)
      .then((detail) => {
        if (!cancelled) {
          setSelectedDetail(detail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedDetail(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveSelectedDonorId]);

  function handleSelectDonor(donorId: number) {
    if (donorId === effectiveSelectedDonorId) {
      return;
    }

    setSelectedDonorId(donorId);
    setSelectedDetail(null);
    setIsLoadingDetail(true);
    setIsDetailClosed(false);
  }

  function handleCloseDetail() {
    setSelectedDonorId(null);
    setSelectedDetail(null);
    setIsLoadingDetail(false);
    setIsDetailClosed(true);
  }

  async function refreshSelectedDonor() {
    if (!effectiveSelectedDonorId) return;

    try {
      const detail = await getDonorDetail(effectiveSelectedDonorId);
      setSelectedDetail(detail);
      router.refresh();
    } finally {
      setIsLoadingDetail(false);
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-13rem)] min-h-0">
      <DonorTable
        donors={donors}
        selectedDonorId={effectiveSelectedDonorId}
        onSelectDonor={handleSelectDonor}
        searchQuery={searchQuery}
      />
      {(isLoadingDetail ||
        (effectiveSelectedDonorId !== null &&
          selectedDetail?.donor_id !== effectiveSelectedDonorId)) && (
        <DonorDetailSkeleton />
      )}
      {!isLoadingDetail &&
        effectiveSelectedDonorId !== null &&
        selectedDetail?.donor_id === effectiveSelectedDonorId && (
        <DonorDetailPanel
          donor={selectedDetail}
          onClose={handleCloseDetail}
          onDonorUpdated={refreshSelectedDonor}
        />
      )}
      {!isLoadingDetail && effectiveSelectedDonorId === null && (
        <DonorEmptyDetail hasResults={donors.length > 0} />
      )}
    </div>
  );
}

function DonorEmptyDetail({ hasResults }: { hasResults: boolean }) {
  return (
    <section className="flex-1 min-w-[320px] max-w-[400px] flex flex-col items-center justify-center bg-surface border border-border rounded-lg p-8 text-center">
      <p className="text-sm font-medium text-foreground">
        {hasResults ? "No selected donor in current results." : "No donor found."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {hasResults
          ? "Select a donor row to view details."
          : "Try adjusting the search or filters."}
      </p>
    </section>
  );
}

function DonorDetailSkeleton() {
  return (
    <section className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-surface border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-6 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </section>
  );
}
