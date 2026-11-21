import apiClient from "./client";

/** AWAITING: atama bekliyor · SCHEDULED: takvimde · DONE: servis kaydi olusturuldu · CANCELLED */
export type JobStatus = "AWAITING" | "SCHEDULED" | "DONE" | "CANCELLED";

export interface Appointment {
  id: number;
  customerName: string;
  customerId?: string;
  ekip: string;
  ekipId: number;
  tarih: string;
  startTime: string;
  duration: string;
  tur: string;
  notes: string;
  status?: JobStatus;
  quoteId?: number | null;
  serviceRecordId?: number | null;
  createdAt?: string;
}

/** Is detayi: kabul edilen tekliften geldiyse teklif kalemleriyle */
export interface JobDetail extends Appointment {
  quoteTitle?: string | null;
  quoteLines?: { name: string; details?: string; quantity: number; unitPrice: number; currency: string; unit: string }[];
}

export const appointmentApi = {
  getAll: (opts?: { date?: string; teamId?: number; from?: string; to?: string; page?: number; size?: number }) =>
    apiClient.get<Appointment[]>("/appointments", { params: opts }),

  create: (data: {
    customerName: string;
    customerId?: string;
    ekip: string;
    ekipId: number;
    tarih: string;
    startTime: string;
    duration: string;
    tur: string;
    notes: string;
  }) => apiClient.post<Appointment>("/appointments", data),

  update: (id: number, data: Partial<Appointment>) =>
    apiClient.put<Appointment>(`/appointments/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/appointments/${id}`),

  /** Atama bekleyen isler (takvimde olmayanlar) */
  getAwaiting: () =>
    apiClient.get<Appointment[]>("/appointments", { params: { status: "AWAITING" } }),

  getById: (id: number) =>
    apiClient.get<JobDetail>(`/appointments/${id}`),

  /** Elle atama bekleyen is (ekip/tarih sonra atanir) */
  createAwaiting: (data: { customerName: string; customerId?: string; tur: string; notes: string }) =>
    apiClient.post<Appointment>("/appointments", { ...data, awaiting: true }),

  cancel: (id: number) =>
    apiClient.patch<Appointment>(`/appointments/${id}/cancel`),
};
