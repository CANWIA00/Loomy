import { useEffect, useRef } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { View, ActivityIndicator, Text } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      hasNavigated.current = false;
      router.replace("/(auth)/login");
      return;
    }

    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (user.role === "ADMIN" && user.profileCompleted === false) {
      router.replace("/(auth)/complete-cp-profile");
    } else {
      router.replace("/(tabs)/dashboard");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 text-sm mt-3">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}
