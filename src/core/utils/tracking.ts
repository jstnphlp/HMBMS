export function formatDonorTrackingNo(donorId: number | string) {
  return `DTN-${String(donorId).padStart(4, "0")}`;
}

export function formatCollectionTrackingNo(
  donorId: number | string,
  sampleSequence: number | string
) {
  return `CTN-${String(donorId).padStart(4, "0")}-${String(sampleSequence).padStart(3, "0")}`;
}

export function normalizeTrackingSearch(value: string) {
  return value.trim().toUpperCase();
}

export function donorIdFromTrackingSearch(value: string) {
  const normalized = normalizeTrackingSearch(value);
  const dtnMatch = normalized.match(/^DTN-?0*(\d+)$/);
  if (dtnMatch) return Number(dtnMatch[1]);

  const numericMatch = normalized.match(/^0*(\d+)$/);
  if (numericMatch) return Number(numericMatch[1]);

  return null;
}
