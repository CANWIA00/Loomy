import apiClient from "./client";
import type { PanelAccessMap } from "./auth";

export type { PanelKey, PanelAccessLevel } from "./auth";

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "USER";
  isActive: boolean;
  panelAccess: PanelAccessMap;
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

  updateUserAccess: (id: string, panelAccess: PanelAccessMap) =>
    apiClient.patch<{ id: string; panelAccess: PanelAccessMap }>(`/company/users/${id}/access`, { panelAccess }),

  applyToAll: (panelAccess: PanelAccessMap) =>
    apiClient.patch<{ updated: number; panelAccess: PanelAccessMap }>("/company/access", { panelAccess }),
};