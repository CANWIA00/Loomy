import type { QuoteLine } from "../../api/quotes";
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

export const emptyLine = (): QuoteLine => ({ name: "", details: "", quantity: 1, unitPrice: 0, currency: "TRY" });

export const initialQuoteForm: QuoteFormData = {
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

export interface QuotePdfData {
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
