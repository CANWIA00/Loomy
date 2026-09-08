import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { profileApi } from "../../api/profile";
import { Platform } from "react-native";

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
          <View className="px-4 pt-5 pb-8">
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

            <View className="rounded-2xl p-4 mt-3" style={{ backgroundColor: colors.purple + "12", borderColor: colors.purple + "30", borderWidth: 1 }}>
              <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{t("kvkk.contactTitle")}</Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>{t("kvkk.verifiedDesc")}</Text>
              <TouchableOpacity
                className="mt-3 h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.purple }}
              >
                <Ionicons name="mail-outline" size={18} color="#fff" />
                <Text className="text-sm font-semibold" style={{ color: "#fff" }}>{t("privacy.email")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}