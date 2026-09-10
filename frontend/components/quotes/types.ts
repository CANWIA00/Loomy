import type { QuoteLine } from "../../apiclient/quotes";
import type { TryRatesData } from "../../utils/currencyRates";

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "TRY", symbol: "₺", label: "Türk Lirası" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "₺";
}

export interface QuoteFormData {
  title: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  subscriberNo: string;
  documentDate: string;
  validUntil: string;
  notes: string;
  lines: QuoteLine[];
}

export const UNIT_OPTIONS = ["Adet", "cm", "metre", "kg", "gram"] as const;

export type UnitOption = (typeof UNIT_OPTIONS)[number];

export const emptyLine = (): QuoteLine => ({ name: "", details: "", quantity: 1, unitPrice: 0, currency: "TRY", unit: "Adet" });

export const initialQuoteForm: QuoteFormData = {
  title: "",
  customerName: "",
  contactPerson: "",
  email: "",
  phone: "",
  fax: "",
  website: "",
  address: "",
  subscriberNo: "",
  documentDate: "",
  validUntil: "",
  notes: "",
  lines: [emptyLine()],
};

export function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(/\.(?=.*\.)/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatNumericInput(value: number): string {
  return String(value || 0).replace(".", ",");
}

export interface QuotePdfData {
  title: string;
  customerName: string;
  contactPerson: string;
  documentDate: string;
  validUntil: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  subscriberNo: string;
  notes: string;
  lines: QuoteLine[];
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyGsm?: string;
  companyEmail: string;
  companyFax: string;
  companyWebsite: string;
  companyTaxNumber: string;
  companyLogo: string | null;
  companyStamp: string | null;
  tryRates?: TryRatesData | null;
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
