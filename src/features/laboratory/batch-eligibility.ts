import type { LabBatchSummary } from "./queries";

export type LabBatchType = "PRE_PSTR" | "PSTR" | "POST_PSTR";

export const LAB_BATCH_TYPES: {
  value: LabBatchType;
  label: string;
  title: string;
  auditPrefix: string;
}[] = [
  {
    value: "PRE_PSTR",
    label: "PRE-PSTR Lab Test",
    title: "PRE-PSTR Lab Test Batch",
    auditPrefix: "PRE-PSTR",
  },
  {
    value: "PSTR",
    label: "PSTR",
    title: "PSTR Batch",
    auditPrefix: "PSTR",
  },
  {
    value: "POST_PSTR",
    label: "POST-PSTR Lab Test",
    title: "POST-PSTR Lab Test Batch",
    auditPrefix: "POST-PSTR",
  },
];

const FINAL_BLOCKED_STATUSES = new Set(["AVAILABLE", "DISPOSED", "DISPENSED"]);
const FAILED_FINAL_STATUSES = new Set([
  "PRE_LAB_FAILED",
  "POST_LAB_FAILED",
  "DISPOSED",
]);

export function getLabBatchTypeMeta(batchType: LabBatchType) {
  return LAB_BATCH_TYPES.find((type) => type.value === batchType) ?? LAB_BATCH_TYPES[0];
}

export function getBatchEligibility(
  collection: LabBatchSummary,
  batchType: LabBatchType
) {
  const workflow = collection.supSupTodoWorkflow;
  const batchStatus = collection.status;
  const finalStatus = workflow?.final_status;

  if (FINAL_BLOCKED_STATUSES.has(batchStatus)) return false;
  if (finalStatus && FAILED_FINAL_STATUSES.has(finalStatus)) return false;
  if (workflow?.pre_lab_result === "FAIL" || workflow?.post_lab_result === "FAIL") {
    return false;
  }

  if (batchType === "PRE_PSTR") {
    if (collection.pre_pasteurization?.result === "PASS") return false;
    if (collection.pre_pasteurization?.result === "FAIL") return false;
    if (workflow) {
      return (
        !!workflow.cold_chain_started_at &&
        workflow.pre_lab_result !== "PASS" &&
        workflow.pre_lab_result !== "FAIL" &&
        !workflow.pasteurization_confirmed &&
        !workflow.post_sent_to_lab &&
        !workflow.post_lab_result
      );
    }

    return batchStatus === "POOLING" || collection.pre_pasteurization?.result === "PENDING";
  }

  if (batchType === "PSTR") {
    if (workflow) {
      return (
        workflow.pre_lab_result === "PASS" &&
        !workflow.pasteurization_confirmed &&
        !workflow.post_sent_to_lab &&
        !workflow.post_lab_result &&
        finalStatus === "READY_FOR_PASTEURIZATION"
      );
    }

    return collection.pre_pasteurization?.result === "PASS" && batchStatus === "TESTING";
  }

  if (workflow) {
    return (
      workflow.pre_lab_result === "PASS" &&
      workflow.pasteurization_confirmed &&
      workflow.post_lab_result !== "PASS" &&
      workflow.post_lab_result !== "FAIL" &&
      batchStatus !== "AVAILABLE"
    );
  }

  return (
    batchStatus === "PASTEURIZED" &&
    collection.post_pasteurization?.result !== "PASS" &&
    collection.post_pasteurization?.result !== "FAIL"
  );
}
