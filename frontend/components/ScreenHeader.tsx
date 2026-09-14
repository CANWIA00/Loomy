import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

function HeaderButton({
  icon,
  onPress,
  color,
}: {
  icon: any;
  onPress: () => void;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-9 h-9 items-center justify-center"
      style={{ backgroundColor: colors.bgCard2, borderRadius: 11, borderWidth: 1, borderColor: colors.border }}
    >
      <Ionicons name={icon} size={18} color={color ?? colors.primary} />
    </TouchableOpacity>
  );
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
          <View
            className="w-9 h-9 items-center justify-center"
            style={{
              backgroundColor: colors.primary + "22",
              borderRadius: 11,
            }}
          >
            <Ionicons name="sparkles" size={17} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text className="text-sm" style={{ color: colors.textMuted }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setLanguage(lang === "tr" ? "en" : "tr")}
            className="w-9 h-9 items-center justify-center"
            style={{ backgroundColor: colors.bgCard2, borderRadius: 11, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              {lang === "tr" ? "EN" : "TR"}
            </Text>
          </TouchableOpacity>
          <HeaderButton
            icon={isDark ? "sunny-outline" : "moon-outline"}
            onPress={toggleTheme}
            color={colors.warning}
          />
          <HeaderButton icon="home-outline" onPress={() => router.push("/(tabs)/dashboard")} />
          <HeaderButton icon="settings-outline" onPress={() => router.push("/(tabs)/settings")} />
        </View>
      </View>
    </View>
  );
}