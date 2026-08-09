import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useDevDashboard } from "../DevDashboardContext";

export default function CreateKeyModal() {
  const { colors } = useTheme();
  const {
    createKeyModal,
    setCreateKeyModal,
    createKeyCount,
    setCreateKeyCount,
    createKeyLoading,
    handleCreateKeys,
  } = useDevDashboard();

  return (
    <Modal visible={createKeyModal} transparent animationType="fade">
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <Text style={{ color: colors.text }} className="text-lg font-bold mb-2">
            Yeni Admin Anahtarı
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm mb-4">
            Kaç adet anahtar oluşturulacak? (1-20)
          </Text>
          <TextInput
            className="h-11 rounded-lg px-4 text-base"
            style={{
              backgroundColor: colors.bgInput,
              color: colors.text,
              borderColor: colors.border,
              borderWidth: 1,
            }}
            keyboardType="number-pad"
            value={createKeyCount}
            onChangeText={setCreateKeyCount}
          />
          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
              onPress={() => setCreateKeyModal(false)}
            >
              <Text style={{ color: colors.textSecondary }} className="font-semibold">İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={handleCreateKeys}
              disabled={createKeyLoading}
            >
              {createKeyLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "white" }} className="font-semibold">Oluştur</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
