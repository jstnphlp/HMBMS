export type ProgramValue = "SUPSUP_TODO" | "MILKY_WAY" | "MOMS_ACT";

export const PROGRAM_LABELS: Record<ProgramValue, string> = {
  SUPSUP_TODO: "Supsup Todo",
  MILKY_WAY: "Milky Way",
  MOMS_ACT: "Mom's Act",
};

export function formatProgram(program: string | null | undefined) {
  if (!program) return "--";
  return PROGRAM_LABELS[program as ProgramValue] ?? program;
}
