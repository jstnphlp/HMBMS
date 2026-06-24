"use server";

import { db } from "@/core/db";
import { getAvailableMilkSources } from "@/features/distribution/queries";

export type DashboardSummary = {
  totalStock: number;
  pendingLabTests: number;
  activeDonors: number;
  awaitingDispensing: number;
};

export type RecentMilkInventoryRow = {
  id: string;
  collectionDate: string | null;
  donorName: string;
  program: string | null;
  status: string;
  volume: number | null;
};

const PENDING_COLLECTION_BATCH_STATUSES = ["ACTIVE", "IN_PROGRESS"] as const;
const PENDING_WORKFLOW_STATUSES = [
  "WAITING_PRE_LAB_RESULT",
  "WAITING_POST_LAB_RESULT",
] as const;

function hasUsablePostPasteurizationPass(batch: {
  labResults: { stage: string; result: string }[];
  supSupTodoWorkflow: { post_lab_result: string | null } | null;
  collections: {
    is_pasteurized: boolean;
    status: string;
    expiration_date: Date | null;
  }[];
}) {
  return (
    batch.labResults.some(
      (lab) => lab.stage === "POST_PASTEURIZATION" && lab.result === "PASS"
    ) ||
    batch.supSupTodoWorkflow?.post_lab_result === "PASS" ||
    batch.collections.some(
      (collection) =>
        collection.is_pasteurized &&
        collection.status === "READY_FOR_DISPENSING"
    )
  );
}

function isNotExpired(collections: { expiration_date: Date | null }[]) {
  const now = new Date();
  return collections.every(
    (collection) =>
      !collection.expiration_date || collection.expiration_date > now
  );
}

async function getAvailableInventoryBatches() {
  return db.batch.findMany({
    where: {
      status: "AVAILABLE",
      inventory: { isNot: null },
      remaining_volume: { gt: 0 },
    },
    include: {
      inventory: { select: { available_vol: true } },
      labResults: { select: { stage: true, result: true } },
      supSupTodoWorkflow: { select: { post_lab_result: true } },
      collections: {
        select: {
          is_pasteurized: true,
          status: true,
          expiration_date: true,
        },
      },
    },
  });
}

async function getPendingLabTestCount() {
  const activeCollectionBatches = await db.collectionBatch.findMany({
    where: {
      batch_type: { in: ["PRE_PSTR", "POST_PSTR"] },
      status: { in: [...PENDING_COLLECTION_BATCH_STATUSES] },
    },
    include: {
      items: {
        select: {
          collection: { select: { batch_id: true } },
        },
      },
    },
  });

  const batchedProcessingIds = new Set(
    activeCollectionBatches.flatMap((batch) =>
      batch.items
        .map((item) => item.collection.batch_id)
        .filter((batchId): batchId is number => batchId != null)
    )
  );

  const individualBatches = await db.batch.findMany({
    where: {
      batch_id: { notIn: [...batchedProcessingIds] },
      status: { in: ["TESTING", "PASTEURIZED", "POOLING"] },
    },
    select: {
      status: true,
      labResults: { select: { stage: true, result: true } },
      supSupTodoWorkflow: {
        select: {
          final_status: true,
          pre_sent_to_lab: true,
          pre_lab_result: true,
          post_sent_to_lab: true,
          post_lab_result: true,
        },
      },
    },
  });

  const pendingIndividualCount = individualBatches.filter((batch) => {
    const preResult = batch.labResults.find(
      (lab) => lab.stage === "PRE_PASTEURIZATION"
    )?.result;
    const postResult = batch.labResults.find(
      (lab) => lab.stage === "POST_PASTEURIZATION"
    )?.result;
    const workflow = batch.supSupTodoWorkflow;

    if (
      workflow &&
      PENDING_WORKFLOW_STATUSES.includes(
        workflow.final_status as (typeof PENDING_WORKFLOW_STATUSES)[number]
      )
    ) {
      return true;
    }

    if (
      batch.status === "TESTING" &&
      (!preResult || preResult === "PENDING" || workflow?.pre_sent_to_lab)
    ) {
      return true;
    }

    if (
      batch.status === "PASTEURIZED" &&
      (!postResult || postResult === "PENDING" || workflow?.post_sent_to_lab)
    ) {
      return true;
    }

    return false;
  }).length;

  return activeCollectionBatches.length + pendingIndividualCount;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [availableBatches, pendingLabTests, activeDonors, sources] =
    await Promise.all([
      getAvailableInventoryBatches(),
      getPendingLabTestCount(),
      db.donor.count({ where: { status: "ACTIVE" } }),
      getAvailableMilkSources(),
    ]);

  const totalStock = availableBatches
    .filter(
      (batch) =>
        (batch.inventory?.available_vol ?? 0) > 0 &&
        hasUsablePostPasteurizationPass(batch) &&
        isNotExpired(batch.collections)
    )
    .reduce((sum, batch) => sum + (batch.inventory?.available_vol ?? 0), 0);

  return {
    totalStock,
    pendingLabTests,
    activeDonors,
    awaitingDispensing: sources.length,
  };
}

function collectionStatus(collection: {
  status: string;
  is_pasteurized: boolean;
  supSupTodoWorkflow: {
    final_status: string;
    pre_sent_to_lab: boolean;
    pre_lab_result: string | null;
    post_sent_to_lab: boolean;
    post_lab_result: string | null;
  } | null;
  batch: {
    status: string;
    inventory: { available_vol: number } | null;
    labResults: { stage: string; result: string }[];
  } | null;
}) {
  const workflow = collection.supSupTodoWorkflow;
  if (workflow?.final_status === "DISPOSED") return "Disposed";
  if (workflow?.pre_lab_result === "FAIL") return "Failed";
  if (workflow?.post_lab_result === "FAIL") return "Failed";
  if (workflow?.final_status === "WAITING_PRE_LAB_RESULT") return "Awaiting Result";
  if (workflow?.final_status === "WAITING_POST_LAB_RESULT") return "Awaiting Result";
  if (workflow?.pre_sent_to_lab && !workflow.pre_lab_result) return "Awaiting Result";
  if (workflow?.post_sent_to_lab && !workflow.post_lab_result) return "Awaiting Result";
  if (workflow?.final_status === "READY_FOR_PASTEURIZATION") return "Passed";
  if (workflow?.final_status === "READY_FOR_STORAGE") return "Pasteurized";
  if (workflow?.final_status === "READY_FOR_DISPENSING") return "Available";

  if (!collection.batch) {
    return collection.status === "PENDING_LAB_TEST" ? "Ready for Lab" : "Testing";
  }

  if (collection.batch.status === "DISPOSED") return "Disposed";
  if (collection.batch.status === "DISPENSED") return "Dispensed";
  if (collection.batch.status === "POOLING") return "Pooling";
  if (collection.batch.status === "TESTING") {
    const pending = collection.batch.labResults.some(
      (lab) => lab.result === "PENDING"
    );
    return pending ? "Awaiting Result" : "Testing";
  }
  if (collection.batch.status === "PASTEURIZED") return "Pasteurized";
  if (collection.batch.status === "AVAILABLE") return "Available";

  return collection.batch.status;
}

export async function getRecentInventory(): Promise<RecentMilkInventoryRow[]> {
  const collections = await db.collection.findMany({
    take: 10,
    orderBy: { collection_date: "desc" },
    include: {
      donor: { select: { first_name: true, last_name: true } },
      supSupTodoWorkflow: {
        select: {
          final_status: true,
          pre_sent_to_lab: true,
          pre_lab_result: true,
          post_sent_to_lab: true,
          post_lab_result: true,
        },
      },
      batch: {
        select: {
          status: true,
          remaining_volume: true,
          inventory: { select: { available_vol: true } },
          labResults: { select: { stage: true, result: true } },
        },
      },
    },
  });

  return collections.map((collection) => {
    const status = collectionStatus(collection);
    const availableVolume =
      status === "Available"
        ? collection.batch?.inventory?.available_vol ?? collection.batch?.remaining_volume ?? null
        : status === "Disposed" || status === "Dispensed" || status === "Failed"
          ? 0
          : collection.volume;

    return {
      id: collection.tracking_no ?? `CTN-${String(collection.ctn).padStart(4, "0")}`,
      collectionDate: collection.collection_date.toISOString(),
      donorName: `${collection.donor.first_name} ${collection.donor.last_name}`,
      program: collection.program,
      status,
      volume: availableVolume,
    };
  });
}
