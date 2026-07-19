import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User, CompanyRequestDto } from "../api/auth";
import { setOnUnauthorized } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => Promise<{ token: string; role: string; profileCompleted: boolean }>;
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
      console.log("🔵 [AUTH] loadStoredAuth() çağrıldı");
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      console.log("🔍 [AUTH] Stored token:", storedToken ? `${storedToken.substring(0, 30)}...` : "NULL");
      console.log("🔍 [AUTH] Stored user:", storedUser ? "VAR" : "NULL");

      if (storedToken && storedUser) {
        const parsed: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
        console.log("✅ [AUTH] Token ve user state'e yüklendi");

        try {
          const response = await authApi.validateToken();
          console.log("✅ [AUTH] Token geçerli, user güncellendi");
          setUser(response.data);
          await AsyncStorage.setItem("user", JSON.stringify(response.data));
        } catch {
          console.log("🔴 [AUTH] Token geçersiz, temizleniyor");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } else {
        console.log("ℹ️ [AUTH] Kayıtlı token/user bulunamadı");
      }
    } catch (e: any) {
      console.log("🔴 [AUTH] loadStoredAuth hatası:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (email: string, password: string) => {
    console.log("🔵 [AUTH] login() çağrıldı:", email);

    const axiosResponse = await authApi.login(email, password);
    const data = axiosResponse.data;

    console.log("🔵 [AUTH] Login response:", JSON.stringify(data));

    if (!data.token) {
      console.log("🔴 [AUTH] Login response'da token YOK!");
      throw new Error("Token alınamadı. Lütfen tekrar deneyin.");
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
      console.log("✅ [AUTH] Token AsyncStorage'a yazıldı");

      await AsyncStorage.setItem("user", JSON.stringify(loggedInUser));
      console.log("✅ [AUTH] User AsyncStorage'a yazıldı");
    } catch (storageError: any) {
      console.log("🔴 [AUTH] AsyncStorage yazma hatası:", storageError.message);
      throw new Error("Oturum bilgileri kaydedilemedi: " + storageError.message);
    }

    const savedToken = await AsyncStorage.getItem("token");
    console.log("🔍 [AUTH] AsyncStorage'dan okunan token:", savedToken ? `${savedToken.substring(0, 30)}...` : "NULL");

    if (!savedToken) {
      console.log("🔴 [AUTH] Token AsyncStorage'a yazılmamış!");
      throw new Error("Token kaydedilemedi. Lütfen tekrar deneyin.");
    }

    setToken(savedToken);
    setUser(loggedInUser);

    console.log("✅ [AUTH] login() tamamlandı, token state güncellendi");
    return loggedInUser;
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; inviteCode: string }) => {
    console.log("🔵 [AUTH] register() çağrıldı:", { email: data.email, name: data.name });
    try {
      console.log("🚀 [AUTH] API'ye istek gönderiliyor...");
      const axiosResponse = await authApi.register(data);
      const res = axiosResponse.data;
      console.log("✅ [AUTH] Register response:", JSON.stringify(res));

      if (!res.token) {
        console.log("🔴 [AUTH] Register response'da token YOK!");
        throw new Error("Kayıt sonrası token alınamadı.");
      }

      const newUser: User = {
        id: "",
        name: data.name,
        email: data.email,
        role: (res.role as "ADMIN" | "USER") || "USER",
        profileCompleted: res.profileCompleted ?? false,
      };

      try {
        await AsyncStorage.setItem("token", res.token);
        console.log("✅ [AUTH] Register - Token AsyncStorage'a yazıldı");

        await AsyncStorage.setItem("user", JSON.stringify(newUser));
        console.log("✅ [AUTH] Register - User AsyncStorage'a yazıldı");
      } catch (storageError: any) {
        console.log("🔴 [AUTH] Register - AsyncStorage yazma hatası:", storageError.message);
        throw new Error("Oturum bilgileri kaydedilemedi: " + storageError.message);
      }

      const savedToken = await AsyncStorage.getItem("token");
      console.log("🔍 [AUTH] Register - AsyncStorage'dan okunan token:", savedToken ? `${savedToken.substring(0, 30)}...` : "NULL");

      if (!savedToken) {
        console.log("🔴 [AUTH] Register - Token AsyncStorage'a yazılmamış!");
        throw new Error("Token kaydedilemedi. Lütfen tekrar deneyin.");
      }

      setToken(savedToken);
      setUser(newUser);

      console.log("✅ [AUTH] register() tamamlandı");
      return res;
    } catch (error: any) {
      console.log("🔴 [AUTH] register() hatası:", error?.message);
      console.log("🔴 [AUTH] Hata detayı:", error?.response?.data);
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
