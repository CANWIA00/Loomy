import { Modal, View, Text, TouchableOpacity } from "react-native";

type CustomAlertProps = {
  visible: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
};

export default function CustomAlert({ visible, type, title, message, onClose }: CustomAlertProps) {
  const isError = type === "error";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm items-center border border-[#2A2A2A]">
          <View
            className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isError ? "bg-red-500/20" : "bg-green-500/20"
            }`}
          >
            <Text className="text-3xl">{isError ? "🚫" : "✅"}</Text>
          </View>

          <Text
            className={`text-lg font-bold mb-2 ${
              isError ? "text-red-500" : "text-green-500"
            }`}
          >
            {title}
          </Text>

          <Text className="text-gray-400 text-sm text-center mb-6 leading-5">
            {message}
          </Text>

          <TouchableOpacity
            className={`w-full h-11 rounded-lg items-center justify-center ${
              isError ? "bg-red-500" : "bg-[#3B82F6]"
            }`}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base">Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
