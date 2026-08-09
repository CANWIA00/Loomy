import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SettingsCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push("/settings" as any)}
    >
      <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.danger + '15' }}>
            <Ionicons name="settings" size={20} color={colors.danger} />
          </View>
          <View className="ml-3 flex-1">
            <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.settings")}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              {t("dash.settings.desc")}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/(tabs)/profil" as any)}
            >
              <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.editProfile")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/settings" as any)}
            >
              <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.settingsBtn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
