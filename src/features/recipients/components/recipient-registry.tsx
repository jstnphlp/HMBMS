"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/core/ui/skeleton";
import { RecipientTable } from "./recipient-table";
import { RecipientDetailPanel } from "./recipient-detail-panel";
import { RecipientRegistrationModal } from "./recipient-registration-modal";
import { Inbox } from "lucide-react";
import { getRecipientDetail } from "../actions";
import type { RecipientWithStats, RecipientDetail } from "../queries";

interface RecipientRegistryProps {
  recipients: RecipientWithStats[];
}

export function RecipientRegistry({
  recipients,
}: RecipientRegistryProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(
    null
  );
  const [selectedDetail, setSelectedDetail] = useState<RecipientDetail | null>(
    null
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);

  useEffect(() => {
    if (!selectedRecipientId) {
      return;
    }

    let cancelled = false;

    getRecipientDetail(selectedRecipientId)
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
  }, [selectedRecipientId]);

  function handleSelectRecipient(recipientId: number) {
    setSelectedRecipientId(recipientId);
    setSelectedDetail(null);
    setIsLoadingDetail(true);
  }

  function handleCloseDetail() {
    setSelectedRecipientId(null);
    setSelectedDetail(null);
    setIsLoadingDetail(false);
  }

  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-13rem)] min-h-0 min-w-0 overflow-hidden">
        <RecipientTable
          recipients={recipients}
          selectedRecipientId={selectedRecipientId}
          onSelectRecipient={handleSelectRecipient}
          onRegisterNew={() => setRegistrationOpen(true)}
        />

        {/* Persistent detail container */}
        <section className="flex-1 min-w-0 max-w-[400px] flex flex-col bg-surface border border-border rounded-lg overflow-hidden">
          {isLoadingDetail ? (
            <RecipientDetailSkeleton />
          ) : selectedDetail ? (
            <RecipientDetailPanel
              recipient={selectedDetail}
              onClose={handleCloseDetail}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No Recipient Selected
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Select a recipient from the table to view their details and
                dispensing history.
              </p>
            </div>
          )}
        </section>
      </div>

      <RecipientRegistrationModal
        open={registrationOpen}
        onOpenChange={setRegistrationOpen}
      />
    </>
  );
}

function RecipientDetailSkeleton() {
  return (
    <>
      <div className="p-4 border-b border-border bg-card">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <div className="flex-1 space-y-6 p-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </>
  );
}
