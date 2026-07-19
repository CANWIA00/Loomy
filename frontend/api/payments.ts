import apiClient from "./client";

export interface PaymentRecord {
  id: number;
  customer: string;
  customerId?: string;
  tarih: string;
  serviceType: string;
  amount: number;
  paid: boolean;
}

export interface PaymentSummary {
  paidTotal: number;
  pendingTotal: number;
  total: number;
  paidCount: number;
  pendingCount: number;
  totalCount: number;
}

export interface PaymentPageResponse {
  content: PaymentRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const paymentApi = {
  getAll: (page: number = 0, size: number = 50) =>
    apiClient.get<PaymentPageResponse>("/payments", { params: { page, size } }),

  search: (query: string, page: number = 0, size: number = 50) =>
    apiClient.get<PaymentPageResponse>("/payments/search", { params: { q: query, page, size } }),

  getSummary: () =>
    apiClient.get<PaymentSummary>("/payments/summary"),

  updateStatus: (id: number, paid: boolean) =>
    apiClient.put<PaymentRecord>(`/payments/${id}/status`, { paid }),
};
