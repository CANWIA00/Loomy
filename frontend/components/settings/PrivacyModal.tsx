import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const privacySections = [
    { titleKey: "privacy.dataStorage", descKey: "privacy.dataStorageDesc", icon: "shield-checkmark" as const, color: colors.primary },
    { titleKey: "privacy.personalData", descKey: "privacy.personalDataDesc", icon: "finger-print" as const, color: colors.teal },
    { titleKey: "privacy.dataSharing", descKey: "privacy.dataSharingDesc", icon: "people" as const, color: colors.purple },
    { titleKey: "privacy.retention", descKey: "privacy.retentionDesc", icon: "time" as const, color: colors.warning },
    { titleKey: "privacy.accountDeletion", descKey: "privacy.accountDeletionDesc", icon: "trash" as const, color: colors.danger },
    { titleKey: "privacy.notifications", descKey: "privacy.notificationsDesc", icon: "notifications" as const, color: colors.pink },
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ backgroundColor: colors.bg }} className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("privacy.title")}</Text>
          </View>
        </View>
        <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg as any}>
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

            {privacySections.map((section) => (
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
  );
}
