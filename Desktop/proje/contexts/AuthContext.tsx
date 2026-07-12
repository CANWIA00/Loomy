import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User } from "../api/auth";
import { setOnUnauthorized } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  completeProfile: (data: { companyName: string; address: string; phone1: string; phone2?: string; email: string; logo?: string }) => Promise<void>;
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
    setOnUnauthorized(() => {
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
      // silent fail
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

    const loggedInUser: User = {
      id: "",
      name: "",
      email: email,
      role: data.role as "ADMIN" | "USER",
      profileCompleted: false,
    };

    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(loggedInUser));
    setToken(data.token);
    setUser(loggedInUser);

    return { user: loggedInUser };
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => {
    const axiosResponse = await authApi.register(data);
    const res = axiosResponse.data;

    const newUser: User = {
      id: "",
      name: data.name,
      email: data.email,
      role: res.role as "ADMIN" | "USER",
      profileCompleted: false,
    };

    await AsyncStorage.setItem("token", res.token);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(res.token);
    setUser(newUser);

    return { user: newUser };
  };

  const completeProfile = async (data: { companyName: string; address: string; phone1: string; phone2?: string; email: string; logo?: string }) => {
    await authApi.completeProfile(data);
    const updatedUser = { ...user!, profileCompleted: true };
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, completeProfile }}>
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
