import { z } from "zod";

export const createStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateStaffSchema = z.object({
  user_id: z.number().int().positive(),
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(1, "Full name is required").max(100),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional()
    .or(z.literal("")),
});
