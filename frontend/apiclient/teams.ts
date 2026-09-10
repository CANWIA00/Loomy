import apiClient from "./client";

export interface Team {
  id: number;
  name: string;
  leader: string;
  color: string;
  members: string[];
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const teamApi = {
  getAll: () =>
    apiClient.get<Team[]>("/teams"),

  getCompanyUsers: () =>
    apiClient.get<CompanyUser[]>("/teams/company-users"),

  create: (data: Omit<Team, "id">) =>
    apiClient.post<Team>("/teams", data),

  delete: (id: number) =>
    apiClient.delete(`/teams/${id}`),

  addMember: (id: number, memberName: string) =>
    apiClient.post<Team>(`/teams/${id}/members`, { name: memberName }),

  removeMembers: (id: number, memberNames: string[]) =>
    apiClient.request<Team>({
      method: "DELETE",
      url: `/teams/${id}/members`,
      data: { members: memberNames },
    }),
};
