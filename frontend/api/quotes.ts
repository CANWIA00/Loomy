import apiClient from "./client";
import type { TryRatesData } from "../utils/currencyRates";

export interface QuoteLine {
  name: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface QuoteRecord {
  id: number;
  tarih: string;
  customer: string;
  customerId?: string;
  contactPerson: string;
  email: string;
  telefon: string;
  fax: string;
  website: string;
  adres: string;
  subscriberNo: string;
  notlar: string;
  lines: QuoteLine[];
  validUntil: string;
  tryRates?: TryRatesData | null;
}

interface QuoteRecordBackend {
  id: number;
  documentDate: string;
  customerName: string;
  customerId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  subscriberNo?: string;
  notes?: string;
  lines: string;
  validUntil?: string;
  tryRates?: string;
}

function toFrontend(b: QuoteRecordBackend): QuoteRecord {
  let lines: QuoteLine[] = [];
  try { lines = JSON.parse(b.lines); } catch {}
  let tryRates: TryRatesData | null = null;
  if (b.tryRates) {
    try { tryRates = JSON.parse(b.tryRates); } catch {}
  }
  return {
    id: b.id,
    tarih: b.documentDate,
    customer: b.customerName,
    customerId: b.customerId || undefined,
    contactPerson: b.contactPerson || "",
    email: b.email || "",
    telefon: b.phone || "",
    fax: b.fax || "",
    website: b.website || "",
    adres: b.address || "",
    subscriberNo: b.subscriberNo || "",
    notlar: b.notes || "",
    lines,
    validUntil: b.validUntil || "",
    tryRates,
  };
}

function toBackend(f: Partial<QuoteRecord>): Record<string, any> {
  const data: Record<string, any> = {};
  if (f.tarih !== undefined) data.documentDate = f.tarih;
  if (f.customer !== undefined) data.customerName = f.customer;
  if (f.customerId !== undefined) data.customerId = f.customerId;
  if (f.contactPerson !== undefined) data.contactPerson = f.contactPerson;
  if (f.email !== undefined) data.email = f.email;
  if (f.telefon !== undefined) data.phone = f.telefon;
  if (f.fax !== undefined) data.fax = f.fax;
  if (f.website !== undefined) data.website = f.website;
  if (f.adres !== undefined) data.address = f.adres;
  if (f.subscriberNo !== undefined) data.subscriberNo = f.subscriberNo;
  if (f.notlar !== undefined) data.notes = f.notlar;
  if (f.lines !== undefined) data.lines = f.lines;
  if (f.validUntil !== undefined) data.validUntil = f.validUntil;
  if (f.tryRates !== undefined) data.tryRates = f.tryRates ? JSON.stringify(f.tryRates) : null;
  return data;
}

export const quoteApi = {
  getAll: async (page: number = 0, size: number = 100) => {
    const res = await apiClient.get<{ content: QuoteRecordBackend[]; totalElements: number; totalPages: number; number: number; size: number }>("/quotes", { params: { page, size } });
    return {
      ...res,
      data: {
        ...res.data,
        content: res.data.content.map(toFrontend),
      },
    };
  },

  create: async (data: Omit<QuoteRecord, "id">) => {
    const res = await apiClient.post<QuoteRecordBackend>("/quotes", toBackend(data));
    return { ...res, data: toFrontend(res.data) };
  },

  update: async (id: number, data: Partial<QuoteRecord>) => {
    const res = await apiClient.put<QuoteRecordBackend>(`/quotes/${id}`, toBackend(data));
    return { ...res, data: toFrontend(res.data) };
  },

  delete: (id: number) =>
    apiClient.delete(`/quotes/${id}`),
};
