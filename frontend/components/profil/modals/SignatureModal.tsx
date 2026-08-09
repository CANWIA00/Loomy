import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useProfil } from "../ProfilContext";
import SignaturePad from "../SignaturePad";

export default function SignatureModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { signatureModalVisible, setSignatureModalVisible, handleSaveSignature, user } = useProfil();

  const close = () => setSignatureModalVisible(false);

  return (
    <Modal visible={signatureModalVisible} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, width: "91.666%", maxWidth: 448, padding: 16 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{t("prf.mySignature")}</Text>
            <TouchableOpacity onPress={close} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <SignaturePad
            onSave={handleSaveSignature}
            onClose={close}
            initialSignature={user?.signature}
          />
        </View>
      </View>
    </Modal>
  );
}
