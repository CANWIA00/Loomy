import apiClient from "./client";

export type PanelKey = "services" | "customers" | "schedule" | "stock" | "quotes" | "finans";

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER";
  isActive: boolean;
  panelAccess: string[];
  createdAt: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  invitationCode: string;
  userCount: number;
}

export interface CompanyManagement {
  company: CompanyInfo;
  users: CompanyMember[];
}

export const companyApi = {
  get: () =>
    apiClient.get<CompanyManagement>("/company/users"),

  updateUserAccess: (id: string, panelAccess: string[]) =>
    apiClient.patch<{ id: string; panelAccess: string[] }>(`/company/users/${id}/access`, { panelAccess }),

  applyToAll: (panelAccess: string[]) =>
    apiClient.patch<{ updated: number; panelAccess: string[] }>("/company/access", { panelAccess }),
};