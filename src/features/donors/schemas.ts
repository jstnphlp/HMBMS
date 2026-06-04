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

export const updateDonorSchema = z.object({
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
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type UpdateDonorInput = z.infer<typeof updateDonorSchema>;

export const logDropoffSchema = z
  .object({
    collection_date: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        return val;
      },
      z.coerce.date({ error: "Collection date is required" })
    ),
    volume: z.coerce
      .number({ error: "Volume is required" })
      .positive("Volume must be a positive number")
      .max(1200, "Volume cannot exceed 1200 mL per collection"),
    program: z.enum(["SUPSUP_TODO", "MILKY_WAY", "MOMS_ACT"], {
      error: "Program is required",
    }),
    remarks: z.string().max(500).optional().or(z.literal("")),
    is_pasteurized: z.preprocess(
      (val) => val === "true" || val === "on" || val === true,
      z.boolean()
    ),

    batch_no: z.string().max(100).optional().or(z.literal("")),
    bottle_no: z.string().max(100).optional().or(z.literal("")),
    expiration_date: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        return val;
      },
      z.coerce.date().optional()
    ),

    dtn: z.string().max(100).optional().or(z.literal("")),
    aob: z.string().max(50).optional().or(z.literal("")),
    collected_by: z.string().max(200).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.is_pasteurized) {
        return !!data.batch_no && data.batch_no.length > 0;
      }
      return true;
    },
    { message: "Batch number is required for pasteurized milk", path: ["batch_no"] }
  )
  .refine(
    (data) => {
      if (data.is_pasteurized) {
        return !!data.expiration_date;
      }
      return true;
    },
    { message: "Expiration date is required for pasteurized milk", path: ["expiration_date"] }
  )
  .refine(
    (data) => {
      if (!data.is_pasteurized) {
        return !!data.dtn && data.dtn.length > 0;
      }
      return true;
    },
    { message: "DTN is required for unpasteurized milk", path: ["dtn"] }
  )
  .refine(
    (data) => {
      if (!data.is_pasteurized) {
        return !!data.collected_by && data.collected_by.length > 0;
      }
      return true;
    },
    { message: "Collected by is required for unpasteurized milk", path: ["collected_by"] }
  );

export type LogDropoffInput = z.infer<typeof logDropoffSchema>;
