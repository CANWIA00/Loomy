import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { router } from "expo-router";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "web"
    ? "http://localhost:8080/api"
    : Platform.OS === "android"
    ? "http://10.0.2.2:8080/api"
    : "http://192.168.56.1:8080/api");

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("[api] BASE_URL:", BASE_URL);

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
    console.log(`[api] REQUEST ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[api] RESPONSE ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`, response.data);
    return response;
  },
  async (error) => {
    console.error(
      `[api] ERROR ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.response ? `status=${error.response.status} data=${JSON.stringify(error.response.data)}` : error.message,
      "| isNetworkError:", !error.response
    );
    if (error.response?.status === 403 && error.response?.data?.frozen) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.setItem("frozenNotice", "1");
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.replace("/(auth)/login");
      }
    } else if (error.response?.status === 401) {
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
