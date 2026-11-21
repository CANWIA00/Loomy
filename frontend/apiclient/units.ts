import apiClient from "./client";

export interface CustomUnit {
  id: number;
  name: string;
}

/** Sirketin ekledigi olcu birimleri. */
export const unitApi = {
  list: () => apiClient.get<CustomUnit[]>("/units"),
  create: (name: string) => apiClient.post<CustomUnit>("/units", { name }),
  remove: (id: number) => apiClient.delete(`/units/${id}`),
};
