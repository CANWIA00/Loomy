import { useEffect, useRef } from "react";
import { Redirect, useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { View, ActivityIndicator, Text } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
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
      <View className="flex-1 bg-[#181828] items-center justify-center">
        <ActivityIndicator size="large" color="#6080FF" />
        <Text className="text-gray-500 text-sm mt-3">{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#181828] items-center justify-center">
      <ActivityIndicator size="large" color="#6080FF" />
    </View>
  );
}
