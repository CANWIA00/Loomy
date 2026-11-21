import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Oturum token'lari icin depolama. Mobilde iOS Keychain / Android Keystore
 * (expo-secure-store) kullanilir; web'de bunun karsiligi olmadigi icin
 * AsyncStorage (localStorage) kullanilmaya devam eder.
 *
 * Eski surumler token'i AsyncStorage'a yaziyordu. Ilk okumada orada bulunan
 * deger guvenli depoya tasinir; kullanicinin oturumu kapanmaz.
 */
const useSecureStore = Platform.OS === "ios" || Platform.OS === "android";

async function getItem(key: string): Promise<string | null> {
  if (!useSecureStore) return AsyncStorage.getItem(key);

  const value = await SecureStore.getItemAsync(key);
  if (value !== null) return value;

  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
  }
  return legacy;
}

async function setItem(key: string, value: string): Promise<void> {
  if (!useSecureStore) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  }
  // Eski surumden kalan kopya varsa onu da temizle.
  await AsyncStorage.removeItem(key);
}

export const secureStorage = { getItem, setItem, removeItem };
