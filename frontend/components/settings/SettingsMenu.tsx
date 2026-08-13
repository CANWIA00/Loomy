import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

interface SettingsMenuProps {
  onPrivacyPress: () => void;
}

export default function SettingsMenu({ onPrivacyPress }: SettingsMenuProps) {
  const { colors } = useTheme();
  const { lang, t, setLanguage } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const items: { icon: any; label: string; right?: string }[] = [
    { icon: "person", label: t("set.profileInfo") },
    {
      icon: "globe",
      label: t("set.language"),
      right: lang === "tr" ? t("set.turkish") : t("set.english"),
    },
    ...(isAdmin
      ? [{ icon: "construct" as any, label: t("tpl.menuLabel"), right: t("tpl.menuRight") }]
      : []),
    { icon: "shield-checkmark", label: t("set.privacy") },
    { icon: "help-circle", label: t("set.help") },
    {
      icon: "information-circle",
      label: t("set.version"),
      right: "v1.0.0",
    },
  ];

  const handlePress = (label: string) => {
    if (label === t("set.profileInfo")) router.push("/(tabs)/profil");
    if (label === t("set.language")) setLanguage(lang === "tr" ? "en" : "tr");
    if (label === t("tpl.menuLabel")) router.push("/templates");
    if (label === t("set.privacy")) onPrivacyPress();
  };

  return (
    <View
      style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}
      className="rounded-2xl border overflow-hidden mb-6"
    >
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          className="flex-row items-center px-4 py-4"
          style={idx < 4 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
          onPress={() => handlePress(item.label)}
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
  );
}
