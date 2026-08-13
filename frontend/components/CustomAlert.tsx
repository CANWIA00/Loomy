import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

type CustomAlertProps = {
  visible: boolean;
  type: "success" | "error" | "confirm";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmColor?: string;
  cancelText?: string;
  thirdButton?: { text: string; onPress: () => void; color?: string };
};

export default function CustomAlert({ visible, type, title, message, onClose, onConfirm, confirmText, confirmColor, cancelText, thirdButton }: CustomAlertProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isError = type === "error";
  const isConfirm = type === "confirm";

  const iconBgColor = isError ? colors.danger + "33" : isConfirm ? colors.warning + "33" : colors.success + "33";
  const titleColor = isError ? colors.danger : isConfirm ? colors.warning : colors.success;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm items-center" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: iconBgColor }}
          >
            <Text className="text-3xl">{isError ? "🚫" : isConfirm ? "⚠️" : "✅"}</Text>
          </View>

          <Text style={{ color: titleColor }} className="text-lg font-bold mb-2">
            {title}
          </Text>

          <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-6 leading-5">
            {message}
          </Text>

          {isConfirm && thirdButton ? (
            <View className="flex-row gap-2 w-full">
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: thirdButton.color || colors.danger }}
                onPress={thirdButton.onPress}
                activeOpacity={0.8}
              >
                <Text style={{ color: "white" }} className="font-semibold text-sm">{thirdButton.text}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.textSecondary }} className="font-semibold text-sm">{cancelText || t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: confirmColor || colors.primary }}
                onPress={() => { onClose(); onConfirm?.(); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "white" }} className="font-semibold text-sm">{confirmText || t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          ) : isConfirm ? (
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.textSecondary }} className="font-semibold text-base">{cancelText || t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: confirmColor || colors.primary }}
                onPress={() => { onClose(); onConfirm?.(); }}
                activeOpacity={0.8}
              >
                <Text style={{ color: "white" }} className="font-semibold text-base">{confirmText || t("common.confirm")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-full h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: isError ? colors.danger : colors.primary }}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={{ color: "white" }} className="font-semibold text-base">{t("common.ok")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
