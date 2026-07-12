import apiClient from "./client";

export interface LoginResponse {
  token: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  phone?: string;
  profileCompleted?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
}

export interface CompleteProfileData {
  companyName: string;
  address: string;
  phone1: string;
  phone2?: string;
  email: string;
  logo?: string;
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

  completeProfile: (data: CompleteProfileData) =>
    apiClient.post("/companies/complete-profile", data),
};
