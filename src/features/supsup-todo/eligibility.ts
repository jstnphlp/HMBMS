import type { DonorEligibilitySummary } from "./queries";

export function getSupsupTodoStartBlockReason(
  eligibility: DonorEligibilitySummary
) {
  if (eligibility?.screening_result === "FAIL") {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  if (eligibility?.screening_result !== "PASS" && !eligibility?.consent_signed) {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  if (eligibility?.screening_result !== "PASS") {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
  }

  if (!eligibility?.consent_signed) {
    return "Complete Screening and Interview & Consent before starting a donation workflow.";
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
