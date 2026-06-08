import { z } from "zod";

export const generateReportSchema = z.object({
  type: z.enum([
    "Inventory Levels",
    "Donor Acquisition",
    "Lab Testing Yields",
    "Dispensation Logs",
  ]),
  program: z
    .enum(["ALL", "SUPSUP_TODO", "MILKY_WAY", "MOMS_ACT"])
    .default("ALL"),
  date_from: z.coerce.date(),
  date_to: z.coerce.date(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
