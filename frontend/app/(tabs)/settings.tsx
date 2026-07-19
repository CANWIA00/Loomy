import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";

export default function SettingsScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white tracking-tight">
              Ayarlar
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mt-1 mb-4">
          Profil ve uygulama ayarlarınızı yapılandırın
        </Text>
        <View className="items-center py-8">
          <View className="w-20 h-20 bg-[#3B82F6]/10 rounded-full items-center justify-center border border-[#1F1F1F] mb-4">
            <Text className="text-3xl font-bold text-[#3B82F6]">M</Text>
          </View>
          <Text className="text-white text-lg font-semibold">Mira</Text>
          <Text className="text-gray-500 text-sm mt-1">
            Müşteri İletişim Platformu
          </Text>
        </View>

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] overflow-hidden mb-6">
          {[
            { icon: "person" as const, label: "Profil Bilgileri" },
            { icon: "globe" as const, label: "Dil", right: "Türkçe" },
            { icon: "shield-checkmark" as const, label: "Gizlilik" },
            { icon: "help-circle" as const, label: "Yardım" },
            {
              icon: "information-circle" as const,
              label: "Sürüm",
              right: "v1.0.0",
            },
          ].map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              className={`flex-row items-center px-4 py-4 ${
                idx < 4 ? "border-b border-[#1F1F1F]" : ""
              }`}
            >
              <View className="w-9 h-9 bg-[#1A1A1A] rounded-xl items-center justify-center">
                <Ionicons name={item.icon} size={18} color="#888" />
              </View>
              <Text className="flex-1 text-white text-base ml-3">
                {item.label}
              </Text>
              {"right" in item && item.right && (
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm mr-2">
                    {item.right}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#333" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="items-center py-4"
          onPress={handleLogout}
        >
          <View className="bg-red-500/10 rounded-xl px-8 py-3.5">
            <Text className="text-red-400 font-semibold">Çıkış Yap</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
