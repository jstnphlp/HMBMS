import type { DonorEligibilitySummary } from "./queries";

export function getSupsupTodoStartBlockReason(
  eligibility: DonorEligibilitySummary
) {
  if (eligibility?.screening_result === "FAIL") {
    return "Screening failed. Supsup Todo cannot be started unless screening is updated.";
  }

  if (eligibility?.screening_result !== "PASS" && !eligibility?.consent_signed) {
    return "Complete Screening and Interview & Consent before starting Supsup Todo.";
  }

  if (eligibility?.screening_result !== "PASS") {
    return "Screening must be passed before starting Supsup Todo.";
  }

  if (!eligibility?.consent_signed) {
    return "Interview and consent must be completed before starting Supsup Todo.";
  }

  return null;
}

export function canStartSupsupTodoDonation(
  eligibility: DonorEligibilitySummary
) {
  return getSupsupTodoStartBlockReason(eligibility) === null;
}

export function getConsentBlockReason(eligibility: DonorEligibilitySummary) {
  if (eligibility?.screening_result === "FAIL") {
    return "This donor failed screening. Update the screening result before proceeding.";
  }

  if (eligibility?.screening_result !== "PASS") {
    return "Screening must be passed before completing Interview & Consent.";
  }

  return null;
}
