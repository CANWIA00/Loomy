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

export interface QuoteFormLine {
  name: string;
  details?: string;
  quantity: string;
  unitPrice: string;
  currency: string;
  unit: string;
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
  lines: QuoteFormLine[];
}

export const emptyLine = (): QuoteFormLine => ({ name: "", details: "", quantity: "1", unitPrice: "", currency: "TRY", unit: "Adet" });

export interface NewCustomerFormData {
  companyName: string;
  subscriberNo: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
}

export const initialNewCustomerForm: NewCustomerFormData = {
  companyName: "",
  subscriberNo: "",
  address: "",
  email: "",
  phone: "",
  contactPerson: "",
  contactPhone: "",
};

/** Bugunun tarihi, formun kullandigi GG/AA/YYYY biciminde. */
export function todayDateInput(now: Date = new Date()): string {
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

/** Yeni teklif formu: belge tarihi ve gecerlilik bugunle dolu gelir. */
export const freshQuoteForm = (): QuoteFormData => ({ ...initialQuoteForm, documentDate: todayDateInput(), validUntil: todayDateInput() });

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

export function formatNumericInput(value: number | string): string {
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

export interface QuoteCurrencyTotals {
  subTotal: number;
  kdv: number;
  grandTotal: number;
}

/** Para birimine gore ara toplam, KDV ve genel toplam (formdaki ozet ve alt cubuk ayni hesabi kullanir). */
export function computeQuoteTotals(lines: QuoteFormLine[]): Record<string, QuoteCurrencyTotals> {
  const groups: Record<string, QuoteCurrencyTotals> = {};
  lines
    .filter((l) => l.name || l.details)
    .forEach((l) => {
      const cur = l.currency || "TRY";
      const lineTotal = parseNumericInput(l.quantity) * parseNumericInput(l.unitPrice);
      if (!groups[cur]) groups[cur] = { subTotal: 0, kdv: 0, grandTotal: 0 };
      groups[cur].subTotal += lineTotal;
    });
  Object.keys(groups).forEach((cur) => {
    groups[cur].subTotal = round2(groups[cur].subTotal);
    groups[cur].kdv = round2(groups[cur].subTotal * KDV_RATE);
    groups[cur].grandTotal = round2(groups[cur].subTotal + groups[cur].kdv);
  });
  return groups;
}
