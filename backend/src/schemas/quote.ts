import { z } from "zod";

export const QUOTE_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const quoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES, { errorMap: () => ({ message: "Geçersiz teklif durumu." }) }),
});
