import apiClient from "./client";

export interface PaymentRecord {
  id: number;
  customer: string;
  customerId?: string;
  tarih: string;
  status: "Ödendi" | "Bekliyor";
  amount: number;
  serviceId?: number;
}

export interface PaymentSummary {
  received: number;
  pending: number;
  total: number;
}

export const paymentApi = {
  getAll: (page: number = 0, size: number = 20) =>
    apiClient.get<{ content: PaymentRecord[]; totalElements: number }>("/payments", { params: { page, size } }),

  search: (query: string, page: number = 0, size: number = 20) =>
    apiClient.get<{ content: PaymentRecord[]; totalElements: number }>("/payments/search", { params: { q: query, page, size } }),

  getByCustomer: (customerId: string) =>
    apiClient.get<PaymentRecord[]>(`/payments/customer/${customerId}`),

  getSummary: () =>
    apiClient.get<PaymentSummary>("/payments/summary"),

  getById: (id: number) =>
    apiClient.get<PaymentRecord>(`/payments/${id}`),

  updateStatus: (id: number, status: "Ödendi" | "Bekliyor") =>
    apiClient.put<PaymentRecord>(`/payments/${id}/status`, { status }),
};
