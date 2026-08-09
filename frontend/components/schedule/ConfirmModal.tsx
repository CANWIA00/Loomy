import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import ModalShell from "./ModalShell";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <ModalShell visible={visible} onRequestClose={() => !loading && onCancel()} maxWidth="max-w-sm">
      <View className="items-center mb-4">
        <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.bgInput }}>
          <Ionicons name="trash" size={28} color={colors.danger} />
        </View>
        <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>{title}</Text>
        <Text className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
          {message}
        </Text>
      </View>
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={onCancel}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: loading ? colors.danger + '80' : colors.danger }}
          onPress={onConfirm}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="font-medium" style={{ color: "white" }}>{confirmLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
