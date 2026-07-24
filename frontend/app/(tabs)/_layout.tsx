import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

const allTabs: Record<string, { titleKey: string; icon: string; adminOnly?: boolean }> = {
  dashboard: { titleKey: "tab.home", icon: "home" },
  services: { titleKey: "tab.services", icon: "construct" },
  customers: { titleKey: "tab.customers", icon: "people" },
  schedule: { titleKey: "tab.schedule", icon: "calendar" },
  payments: { titleKey: "tab.payments", icon: "card", adminOnly: true },
  settings: { titleKey: "tab.settings", icon: "settings" },
};

function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const visibleRoutes = state.routes.filter((r: any) => {
    if (["profil", "settings", "_sitemap", "+not-found"].includes(r.name)) return false;
    const tab = allTabs[r.name];
    if (tab?.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <View style={{ backgroundColor: colors.bg }} className="w-full flex-row items-center justify-around px-2 py-2">
      {visibleRoutes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = allTabs[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            className="items-center justify-center py-1"
            style={{ minWidth: 44 }}
          >
            <Ionicons
              name={isFocused ? (tab?.icon as any) : (`${tab?.icon}-outline` as any)}
              size={isFocused ? 24 : 22}
              color={isFocused ? colors.primary : colors.textMuted}
            />
            <Text
              style={{ color: isFocused ? colors.primary : colors.textMuted }}
              className={`text-[10px] mt-0.5 ${isFocused ? "font-bold" : "font-medium"}`}
            >
              {tab ? t(tab.titleKey) : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {Object.entries(allTabs).map(([name, tab]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: tab.titleKey,
            href: tab.adminOnly && !isAdmin ? null : undefined,
          }}
        />
      ))}
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}
