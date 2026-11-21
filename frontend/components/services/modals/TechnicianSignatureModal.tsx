import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useServices } from "../ServicesContext";
import SignaturePad from "../SignaturePad";

/**
 * Teknisyenin (giris yapan kullanicinin) imzasi: profile gitmeden burada atilir
 * ve profile kaydedilir. Kaydet sirasinda acildiysa imzadan sonra kayit devam eder.
 */
export default function TechnicianSignatureModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { techSignatureModal, setTechSignatureModal, handleTechnicianSignatureSave } = useServices();
  const close = () => setTechSignatureModal(false);

  return (
    <Modal visible={techSignatureModal} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.technicianSignatureTitle")}</Text>
            <TouchableOpacity onPress={close} className="p-1" accessibilityLabel={t("common.cancel")}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>{t("svc.technicianSignatureHint")}</Text>
          <SignaturePad onSave={handleTechnicianSignatureSave} />
        </View>
      </View>
    </Modal>
  );
}
