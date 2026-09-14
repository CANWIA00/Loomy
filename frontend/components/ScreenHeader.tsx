import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.push("/(tabs)/profil")}>
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/settings")}>
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      {subtitle ? (
        <Text className="text-sm" style={{ color: colors.textMuted }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}