"use server";

import { db } from "@/core/db";
import type { RecipientListItem, RecipientRequestSummary } from "@/features/recipients/queries";

export type DistributionRequest = {
  request_id: number;
  request_no: string;
  recipient_id: number;
  recipient_name: string;
  beneficiary_id: number;
  beneficiary_name: string;
  requested_volume: number;
  allocated_volume: number;
  released_volume: number;
  priority: string;
  status: string;
  payment_status: string;
  deposit_amount: number | null;
  price_per_ml: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  payment_notes: string | null;
  needed_by: string | null;
  created_at: string;
  released_at: string | null;
  released_by: string | null;
  remarks: string | null;
  source_ctns: string[];
  recipient_detail: RecipientListItem;
  request_detail: RecipientRequestSummary;
};

export type DispensingLogbookEntry = DistributionRequest & {
  dispensing_id: number | null;
  volume_released: number;
  release_date: string | null;
};

export type AvailableMilkSource = {
  batch_id: number;
  batch_code: string;
  available_vol: number;
  expiration_date: string | null;
  collection_date: string | null;
  source_label: string;
};

export type DistributionData = {
  queue: DistributionRequest[];
  ready: DistributionRequest[];
  released: DispensingLogbookEntry[];
  cancelled: DistributionRequest[];
  sources: AvailableMilkSource[];
};

const priorityRank: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

function recipientName(recipient: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
}) {
  return [recipient.first_name, recipient.middle_name, recipient.last_name]
    .filter(Boolean)
    .join(" ");
}

function sourceLabels(request: {
  allocations: {
    batch: { batch_code: string; collections: { tracking_no: string | null }[] };
  }[];
}) {
  return request.allocations.map((allocation) => {
    const trackingNo = allocation.batch.collections[0]?.tracking_no;
    return trackingNo ?? allocation.batch.batch_code;
  });
}

function fullName(recipient: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
}) {
  return [recipient.first_name, recipient.middle_name, recipient.last_name]
    .filter(Boolean)
    .join(" ");
}

function recipientDisplayId(id: number) {
  return `REC-${String(id).padStart(4, "0")}`;
}

function mapRequest(request: Awaited<ReturnType<typeof fetchRequests>>[number]): DistributionRequest {
  const requestDetail = {
    request_id: request.request_id,
    request_no: request.request_no,
    beneficiary_id: request.beneficiary_id,
    beneficiary_name: request.beneficiary.name,
    status: request.status,
    priority: request.priority,
    requested_volume: request.requested_volume,
    allocated_volume: request.allocated_volume,
    released_volume: request.released_volume,
    reason: request.reason,
    needed_by: request.needed_by?.toISOString() ?? null,
    remarks: request.remarks,
    profile_complete: request.profile_complete,
    beneficiary_complete: request.beneficiary_complete,
    reason_provided: request.reason_provided,
    volume_entered: request.volume_entered,
    staff_approved: request.staff_approved,
    cancellation_reason: request.cancellation_reason,
    created_at: request.created_at.toISOString(),
    released_at: request.released_at?.toISOString() ?? null,
  };

  return {
    request_id: request.request_id,
    request_no: request.request_no,
    recipient_id: request.recipient_id,
    recipient_name: recipientName(request.recipient),
    beneficiary_id: request.beneficiary_id,
    beneficiary_name: request.beneficiary.name,
    requested_volume: request.requested_volume,
    allocated_volume: request.allocated_volume,
    released_volume: request.released_volume,
    priority: request.priority,
    status: request.status,
    payment_status: request.payment_status,
    deposit_amount: request.deposit_amount,
    price_per_ml: request.price_per_ml,
    total_amount: request.total_amount,
    amount_paid: request.amount_paid,
    payment_notes: request.payment_notes,
    needed_by: request.needed_by?.toISOString() ?? null,
    created_at: request.created_at.toISOString(),
    released_at: request.released_at?.toISOString() ?? null,
    released_by: request.releaser?.full_name || request.releaser?.email || null,
    remarks: request.remarks,
    source_ctns: sourceLabels(request),
    request_detail: requestDetail,
    recipient_detail: {
      recipient_id: request.recipient.recipient_id,
      display_id: recipientDisplayId(request.recipient.recipient_id),
      first_name: request.recipient.first_name,
      middle_name: request.recipient.middle_name,
      last_name: request.recipient.last_name,
      full_name: fullName(request.recipient),
      contact_no: request.recipient.contact_no,
      address: request.recipient.address,
      relationship_to_beneficiary: request.recipient.relationship_to_beneficiary,
      notes: request.recipient.notes,
      status: request.recipient.status,
      created_at: request.recipient.created_at.toISOString(),
      beneficiaries: request.recipient.beneficiaries.map((beneficiary) => ({
        beneficiary_id: beneficiary.beneficiary_id,
        name: beneficiary.name,
        birthdate: beneficiary.birthdate?.toISOString() ?? null,
        sex: beneficiary.sex,
        birth_weight: beneficiary.birth_weight,
        gestational_age: beneficiary.gestational_age,
        medical_condition: beneficiary.medical_condition,
        notes: beneficiary.notes ?? beneficiary.remarks,
      })),
      requests: [requestDetail],
      latestRequest: requestDetail,
    },
  };
}

async function fetchRequests() {
  return db.milkRequest.findMany({
    where: {
      status: { in: ["QUEUED", "READY_FOR_RELEASE", "RELEASED", "CANCELLED"] },
    },
    include: {
      recipient: {
        include: {
          beneficiaries: { orderBy: { created_at: "desc" } },
        },
      },
      beneficiary: { select: { name: true } },
      releaser: { select: { email: true, full_name: true } },
      allocations: {
        include: {
          batch: {
            select: {
              batch_code: true,
              collections: {
                take: 1,
                select: { tracking_no: true },
              },
            },
          },
        },
        orderBy: { allocated_at: "asc" },
      },
      dispensings: {
        orderBy: { dispensing_date: "desc" },
        take: 1,
        select: { dis_id: true, dispensing_date: true, volume: true },
      },
    },
    orderBy: [{ priority: "asc" }, { created_at: "asc" }],
  });
}

export async function getAvailableMilkSources(): Promise<AvailableMilkSource[]> {
  const now = new Date();
  const batches = await db.batch.findMany({
    where: {
      status: "AVAILABLE",
      inventory: { isNot: null },
    },
    include: {
      inventory: { select: { available_vol: true } },
      labResults: { select: { stage: true, result: true } },
      supSupTodoWorkflow: { select: { post_lab_result: true } },
      collections: {
        orderBy: { collection_date: "asc" },
        select: {
          tracking_no: true,
          collection_date: true,
          expiration_date: true,
          is_pasteurized: true,
          status: true,
        },
      },
    },
    take: 100,
  });

  return batches
    .filter((batch) => {
      const available = batch.inventory?.available_vol ?? 0;
      const hasPostPass =
        batch.labResults.some(
          (lab) => lab.stage === "POST_PASTEURIZATION" && lab.result === "PASS"
        ) ||
        batch.supSupTodoWorkflow?.post_lab_result === "PASS" ||
        batch.collections.some(
          (collection) =>
            collection.is_pasteurized &&
            collection.status === "READY_FOR_DISPENSING"
        );
      const notExpired = batch.collections.every(
        (collection) =>
          !collection.expiration_date || collection.expiration_date > now
      );

      return available > 0 && hasPostPass && notExpired;
    })
    .map((batch) => {
      const firstCollection = batch.collections[0] ?? null;
      return {
        batch_id: batch.batch_id,
        batch_code: batch.batch_code,
        available_vol: batch.inventory?.available_vol ?? 0,
        expiration_date: firstCollection?.expiration_date?.toISOString() ?? null,
        collection_date: firstCollection?.collection_date?.toISOString() ?? null,
        source_label: firstCollection?.tracking_no ?? batch.batch_code,
      };
    })
    .sort((a, b) => {
      if (a.expiration_date && b.expiration_date) {
        return (
          new Date(a.expiration_date).getTime() -
          new Date(b.expiration_date).getTime()
        );
      }
      if (a.expiration_date) return -1;
      if (b.expiration_date) return 1;
      return (
        new Date(a.collection_date ?? 0).getTime() -
        new Date(b.collection_date ?? 0).getTime()
      );
    });
}

export async function getDistributionData(): Promise<DistributionData> {
  const [requests, sources] = await Promise.all([
    fetchRequests(),
    getAvailableMilkSources(),
  ]);

  const mapped = requests.map(mapRequest).sort((a, b) => {
    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return {
    queue: mapped.filter((request) => request.status === "QUEUED"),
    ready: mapped.filter((request) => request.status === "READY_FOR_RELEASE"),
    released: requests
      .filter((request) => request.status === "RELEASED")
      .map((request) => {
        const base = mapRequest(request);
        const dispensing = request.dispensings[0] ?? null;
        return {
          ...base,
          dispensing_id: dispensing?.dis_id ?? null,
          volume_released: dispensing?.volume ?? request.released_volume,
          release_date:
            dispensing?.dispensing_date.toISOString() ??
            request.released_at?.toISOString() ??
            null,
        };
      }),
    cancelled: mapped.filter((request) => request.status === "CANCELLED"),
    sources,
  };
}
