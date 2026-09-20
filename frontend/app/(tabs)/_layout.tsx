import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import type { PanelAccessMap } from "../../apiclient/auth";

const DEFAULT_USER_PANELS: PanelAccessMap = {
  services: "manage",
  customers: "manage",
  schedule: "manage",
};

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
  user: { role?: string; panelAccess?: PanelAccessMap | null } | null,
  name: string
): boolean {
  const tab = allTabs[name];
  if (!tab) return true;
  if (!tab.panel) return true;
  if (user?.role === "ADMIN") return true;
  const access = user?.panelAccess;
  if (access && typeof access === "object") return access[tab.panel as keyof PanelAccessMap] != null;
  return DEFAULT_USER_PANELS[tab.panel as keyof PanelAccessMap] != null;
}

function CustomTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r: any) => {
    if (["profil", "settings", "_sitemap", "+not-found"].includes(r.name)) return false;
    return canAccessTab(user, r.name);
  });

  return (
    <View style={{ backgroundColor: colors.bg, paddingBottom: Platform.OS === "web" ? 0 : insets.bottom }} className="w-full">
      <View className="w-full flex-row items-center justify-around border-t" style={{ borderColor: colors.border }}>
      {visibleRoutes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = allTabs[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            className="flex-1 items-center justify-center py-1"
          >
            <Ionicons
              name={isFocused ? (tab?.icon as any) : (`${tab?.icon}-outline` as any)}
              size={isFocused ? 21 : 19}
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