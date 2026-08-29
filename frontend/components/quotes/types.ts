import type { QuoteLine } from "../../api/quotes";

export interface QuoteFormData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  documentDate: string;
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
}

export const emptyLine = (): QuoteLine => ({ name: "", details: "", quantity: 1, unitPrice: 0 });

export const initialQuoteForm: QuoteFormData = {
  customerName: "",
  email: "",
  phone: "",
  address: "",
  documentDate: "",
  validUntil: "",
  notes: "",
  lines: [emptyLine()],
};

export interface QuotePdfData {
  customerName: string;
  documentDate: string;
  validUntil: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  lines: QuoteLine[];
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxNumber: string;
  companyLogo: string | null;
  companyStamp: string | null;
}

export type QuoteFilter = "all" | "gun" | "ay" | "yil";

export function formatMoney(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) || 0 : value || 0;
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const KDV_RATE = 0.20;
