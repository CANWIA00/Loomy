import apiClient from "./client";
import { User } from "./auth";

export interface CompanyDto {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  logoUrl?: string;
  stampUrl?: string;
  invitationCode?: string;
}

export interface UserProfile {
  user: User;
  company: CompanyDto;
}

export interface UpdateUserRequest {
  name: string;
  phone: string;
  signature?: string | null;
}

export interface UpdateCompanyRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  logoUrl: string;
  stampUrl: string;
}

export const profileApi = {
  getProfile: () =>
    apiClient.get<UserProfile>("/profile/me"),

  updateUser: (data: UpdateUserRequest) =>
    apiClient.put<User>("/profile/me", data),

  updateCompany: (data: UpdateCompanyRequest) =>
    apiClient.put<CompanyDto>("/profile/my-company", data),
};
