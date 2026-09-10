import apiClient from "./client";
import type { ServiceTemplateConfig } from "../components/services/types";

export interface ServiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  fields: ServiceTemplateConfig["fields"];
  chipGroups: ServiceTemplateConfig["chipGroups"];
}

export interface ServiceTemplateInput {
  name: string;
  fields: ServiceTemplateConfig["fields"];
  chipGroups: ServiceTemplateConfig["chipGroups"];
  isDefault?: boolean;
}

export const templateApi = {
  getAll: () =>
    apiClient.get<ServiceTemplate[]>("/service-templates"),

  create: (data: ServiceTemplateInput) =>
    apiClient.post<ServiceTemplate>("/service-templates", data),

  update: (id: string, data: Partial<ServiceTemplateInput>) =>
    apiClient.put<ServiceTemplate>(`/service-templates/${id}`, data),

  setDefault: (id: string) =>
    apiClient.post<ServiceTemplate>(`/service-templates/${id}/set-default`),

  delete: (id: string) =>
    apiClient.delete(`/service-templates/${id}`),
};
