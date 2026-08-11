import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useServices } from "../ServicesContext";

export default function ShareModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    shareModalVisible,
    setShareModalVisible,
    shareRecord,
    openPhonePicker,
    shareViaEmail,
    shareViaSystem,
    phonePickerVisible,
    setPhonePickerVisible,
    phoneOptions,
    confirmShareWithPhone,
  } = useServices();

  const close = () => setShareModalVisible(false);

  return (
    <Modal visible={shareModalVisible} transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ color: colors.text }} className="text-lg font-bold">{t("svc.share")}</Text>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {shareRecord && (
            <View className="mb-5 p-3 rounded-xl" style={{ backgroundColor: colors.bgInput }}>
              <Text style={{ color: colors.text }} className="text-sm font-medium">{shareRecord.customer}</Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-1">{shareRecord.service} · {shareRecord.tarih}</Text>
            </View>
          )}
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: "#25D36615", borderColor: "#25D36640", borderWidth: 1 }}
              onPress={() => shareRecord && openPhonePicker(shareRecord, "whatsapp")}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={{ color: colors.text }} className="text-sm font-medium">WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.primary + "15", borderColor: colors.primary + "40", borderWidth: 1 }}
              onPress={() => shareRecord && shareViaEmail(shareRecord)}
            >
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">E-posta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.success + "15", borderColor: colors.success + "40", borderWidth: 1 }}
              onPress={() => shareRecord && openPhonePicker(shareRecord, "sms")}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.success} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => shareRecord && shareViaSystem(shareRecord)}
            >
              <Ionicons name="ellipsis-horizontal-outline" size={22} color={colors.textSecondary} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">{t("svc.shareOther")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={phonePickerVisible} transparent animationType="fade" onRequestClose={() => setPhonePickerVisible(false)}>
        <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
            <View className="flex-row justify-between items-center mb-5">
              <Text style={{ color: colors.text }} className="text-lg font-bold">{t("svc.sharePhoneTitle")}</Text>
              <TouchableOpacity onPress={() => setPhonePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View className="gap-3">
              {phoneOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  className="flex-row items-center gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => confirmShareWithPhone(opt.phone)}
                >
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-sm font-medium">{opt.phone}</Text>
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">{opt.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
