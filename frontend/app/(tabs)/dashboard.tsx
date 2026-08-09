import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import CustomAlert from "../../components/CustomAlert";
import { DashboardProvider, useDashboard } from "../../components/dashboard/DashboardContext";
import ServicesCard from "../../components/dashboard/ServicesCard";
import CustomersCard from "../../components/dashboard/CustomersCard";
import PlanCard from "../../components/dashboard/PlanCard";
import PaymentsCard from "../../components/dashboard/PaymentsCard";
import SettingsCard from "../../components/dashboard/SettingsCard";
import PlanDetailModal from "../../components/dashboard/modals/PlanDetailModal";

function DashboardScreenInner() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
  const { isAdmin, toggleAlert, setToggleAlert, togglePaid } = useDashboard();

  return (
    <>
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row justify-between items-center mb-1">
          <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
            {t("dash.welcome")}
          </Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/profil" as any)}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: colors.textMuted }} className="text-sm mb-6">
          {t("dash.subtitle")}
        </Text>

        <View className="flex-col gap-4">
          <ServicesCard />

          <View className="flex-col md:flex-row gap-4">
            <CustomersCard />
            <PlanCard />
          </View>

          {isAdmin && <PaymentsCard />}

          <SettingsCard />
        </View>
      </View>
    </ScrollView>

    <CustomAlert
      visible={toggleAlert.visible}
      type="confirm"
      title={toggleAlert.record?.paid ? t("dash.confirmRevert") : t("dash.confirmMarkPaid")}
      message={toggleAlert.record?.paid
        ? t("dash.confirmRevertMsg", { name: toggleAlert.record?.customer || "" })
        : t("dash.confirmMarkPaidMsg", { name: toggleAlert.record?.customer || "" })
      }
      onClose={() => setToggleAlert({ visible: false, record: null })}
      onConfirm={() => {
        if (toggleAlert.record) togglePaid(toggleAlert.record);
      }}
      confirmText={t("common.confirm")}
    />

    <PlanDetailModal />
    </>
  );
}

export default function DashboardScreen() {
  return (
    <DashboardProvider>
      <DashboardScreenInner />
    </DashboardProvider>
  );
}
