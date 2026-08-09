import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { usePayments } from "../PaymentsContext";

export default function StatusDropdownModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    statusDropdownOpen,
    setStatusDropdownOpen,
    statusFilter,
    setStatusFilter,
    statusOptions,
  } = usePayments();

  return (
    <Modal visible={statusDropdownOpen} transparent animationType="fade">
      <TouchableOpacity
        className="flex-1 justify-center items-center bg-black/40"
        activeOpacity={1}
        onPress={() => setStatusDropdownOpen(false)}
      >
        <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-64 p-4">
          <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">{t("pay.selectStatus")}</Text>
          {statusOptions.map((s) => (
            <TouchableOpacity
              key={s.value}
              className="px-3 py-3 border-b"
              style={{ borderColor: colors.border, backgroundColor: statusFilter === s.value ? colors.primary + '15' : 'transparent' }}
              onPress={() => {
                setStatusFilter(s.value as any);
                setStatusDropdownOpen(false);
              }}
            >
              <Text className="text-sm" style={{ color: statusFilter === s.value ? colors.primary : colors.text }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ backgroundColor: colors.bgInput }}
            className="mt-3 h-10 rounded-lg items-center justify-center"
            onPress={() => setStatusDropdownOpen(false)}
          >
            <Text style={{ color: colors.textSecondary }} className="font-medium">{t("pay.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
