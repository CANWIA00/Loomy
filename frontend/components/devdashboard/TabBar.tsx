import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";
import type { Tab } from "./types";

const TABS: { key: Tab; label: string; icon: "speedometer" | "business" | "card" | "key" }[] = [
  { key: "dashboard", label: "Dashboard", icon: "speedometer" },
  { key: "customers", label: "Müşterilerim", icon: "business" },
  { key: "payments", label: "Ödemelerim", icon: "card" },
  { key: "keys", label: "Admin Keyler", icon: "key" },
];

export default function TabBar() {
  const { colors } = useTheme();
  const { tab, setTab } = useDevDashboard();

  return (
    <View className="w-full border-b" style={{ borderColor: colors.border }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="w-full max-w-6xl mx-auto"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              className="flex-row items-center gap-2 px-4 py-3"
              style={active ? { borderBottomWidth: 2, borderBottomColor: colors.primary } : undefined}
            >
              <Ionicons name={t.icon} size={16} color={active ? colors.primary : colors.textMuted} />
              <Text
                className="text-sm font-semibold"
                style={{ color: active ? colors.primary : colors.textMuted }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
