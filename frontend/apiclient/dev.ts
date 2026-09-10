import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { BASE_URL } from "./client";

export const DEV_TOKEN_KEY = "devToken";
export const DEV_EMAIL_KEY = "devEmail";

export async function getDevToken(): Promise<string | null> {
  return AsyncStorage.getItem(DEV_TOKEN_KEY);
}

export async function setDevSession(token: string, email: string): Promise<void> {
  await AsyncStorage.multiSet([
    [DEV_TOKEN_KEY, token],
    [DEV_EMAIL_KEY, email],
  ]);
}

export async function clearDevSession(): Promise<void> {
  await AsyncStorage.multiRemove([DEV_TOKEN_KEY, DEV_EMAIL_KEY]);
}

const devClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

devClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(DEV_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

devClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearDevSession();
      router.replace("/dev");
    }
    return Promise.reject(error);
  }
);

export interface AdminKey {
  id: string;
  keyValue: string;
  isUsed: boolean;
  isActive: boolean;
  usedByCompanyId: string | null;
  createdAt: string;
  usedAt: string | null;
  company: { id: string; name: string } | null;
}

export interface CompanySummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  invitationCode: string;
  profileCompleted: boolean;
  isFrozen: boolean;
  paidUntil: string | null;
  createdAt: string;
}

export interface CompanyDetail {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  invitationCode: string;
  profileCompleted: boolean;
  isFrozen: boolean;
  paidUntil: string | null;
  createdAt: string;
  users: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
  }[];
  adminKeys: {
    id: string;
    keyValue: string;
    isUsed: boolean;
    isActive: boolean;
    usedAt: string | null;
  }[];
}

export interface DevStats {
  companies: number;
  users: number;
  adminKeys: number;
  usedKeys: number;
  activeKeys: number;
  customers: number;
  services: number;
  teams: number;
  appointments: number;
}

export const devApi = {
  login: (email: string, password: string) =>
    devClient.post<{ token: string; email: string }>("/dev/login", { email, password }),

  stats: () => devClient.get<DevStats>("/dev/stats"),

  adminKeys: () => devClient.get<AdminKey[]>("/dev/admin-keys"),
  createAdminKeys: (count: number) =>
    devClient.post<{ created: { keyValue: string }[] }>("/dev/admin-keys", { count }),
  updateAdminKey: (id: string, data: { isActive?: boolean; isUsed?: boolean }) =>
    devClient.put<AdminKey>(`/dev/admin-keys/${id}`, data),
  deleteAdminKey: (id: string) => devClient.delete(`/dev/admin-keys/${id}`),

  companies: () => devClient.get<CompanySummary[]>("/dev/companies"),
  company: (id: string) => devClient.get<CompanyDetail>(`/dev/companies/${id}`),
  updateCompany: (id: string, data: { isFrozen?: boolean; markPaid?: boolean }) =>
    devClient.put<CompanySummary>(`/dev/companies/${id}`, data),
};
