import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import SettingsMenu from "../../components/settings/SettingsMenu";
import PrivacyModal from "../../components/settings/PrivacyModal";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { lang, t, setLanguage } = useLanguage();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} className="flex-1" indicatorStyle={colors.indicatorBg as any}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
              {t("set.title")}
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
        <Text style={{ color: colors.textMuted }} className="text-sm mt-1 mb-4">
          {t("set.subtitle")}
        </Text>
        <View className="items-center py-8">
          <Image
            source={isDark ? require("../../assets/loomy-dark.png") : require("../../assets/loomy-light.png")}
            style={{ width: 72, height: 72 }}
            className="rounded-full mb-4"
            resizeMode="contain"
          />
          <Text style={{ color: colors.text }} className="text-lg font-semibold">Loomy</Text>
          <Text style={{ color: colors.textMuted }} className="text-sm mt-1">
            {t("set.platform")}
          </Text>
        </View>

        <SettingsMenu onPrivacyPress={() => setPrivacyVisible(true)} />

        <TouchableOpacity className="items-center py-4" onPress={handleLogout}>
          <View style={{ backgroundColor: colors.danger + "15" }} className="rounded-xl px-8 py-3.5">
            <Text style={{ color: colors.danger }} className="font-semibold">{t("set.logout")}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <PrivacyModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
    </ScrollView>
  );
}
