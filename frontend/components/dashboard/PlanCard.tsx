import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDashboard } from "./DashboardContext";
import { dateToStr } from "../../utils/date";

export default function PlanCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    filteredAppointments,
    teams,
    planFilter,
    setPlanFilter,
    setDetailAppointment,
    setDetailModal,
  } = useDashboard();

  return (
    <View className="flex-1">
      <View className="rounded-2xl p-4 h-80" style={{ backgroundColor: colors.bgCard }}>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.purple + '15' }}>
              <Ionicons name="calendar" size={20} color={colors.purple} />
            </View>
            <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("dash.plan")}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/schedule" as any)}>
            <Ionicons name="arrow-forward" size={20} color={colors.purple} />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 mb-2 items-center">
          {([
            { key: "today" as const, label: t("dash.today") },
            { key: "tomorrow" as const, label: t("dash.tomorrow") },
            { key: "week" as const, label: t("dash.thisWeek") },
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              className="h-7 px-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: planFilter === f.key ? colors.purple : colors.bgInput, borderWidth: planFilter === f.key ? 0 : 1, borderColor: colors.border }}
              onPress={() => setPlanFilter(f.key)}
            >
              <Text className="text-xs font-medium" style={{ color: planFilter === f.key ? "white" : colors.textMuted }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
          <View className="ml-auto px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.purple + '20' }}>
            <Text className="text-xs font-semibold" style={{ color: colors.purple }}>{filteredAppointments.length}</Text>
          </View>
        </View>

        <Text className="text-xs mb-2" style={{ color: colors.textMuted }}>
          {(() => {
            const now = new Date();
            if (planFilter === "today") return `${dateToStr(now)} — ${t("dash.today")}`;
            if (planFilter === "tomorrow") { const tm = new Date(now); tm.setDate(now.getDate() + 1); return `${dateToStr(tm)} — ${t("dash.tomorrow")}`; }
            const dayOfWeek = now.getDay();
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            return `${dateToStr(monday)} — ${dateToStr(sunday)}`;
          })()}
        </Text>

        <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg as any}>
          {filteredAppointments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={32} color={colors.border} />
              <Text style={{ color: colors.textMuted }} className="text-xs mt-2">{t("dash.noPlan")}</Text>
            </View>
          ) : (
            filteredAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((r) => {
              const team = teams.find((t) => t.id === r.ekipId);
              const renk = team?.color || colors.purple;
              return (
                <TouchableOpacity
                  key={r.id}
                  className="rounded-xl border p-3 mb-2"
                  style={{ backgroundColor: `${renk}10`, borderColor: `${renk}30` }}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDetailAppointment(r);
                    setDetailModal(true);
                  }}
                >
                  <View className="flex-row items-center mb-1">
                    <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: `${renk}30` }}>
                      <Text className="text-xs font-semibold" style={{ color: renk }}>{r.startTime}</Text>
                    </View>
                    <Text style={{ color: colors.text }} className="text-sm font-medium ml-2" numberOfLines={1}>{r.customerName}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View style={{ backgroundColor: renk, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                      <Text className="text-white font-bold" style={{ fontSize: 8 }}>{r.ekip}</Text>
                    </View>
                    <Text style={{ color: colors.textMuted }} className="text-xs">{r.tur}</Text>
                  </View>
                  {r.notes ? (
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5" numberOfLines={1}>{r.notes}</Text>
                  ) : null}
                </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
    </View>
  );
}
