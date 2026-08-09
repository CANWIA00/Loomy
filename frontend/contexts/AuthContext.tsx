import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User, CompanyRequestDto } from "../api/auth";
import { setOnUnauthorized } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => Promise<{ token?: string; role?: string; profileCompleted?: boolean; requiresVerification?: boolean; email?: string; message?: string }>;
  logout: () => Promise<void>;
  completeCompanyProfile: (data: CompanyRequestDto) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // proceed with local logout even if API call fails
    }
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(async () => {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsed: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);

        try {
          const response = await authApi.validateToken();
          setUser(response.data);
          await AsyncStorage.setItem("user", JSON.stringify(response.data));
        } catch {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (email: string, password: string) => {
    const axiosResponse = await authApi.login(email, password);
    const data = axiosResponse.data;

    if (!data.token) {
      throw new Error("Token alinamadi. Lutfen tekrar deneyin.");
    }

    const loggedInUser: User = {
      id: "",
      name: "",
      email: email,
      role: (data.role as "ADMIN" | "USER") || "USER",
      profileCompleted: data.profileCompleted ?? false,
    };

    try {
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(loggedInUser));
    } catch (storageError: any) {
      throw new Error("Oturum bilgileri kaydedilemedi: " + storageError.message);
    }

    const savedToken = await AsyncStorage.getItem("token");
    if (!savedToken) {
      throw new Error("Token kaydedilemedi. Lutfen tekrar deneyin.");
    }

    setToken(savedToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => {
    try {
      const axiosResponse = await authApi.register(data);
      const res = axiosResponse.data;
      return res;
    } catch (error: any) {
      throw error;
    }
  };

  const completeCompanyProfile = async (data: CompanyRequestDto) => {
    const response = await authApi.completeCompanyProfile(data);
    const updatedUser = { ...user!, profileCompleted: true };
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, completeCompanyProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
