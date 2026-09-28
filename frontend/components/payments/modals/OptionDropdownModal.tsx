import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { StatusOption } from "../types";

interface Props {
  visible: boolean;
  title: string;
  options: StatusOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function OptionDropdownModal({ visible, title, options, value, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        className="flex-1 justify-center items-center bg-black/40"
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-64 p-4">
          <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">{title}</Text>
          {options.map((s) => (
            <TouchableOpacity
              key={s.value}
              className="px-3 py-3 border-b"
              style={{ borderColor: colors.border, backgroundColor: value === s.value ? colors.primary + '15' : 'transparent' }}
              onPress={() => {
                onSelect(s.value);
                onClose();
              }}
            >
              <Text className="text-sm" style={{ color: value === s.value ? colors.primary : colors.text }}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={{ backgroundColor: colors.bgInput }}
            className="mt-3 h-10 rounded-lg items-center justify-center"
            onPress={onClose}
          >
            <Text style={{ color: colors.textSecondary }} className="font-medium">{t("pay.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
