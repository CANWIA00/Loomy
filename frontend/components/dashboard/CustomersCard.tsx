import { View, Text, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDashboard } from "./DashboardContext";

export default function CustomersCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { customers } = useDashboard();

  return (
    <View className="flex-1">
      <Pressable onPress={() => router.push("/customers" as any)}>
        <View className="rounded-2xl p-4 h-80" style={{ backgroundColor: colors.bgCard }}>
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.teal + '15' }}>
              <Ionicons name="people" size={20} color={colors.teal} />
            </View>
            <View className="ml-3 flex-1">
              <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.customers")}</Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm">
                {t("dash.customers.desc")}
              </Text>
            </View>
            <TouchableOpacity
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/customers" as any)}
            >
              <Ionicons name="person-add-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" nestedScrollEnabled indicatorStyle={colors.indicatorBg as any}>
            {customers.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Ionicons name="people-outline" size={40} color={colors.border} />
                <Text style={{ color: colors.textMuted }} className="text-sm mt-3 text-center">{t("dash.noCustomers")}</Text>
              </View>
            ) : customers.map((m) => (
              <TouchableOpacity
                key={m.id}
                className="flex-row items-center py-3 border-b"
                style={{ borderColor: colors.border + '50' }}
                onPress={() => router.push(`/customers` as any)}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                    {m.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text style={{ color: colors.text }} className="text-sm font-medium">{m.companyName}</Text>
                  <Text style={{ color: colors.textMuted }} className="text-xs">{m.contactPerson} · {m.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </View>
  );
}
