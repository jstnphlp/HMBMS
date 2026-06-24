import { z } from "zod";

export const generateReportSchema = z.object({
  category: z.enum([
    "ALL",
    "COLLECTION",
    "PROCESSING",
    "INVENTORY",
    "DISPENSING",
    "DISPOSAL",
    "DONOR",
    "RECIPIENT",
  ]),
  program: z
    .enum(["ALL", "SUPSUP_TODO", "MILKY_WAY", "MOMS_ACT"])
    .default("ALL"),
  date_from: z.coerce.date(),
  date_to: z.coerce.date(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export const generatedReportSchema = z
  .object({
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
    category: z.enum([
      "ALL",
      "COLLECTION",
      "PROCESSING",
      "INVENTORY",
      "DISPENSING",
      "DISPOSAL",
      "DONOR",
      "RECIPIENT",
    ]),
    program: z
      .enum(["ALL", "SUPSUP_TODO", "MILKY_WAY", "MOMS_ACT"])
      .default("ALL"),
    date_from: z.coerce.date(),
    date_to: z.coerce.date(),
  })
  .refine((input) => input.date_from <= input.date_to, {
    message: "Start date must be before or equal to end date.",
    path: ["date_to"],
  });

export type GeneratedReportInput = z.infer<typeof generatedReportSchema>;
