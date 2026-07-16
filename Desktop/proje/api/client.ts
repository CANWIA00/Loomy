import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { router } from "expo-router";

const BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:8080/api"  // Web'de localhost:8080
    : Platform.OS === "android"
    ? "http://10.0.2.2:8080/api"   // Android emülatör
    : "http://192.168.56.1:8080/api";

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🚀 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || "");
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
