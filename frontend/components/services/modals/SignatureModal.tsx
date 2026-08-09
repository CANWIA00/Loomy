import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useServices } from "../ServicesContext";
import SignaturePad from "../SignaturePad";

export default function SignatureModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signatureModal, setSignatureModal, handleSignatureSave } = useServices();

  const close = () => setSignatureModal(false);

  return (
    <Modal visible={signatureModal} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.customerSignature")}</Text>
            <TouchableOpacity onPress={close} className="p-1">
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <SignaturePad onSave={handleSignatureSave} />
        </View>
      </View>
    </Modal>
  );
}
