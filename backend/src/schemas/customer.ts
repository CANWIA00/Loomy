import { z } from "zod";

// Controller opsiyonel alanlarda `?.trim()` kullanir; null/undefined/string disindaki
// degerler orada patlar. Sema yalnizca bu tipleri ve makul uzunluklari kabul eder.
const optionalText = (max: number) =>
  z.string({ invalid_type_error: "Geçersiz alan değeri." }).max(max, "Alan çok uzun.").nullish();

const customerFields = {
  subscriberNo: optionalText(100),
  address: optionalText(1000),
  email: optionalText(254),
  phone: optionalText(50),
  fax: optionalText(50),
  website: optionalText(500),
  contactPerson: optionalText(200),
  contactPhone: optionalText(50),
};

export const createCustomerSchema = z.object({
  companyName: z
    .string({ invalid_type_error: "Şirket adı zorunludur." })
    .max(300, "Şirket adı çok uzun.")
    .refine((v) => v.trim().length > 0, "Şirket adı zorunludur."),
  ...customerFields,
});

export const updateCustomerSchema = z.object({
  companyName: optionalText(300),
  ...customerFields,
});
