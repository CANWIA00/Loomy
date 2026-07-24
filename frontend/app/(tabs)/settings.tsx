import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { lang, t, setLanguage } = useLanguage();
  const [privacyVisible, setPrivacyVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const privacySections = [
    { titleKey: "privacy.dataStorage", descKey: "privacy.dataStorageDesc", icon: "shield-checkmark" as const, color: colors.primary },
    { titleKey: "privacy.personalData", descKey: "privacy.personalDataDesc", icon: "finger-print" as const, color: colors.teal },
    { titleKey: "privacy.dataSharing", descKey: "privacy.dataSharingDesc", icon: "people" as const, color: colors.purple },
    { titleKey: "privacy.retention", descKey: "privacy.retentionDesc", icon: "time" as const, color: colors.warning },
    { titleKey: "privacy.accountDeletion", descKey: "privacy.accountDeletionDesc", icon: "trash" as const, color: colors.danger },
    { titleKey: "privacy.notifications", descKey: "privacy.notificationsDesc", icon: "notifications" as const, color: colors.pink },
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} className="flex-1" indicatorStyle={colors.indicatorBg}>
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

        <View style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }} className="rounded-2xl border overflow-hidden mb-6">
          {[
            { icon: "person" as const, label: t("set.profileInfo") },
            { icon: "globe" as const, label: t("set.language"), right: lang === "tr" ? t("set.turkish") : t("set.english") },
            { icon: "shield-checkmark" as const, label: t("set.privacy") },
            { icon: "help-circle" as const, label: t("set.help") },
            {
              icon: "information-circle" as const,
              label: t("set.version"),
              right: "v1.0.0",
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center px-4 py-4"
              style={idx < 4 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
              onPress={() => { 
                if (item.label === t("set.profileInfo")) router.push("/(tabs)/profil"); 
                if (item.label === t("set.language")) setLanguage(lang === "tr" ? "en" : "tr");
                if (item.label === t("set.privacy")) setPrivacyVisible(true);
              }}
            >
              <View style={{ backgroundColor: colors.bgCard }} className="w-9 h-9 rounded-xl items-center justify-center">
                <Ionicons name={item.icon} size={18} color={colors.textMuted} />
              </View>
              <Text style={{ color: colors.text }} className="flex-1 text-base ml-3">
                {item.label}
              </Text>
              {"right" in item && item.right && (
                <View className="flex-row items-center">
                  <Text style={{ color: colors.textMuted }} className="text-sm mr-2">
                    {item.right}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="items-center py-4"
          onPress={handleLogout}
        >
          <View style={{ backgroundColor: colors.danger + "15" }} className="rounded-xl px-8 py-3.5">
            <Text style={{ color: colors.danger }} className="font-semibold">{t("set.logout")}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={privacyVisible} animationType="slide" onRequestClose={() => setPrivacyVisible(false)}>
        <View style={{ backgroundColor: colors.bg }} className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
                <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("privacy.title")}</Text>
            </View>
          </View>
          <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg}>
            <View className="px-4 pt-5 pb-8">
              <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: colors.primary + "10" }}>
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
                    <Ionicons name="shield-checkmark" size={26} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("privacy.title")}</Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>Loomy Platform</Text>
                  </View>
                </View>
              </View>

              {privacySections.map((section, idx) => (
                <View
                  key={section.titleKey}
                  className="rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}
                >
                  <View className="flex-row items-center gap-3 mb-2.5">
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: section.color + "18" }}>
                      <Ionicons name={section.icon} size={18} color={section.color} />
                    </View>
                    <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>
                      {t(section.titleKey)}
                    </Text>
                  </View>
                  <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                    {t(section.descKey)}
                  </Text>
                </View>
              ))}

              <View
                className="rounded-2xl p-4 mt-2"
                style={{ backgroundColor: colors.teal + "12", borderColor: colors.teal + "30", borderWidth: 1 }}
              >
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.teal + "20" }}>
                    <Ionicons name="mail" size={18} color={colors.teal} />
                  </View>
                  <Text className="text-sm font-bold" style={{ color: colors.text }}>
                    {t("privacy.contact")}
                  </Text>
                </View>
                <Text className="text-xs ml-12" style={{ color: colors.teal }}>{t("privacy.email")}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
