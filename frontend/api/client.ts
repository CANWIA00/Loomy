import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { router } from "expo-router";

// 🌍 Environment variable'dan BASE_URL al, yoksa varsayılanı kullan
const getBaseUrl = () => {
  // Web'de Vercel'deki environment variable'ı kullan
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";
  }
  
  // Mobil (Android/iOS)
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8080/api";
  }
  
  // iOS
  return process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api";
};

const BASE_URL = getBaseUrl();

console.log("🌐 [API] Platform:", Platform.OS, "| BaseURL:", BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorized = callback;
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    console.log("🔑 [INTERCEPTOR] AsyncStorage token:", token ? `${token.substring(0, 20)}...` : "NULL");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || "");
    console.log("🔑 [INTERCEPTOR] Authorization header:", config.headers.Authorization ? `${String(config.headers.Authorization).substring(0, 25)}...` : "YOK");
    return config;
  },
  (error) => {
    console.log("🔴 [API REQUEST ERROR]", error.message);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`, response.data);
    return response;
  },
  async (error) => {
    console.log(`🔴 [API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status || "NETWORK"}`, error.response?.data || error.message);

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.replace("/(auth)/login");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
