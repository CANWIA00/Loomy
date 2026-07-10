import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, Pressable } from "react-native";

const tabs = [
  { name: "dashboard", title: "Ana Sayfa", icon: "home" },
  { name: "services", title: "Servis", icon: "construct" },
  { name: "customers", title: "Müşteriler", icon: "people" },
  { name: "schedule", title: "Plan", icon: "calendar" },
  { name: "payments", title: "Ödemeler", icon: "card" },
  { name: "settings", title: "Ayarlar", icon: "settings" },
];

function CustomTabBar({ state, navigation }: any) {
  const visibleRoutes = state.routes.filter(
    (r: any) => !["profil", "settings", "_sitemap", "+not-found"].includes(r.name)
  );

  return (
    <View className="w-full bg-[#0A0A0A] flex-row items-center justify-around px-2 py-2">
      {visibleRoutes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs.find((t) => t.name === route.name);

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
              color={isFocused ? "#3B82F6" : "#6B7280"}
            />
            <Text
              className={`text-[10px] mt-0.5 ${isFocused ? "font-bold text-[#3B82F6]" : "font-medium text-[#6B7280]"}`}
            >
              {tab?.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
      <Tabs.Screen name="profil" options={{ href: null }} />
    </Tabs>
  );
}
