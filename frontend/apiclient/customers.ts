import apiClient from "./client";

export interface Customer {
  id: string;
  companyName: string;
  subscriberNo: string;
  address: string;
  email: string;
  phone: string;
  fax?: string;
  website?: string;
  contactPerson: string;
  contactPhone: string;
}

export interface CustomerRelatedCounts {
  services: number;
  quotes: number;
  appointments: number;
}

export type CustomerInput = Omit<Customer, "id">;

export interface CustomerPageResponse {
  content: Customer[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const customerApi = {
  getAll: (page: number = 0, size: number = 20) =>
    apiClient.get<CustomerPageResponse>("/customers", { params: { page, size } }),

  search: (query: string, page: number = 0, size: number = 20) =>
    apiClient.get<CustomerPageResponse>("/customers/search", { params: { q: query, page, size } }),

  getAllSimple: (limit?: number) =>
    apiClient.get<Customer[]>("/customers/all", { params: limit ? { limit } : {} }),

  getById: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`),

  getRelatedCounts: (id: string) =>
    apiClient.get<CustomerRelatedCounts>(`/customers/${id}/related-counts`),

  create: (data: CustomerInput) =>
    apiClient.post<Customer>("/customers", data),

  update: (id: string, data: Partial<Customer>) =>
    apiClient.put<Customer>(`/customers/${id}`, data),

  delete: (id: string, mode?: "keep" | "cascade") =>
    apiClient.delete(`/customers/${id}`, { params: mode ? { mode } : {} }),
};
