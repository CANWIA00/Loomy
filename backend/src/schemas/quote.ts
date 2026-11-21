import { z } from "zod";

export const QUOTE_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const quoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES, { errorMap: () => ({ message: "Geçersiz teklif durumu." }) }),
});

// ---------------------------------------------------------------------------
// Teklif zorunlu alanlari (frontend/components/quotes/types.ts validateQuoteForm ile ayni)
// ---------------------------------------------------------------------------

/** "GG/AA/YYYY" (eski kayitlarda "GG.AA.YYYY") -> Date; gecersizse null. */
export function parseQuoteDate(value: string): Date | null {
  const m = (value || "").trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

const quoteDate = (label: string) =>
  z
    .string({ required_error: `${label} zorunludur.`, invalid_type_error: `${label} zorunludur.` })
    .trim()
    .min(1, `${label} zorunludur.`)
    .refine((v) => parseQuoteDate(v) !== null, `${label} geçerli bir tarih olmalıdır (GG/AA/YYYY).`);

const positiveNumber = (message: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v),
    z.number({ invalid_type_error: message, required_error: message }).finite(message).gt(0, message)
  );

const quoteLineSchema = z
  .object({
    name: z.string({ invalid_type_error: "Ürün adı zorunludur." }).trim().min(1, "Her satırda ürün adı zorunludur."),
    quantity: positiveNumber("Her satırda miktar 0'dan büyük olmalıdır."),
    unitPrice: positiveNumber("Her satırda birim fiyat 0'dan büyük olmalıdır."),
  })
  .passthrough();

/** Teklif olusturma/guncelleme govdesi: zorunlu alanlar kontrol edilir, digerleri aynen gecer. */
export const quoteBodySchema = z
  .object({
    customerName: z.string({ invalid_type_error: "Müşteri adı zorunludur." }).trim().min(1, "Müşteri adı zorunludur."),
    documentDate: quoteDate("Belge tarihi"),
    validUntil: quoteDate("Geçerlilik tarihi"),
    lines: z
      .array(quoteLineSchema, { invalid_type_error: "En az bir ürün satırı zorunludur." })
      .min(1, "En az bir ürün satırı zorunludur."),
  })
  .passthrough()
  .superRefine((body, ctx) => {
    const doc = parseQuoteDate(body.documentDate);
    const until = parseQuoteDate(body.validUntil);
    if (doc && until && until < doc) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "Geçerlilik tarihi belge tarihinden önce olamaz." });
    }
  });
