import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { lang, setLanguage } = useLanguage();

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            {title}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {subtitle ? (
        <Text className="text-sm" style={{ color: colors.textMuted }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
