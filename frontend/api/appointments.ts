import apiClient from "./client";

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
}

export const appointmentApi = {
  getAll: () =>
    apiClient.get<Appointment[]>("/appointments"),

  getByDate: (date: string) =>
    apiClient.get<Appointment[]>("/appointments", { params: { date } }),

  getByTeam: (teamId: number) =>
    apiClient.get<Appointment[]>("/appointments", { params: { teamId } }),

  getById: (id: number) =>
    apiClient.get<Appointment>(`/appointments/${id}`),

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
};
