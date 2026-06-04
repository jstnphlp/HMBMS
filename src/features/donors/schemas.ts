import { z } from "zod";

const optionalDate = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  },
  z.coerce.date().optional()
);

export const registerDonorSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  middle_name: z.string().max(100).optional().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").max(100),
  birthdate: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      return val;
    },
    z.coerce.date({ error: "Date of birth is required" })
  ),
  address: z.string().min(1, "Address is required").max(500),
  contact_no: z
    .string()
    .min(1, "Contact number is required")
    .regex(/^(\+63|0)[0-9]{10}$/, "Invalid Philippine phone number"),
  civil_status: z.string().min(1, "Civil status is required"),
  religion: z.string().max(100).optional().or(z.literal("")),
  occupation: z.string().max(100).optional().or(z.literal("")),

  spouse_name: z.string().max(200).optional().or(z.literal("")),
  spouse_occupation: z.string().max(100).optional().or(z.literal("")),
  spouse_contact_no: z
    .string()
    .regex(/^(\+63|0)[0-9]{10}$/, "Invalid Philippine phone number")
    .optional()
    .or(z.literal("")),

  delivery_date: optionalDate,
  delivery_place: z.string().max(300).optional().or(z.literal("")),
  delivery_type: z.string().max(100).optional().or(z.literal("")),
  aog: z.string().max(50).optional().or(z.literal("")),

  infant_name: z.string().max(200).optional().or(z.literal("")),
  infant_birthdate: optionalDate,
  infant_sex: z.string().max(20).optional().or(z.literal("")),
  infant_birth_weight: z.string().max(50).optional().or(z.literal("")),
});

export type RegisterDonorInput = z.infer<typeof registerDonorSchema>;
