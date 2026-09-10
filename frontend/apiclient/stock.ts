import apiClient from "./client";

export interface StockItem {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number | null;
  currency: string;
  vatRate: number;
  supplierName: string | null;
  supplierTaxNumber: string | null;
  lastInvoiceNo: string | null;
  lastInvoiceDate: string | null;
  notes: string | null;
  lowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: number;
  change: number;
  reason: string;
  unitPrice: number | null;
  currency: string;
  vatRate: number | null;
  vatAmount: number | null;
  note: string | null;
  createdAt: string;
  invoice?: { id: number; invoiceNo: string; date: string | null };
}

export interface StockItemDetail extends StockItem {
  transactions: StockTransaction[];
}

export interface StockItemInput {
  name: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number | null;
  currency?: string;
  vatRate?: number;
  supplierName?: string;
  supplierTaxNumber?: string;
  notes?: string;
}

export interface InvoiceLine {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  lineAmount: number | null;
  vatRate: number | null;
  stockItem: { id: number; name: string; quantity: number; unit: string } | null;
}

export interface InvoiceRecord {
  id: number;
  invoiceNo: string;
  invoiceType: string | null;
  date: string | null;
  supplierName: string | null;
  supplierTaxNumber: string | null;
  supplierAddress: string | null;
  totalAmount: number | null;
  currency: string;
  vatAmount: number | null;
  rawName: string | null;
  createdAt: string;
  lines: InvoiceLine[];
}

export interface ParsedInvoiceLine {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineAmount: number;
  vatRate: number;
}

export interface ParsedEInvoice {
  invoiceNo: string;
  invoiceType: string | null;
  date: string | null;
  supplierName: string | null;
  supplierTaxNumber: string | null;
  supplierAddress: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  currency: string;
  lines: ParsedInvoiceLine[];
}

export interface ImportResult {
  message: string;
  invoice: {
    id: number;
    invoiceNo: string;
    date: string | null;
    supplierName: string | null;
    totalAmount: number | null;
    currency: string;
  };
  created: number;
  updated: number;
  totalLines: number;
}

export const stockApi = {
  list: (q?: string) =>
    apiClient.get<{ content: StockItem[]; totalElements: number }>("/stock", {
      params: q ? { q } : undefined,
    }),

  get: (id: number) =>
    apiClient.get<StockItemDetail>(`/stock/${id}`),

  create: (data: StockItemInput) =>
    apiClient.post<StockItem>("/stock", data),

  update: (id: number, data: Partial<StockItemInput>) =>
    apiClient.put<StockItem>(`/stock/${id}`, data),

  remove: (id: number) =>
    apiClient.delete(`/stock/${id}`),

  addTransaction: (id: number, data: { change: number; note?: string; unitPrice?: number; currency?: string }) =>
    apiClient.post<StockItem>(`/stock/${id}/transactions`, data),

  listInvoices: (page = 0, size = 20) =>
    apiClient.get<{ content: InvoiceRecord[]; totalElements: number }>("/stock/invoices", {
      params: { page, size },
    }),

  previewXml: (xml: string, fileName?: string) =>
    apiClient.post<{ invoice: ParsedEInvoice }>("/stock/import-xml", {
      xml,
      fileName,
      dryRun: true,
    }),

  importXml: (xml: string, fileName?: string) =>
    apiClient.post<ImportResult>("/stock/import-xml", { xml, fileName, dryRun: false }),

  deleteInvoice: (id: number, revertStock = true) =>
    apiClient.delete(`/stock/invoices/${id}`, {
      params: { revertStock },
    }),
};