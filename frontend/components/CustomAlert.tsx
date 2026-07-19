import { Modal, View, Text, TouchableOpacity } from "react-native";

type CustomAlertProps = {
  visible: boolean;
  type: "success" | "error" | "confirm";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmColor?: string;
};

export default function CustomAlert({ visible, type, title, message, onClose, onConfirm, confirmText, confirmColor }: CustomAlertProps) {
  const isError = type === "error";
  const isConfirm = type === "confirm";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm items-center border border-[#2A2A2A]">
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isError ? "bg-red-500/20" : isConfirm ? "bg-[#F59E0B]/20" : "bg-green-500/20"
            }`}
          >
            <Text className="text-3xl">{isError ? "🚫" : isConfirm ? "⚠️" : "✅"}</Text>
          </View>

          <Text
            className={`text-lg font-bold mb-2 ${
              isError ? "text-red-500" : isConfirm ? "text-[#F59E0B]" : "text-green-500"
            }`}
          >
            {title}
          </Text>

          <Text className="text-gray-400 text-sm text-center mb-6 leading-5">
            {message}
          </Text>

          {isConfirm ? (
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                className="flex-1 h-11 bg-[#2A2A2A] rounded-lg items-center justify-center"
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text className="text-gray-300 font-semibold text-base">İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-11 rounded-lg items-center justify-center"
                style={{ backgroundColor: confirmColor || "#3B82F6" }}
                onPress={() => { onClose(); onConfirm?.(); }}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">{confirmText || "Onayla"}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className={`w-full h-11 rounded-lg items-center justify-center ${
                isError ? "bg-red-500" : "bg-[#3B82F6]"
              }`}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Tamam</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
