import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_USER_PANELS = ["services", "customers", "schedule"];

const allTabs: Record<string, { titleKey: string; icon: string; panel?: string }> = {
  dashboard: { titleKey: "tab.home", icon: "home" },
  stock: { titleKey: "tab.stock", icon: "cube", panel: "stock" },
  services: { titleKey: "tab.services", icon: "construct", panel: "services" },
  quotes: { titleKey: "tab.quotes", icon: "document-text", panel: "quotes" },
  customers: { titleKey: "tab.customers", icon: "people", panel: "customers" },
  schedule: { titleKey: "tab.schedule", icon: "calendar", panel: "schedule" },
  finans: { titleKey: "tab.finans", icon: "stats-chart", panel: "finans" },
  settings: { titleKey: "tab.settings", icon: "settings" },
};

function canAccessTab(
  user: { role?: string; panelAccess?: string[] | null } | null,
  name: string
): boolean {
  const tab = allTabs[name];
  if (!tab) return true;
  if (!tab.panel) return true;
  if (user?.role === "ADMIN") return true;
  const access = user?.panelAccess;
  if (Array.isArray(access)) return access.includes(tab.panel);
  return DEFAULT_USER_PANELS.includes(tab.panel);
}

function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const visibleRoutes = state.routes.filter((r: any) => {
    if (["profil", "settings", "_sitemap", "+not-found"].includes(r.name)) return false;
    return canAccessTab(user, r.name);
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
            href: canAccessTab(user, name) ? undefined : null,
          }}
        />
      ))}
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}