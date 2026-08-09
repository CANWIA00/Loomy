import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";

export default function DevHeader() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { handleLogout, setTab } = useDevDashboard();

  return (
    <View
      className="w-full border-b px-4 py-3"
      style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
    >
      <View className="w-full max-w-6xl mx-auto flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
            <Ionicons name="code-slash" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.text }} className="text-lg font-bold tracking-tight">
              Dev Yönetim
            </Text>
            <Text style={{ color: colors.textMuted }} className="text-xs">
              /dev paneli
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={toggleTheme}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab("dashboard")}>
            <Ionicons name="home-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: colors.danger + "15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="log-out-outline" size={16} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 13 }}>Çıkış</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
