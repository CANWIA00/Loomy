import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { profileApi } from "../../apiclient/profile";

interface DataRightsModalProps {
  visible: boolean;
  onClose: () => void;
}

async function downloadJson(data: any, fileName: string): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true, intermediates: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: fileName });
}

export default function DataRightsModal({ visible, onClose }: DataRightsModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const CONTACT_EMAIL = "lommy.app.info@gmail.com";

  const rights = [
    "kvkk.learn",
    "kvkk.information",
    "kvkk.purpose",
    "kvkk.transfer",
    "kvkk.rectify",
    "kvkk.erase",
    "kvkk.notify",
    "kvkk.object",
    "kvkk.claim",
  ];

  const gdprRights = [
    "kvkk.gdprAccess",
    "kvkk.gdprRectify",
    "kvkk.gdprErase",
    "kvkk.gdprRestrict",
    "kvkk.gdprPortability",
    "kvkk.gdprObject",
    "kvkk.gdprComplaint",
  ];

  const requestSteps = [
    "kvkk.requestStepEmail",
    "kvkk.requestStepInfo",
    "kvkk.requestStepVerify",
  ];

  const handleContact = async () => {
    await Clipboard.setStringAsync(CONTACT_EMAIL);
    Alert.alert(t("common.success"), t("common.emailCopied"));
  };

  const handleExport = async () => {
    setExporting(true);
    setStatus("idle");
    try {
      const res = await profileApi.exportData();
      const fileName = `loomy-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      await downloadJson(res.data, fileName);
      setStatus("ok");
    } catch {
      setStatus("error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ backgroundColor: colors.bg }} className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("kvkk.rightsTitle")}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg as any}>
          <View className="px-4 pt-5 pb-8 w-full max-w-6xl mx-auto">
            <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}>
              <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>{t("kvkk.rightsDesc")}</Text>
            </View>

            {rights.map((key, i) => (
              <View
                key={key}
                className="flex-row items-start gap-3 rounded-2xl p-4 mb-2"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}
              >
                <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
                  <Text className="text-xs font-bold" style={{ color: colors.primary }}>{i + 1}</Text>
                </View>
                <Text className="flex-1 text-sm leading-5" style={{ color: colors.text }}>{t(key)}</Text>
              </View>
            ))}

            <View className="rounded-2xl p-4 mt-4" style={{ backgroundColor: colors.teal + "12", borderColor: colors.teal + "30", borderWidth: 1 }}>
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.teal + "20" }}>
                  <Ionicons name="shield-outline" size={18} color={colors.teal} />
                </View>
                <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>{t("kvkk.gdprTitle")}</Text>
              </View>
              <Text className="text-xs leading-5 mb-3" style={{ color: colors.textSecondary }}>{t("kvkk.gdprDesc")}</Text>
              {gdprRights.map((key) => (
                <View key={key} className="flex-row items-start gap-2 mb-2">
                  <Ionicons name="checkmark-circle" size={16} color={colors.teal} style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-xs leading-5" style={{ color: colors.text }}>{t(key)}</Text>
                </View>
              ))}
            </View>

            <View className="rounded-2xl p-4 mt-4" style={{ backgroundColor: colors.purple + "12", borderColor: colors.purple + "30", borderWidth: 1 }}>
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.purple + "20" }}>
                  <Ionicons name="create-outline" size={18} color={colors.purple} />
                </View>
                <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>{t("kvkk.requestTitle")}</Text>
              </View>
              {requestSteps.map((key, i) => (
                <View key={key} className="flex-row items-start gap-2 mb-2">
                  <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.purple + "20" }}>
                    <Text className="text-[10px] font-bold" style={{ color: colors.purple }}>{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-xs leading-5" style={{ color: colors.textSecondary }}>{t(key)}</Text>
                </View>
              ))}
              <View className="rounded-xl p-3 mt-2 mb-3" style={{ backgroundColor: colors.bgCard, borderColor: colors.purple + "25", borderWidth: 1 }}>
                <Text className="text-xs font-semibold mb-1" style={{ color: colors.text }}>{t("kvkk.identity")}</Text>
                <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>{t("kvkk.identityDesc")}</Text>
              </View>
              <Text className="text-xs leading-5 mb-2" style={{ color: colors.textSecondary }}>{t("kvkk.copyHint")}</Text>
              <TouchableOpacity
                onPress={handleContact}
                className="h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.purple }}
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text className="text-xs font-semibold" style={{ color: "#fff" }}>{CONTACT_EMAIL}</Text>
              </TouchableOpacity>
            </View>

            <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: colors.warning + "12", borderColor: colors.warning + "30", borderWidth: 1 }}>
              <View className="flex-row items-center gap-3 mb-1.5">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.warning + "20" }}>
                  <Ionicons name="time-outline" size={18} color={colors.warning} />
                </View>
                <Text className="text-sm font-bold flex-1" style={{ color: colors.text }}>{t("kvkk.responseTitle")}</Text>
              </View>
              <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>{t("kvkk.responseDesc")}</Text>
            </View>

            <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: colors.teal + "12", borderColor: colors.teal + "30", borderWidth: 1 }}>
              <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{t("kvkk.exportDesc")}</Text>
              <TouchableOpacity
                onPress={handleExport}
                disabled={exporting}
                className="mt-3 h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.primary }}
              >
                {exporting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text className="text-sm font-semibold" style={{ color: "#fff" }}>{t("set.dataExport")}</Text>
                  </>
                )}
              </TouchableOpacity>
              {status === "ok" && (
                <Text className="text-xs mt-2" style={{ color: colors.success }}>{t("kvkk.exported")}</Text>
              )}
              {status === "error" && (
                <Text className="text-xs mt-2" style={{ color: colors.danger }}>{t("kvkk.exportError")}</Text>
              )}
            </View>

            <Text className="text-[11px] leading-4 mt-4 px-1" style={{ color: colors.textMuted }}>
              {t("kvkk.disclaimer")}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}