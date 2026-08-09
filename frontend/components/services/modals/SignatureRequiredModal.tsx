import { View, Text, TouchableOpacity, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useServices } from "../ServicesContext";

export default function SignatureRequiredModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signatureAlertVisible, setSignatureAlertVisible } = useServices();

  const close = () => setSignatureAlertVisible(false);

  return (
    <Modal visible={signatureAlertVisible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
              <Ionicons name="warning-outline" size={28} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>{t("svc.signatureRequired")}</Text>
          <Text className="text-sm mb-6 leading-5" style={{ color: colors.textSecondary }}>
            {t("svc.noSignature")}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
              onPress={close}
            >
              <Text style={{ color: colors.textSecondary }} className="font-semibold text-base">{t("svc.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => {
                close();
                router.push("/(tabs)/profil");
              }}
            >
              <Text style={{ color: "white" }} className="font-semibold text-base">{t("svc.goToProfile")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
