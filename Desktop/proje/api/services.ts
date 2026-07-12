import apiClient from "./client";

export interface ServiceRecord {
  id: number;
  tarih: string;
  customer: string;
  customerId?: string;
  service: string;
  adres: string;
  baslangic: string;
  bitis: string;
  telefon: string;
  dahiliIp: string;
  hariciIp: string;
  detaylar: string;
  ucret: string;
  teknisyen: string;
  hizmetler: string[];
  teknik: string[];
  imzali?: boolean;
  signature?: string[];
}

export interface ServicePageResponse {
  content: ServiceRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const serviceApi = {
  getAll: (page: number = 0, size: number = 20) =>
    apiClient.get<ServicePageResponse>("/services", { params: { page, size } }),

  search: (query: string, page: number = 0, size: number = 20) =>
    apiClient.get<ServicePageResponse>("/services/search", { params: { q: query, page, size } }),

  getById: (id: number) =>
    apiClient.get<ServiceRecord>(`/services/${id}`),

  create: (data: Omit<ServiceRecord, "id">) =>
    apiClient.post<ServiceRecord>("/services", data),

  update: (id: number, data: Partial<ServiceRecord>) =>
    apiClient.put<ServiceRecord>(`/services/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/services/${id}`),
};
