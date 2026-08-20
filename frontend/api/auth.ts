import apiClient from "./client";

export interface LoginResponse {
  token: string;
  role: string;
  profileCompleted: boolean;
}

export interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  message: string;
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
    apiClient.post<RegisterResponse>("/auth/register", data),

  verifyEmail: (email: string, code: string) =>
    apiClient.post<LoginResponse>("/auth/verify-email", { email, code }),

  resendVerification: (email: string) =>
    apiClient.post("/auth/resend-verification", { email }),

  logout: () =>
    apiClient.post("/auth/logout"),

  validateToken: () =>
    apiClient.get<User>("/auth/validate"),

  deleteAccount: () =>
    apiClient.delete("/auth/account"),

  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiClient.post("/auth/reset-password", { email, code, newPassword }),

  completeCompanyProfile: (data: CompanyRequestDto) =>
    apiClient.put("/profile/my-company", data),
};
