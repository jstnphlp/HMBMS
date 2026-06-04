"use client";

import { useState } from "react";
import { DonorTable } from "./donor-table";
import { DonorDetailPanel } from "./donor-detail-panel";
import type { DonorWithStats, DonorDetail } from "../queries";

interface DonorRegistryProps {
  donors: DonorWithStats[];
  donorDetails: Record<number, DonorDetail>;
  searchQuery: string;
}

export function DonorRegistry({
  donors,
  donorDetails,
  searchQuery,
}: DonorRegistryProps) {
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(
    donors.length > 0 ? donors[0].donor_id : null
  );

  const selectedDetail = selectedDonorId
    ? donorDetails[selectedDonorId] ?? null
    : null;

  return (
    <div className="flex gap-4 h-[calc(100vh-13rem)] min-h-0">
      <DonorTable
        key={searchQuery}
        donors={donors}
        selectedDonorId={selectedDonorId}
        onSelectDonor={setSelectedDonorId}
        searchQuery={searchQuery}
      />
      {selectedDetail && <DonorDetailPanel donor={selectedDetail} />}
    </div>
  );
}
