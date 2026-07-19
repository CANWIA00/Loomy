import apiClient from "./client";

export interface LoginResponse {
  token: string;
  role: string;
  profileCompleted: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  phone?: string;
  profileCompleted?: boolean;
  signature?: string | null;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
}

export interface CompanyRequestDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  logoUrl?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/auth/login", { email, password }),

  register: (data: RegisterData) =>
    apiClient.post<LoginResponse>("/auth/register", data),

  logout: () =>
    apiClient.post("/auth/logout"),

  validateToken: () =>
    apiClient.get<User>("/auth/validate"),

  completeCompanyProfile: (data: CompanyRequestDto) =>
    apiClient.put("/profile/my-company", data),
};
