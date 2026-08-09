import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function DayListModal() {
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const {
    dayListVisible,
    closeDayList,
    dayListDate,
    dayListAppointments,
    teams,
    openDetail,
    addPlanFromDayList,
  } = useSchedule();

  return (
    <ModalShell visible={dayListVisible} onRequestClose={closeDayList}>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {dayListDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
          </Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {dayListAppointments.length} {t("sch.servicePlan")}
          </Text>
        </View>
        <TouchableOpacity onPress={closeDayList}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {dayListAppointments.length === 0 ? (
        <View className="py-8 items-center">
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>{t("sch.noPlanToday")}</Text>
          <TouchableOpacity
            className="mt-3 h-9 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={addPlanFromDayList}
          >
            <Text className="text-xs font-medium" style={{ color: "white" }}>+ {t("sch.newPlan")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="max-h-[400px]" nestedScrollEnabled>
          {dayListAppointments.map((a) => {
            const team = teams.find((t) => t.id === a.ekipId);
            return (
              <TouchableOpacity
                key={a.id}
                className="rounded-xl p-3 mb-2 flex-row items-center gap-3"
                style={{ backgroundColor: `${team?.color || "#6080FF"}12`, borderLeftWidth: 3, borderLeftColor: team?.color || "#6080FF" }}
                onPress={() => {
                  closeDayList();
                  openDetail(a);
                }}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>{a.startTime}</Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>- {a.duration}</Text>
                  </View>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{a.customerName}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: team?.color || "#6080FF" }} />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.ekip}</Text>
                    </View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>•</Text>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.tur}</Text>
                  </View>
                  {a.notes ? (
                    <Text className="text-xs mt-1" style={{ color: colors.textMuted }} numberOfLines={1}>{a.notes}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {dayListAppointments.length > 0 && (
        <TouchableOpacity
          className="mt-3 h-9 rounded-lg items-center justify-center flex-row gap-1"
          style={{ backgroundColor: colors.primary + '15' }}
          onPress={addPlanFromDayList}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text className="text-xs font-medium" style={{ color: colors.primary }}>+ {t("sch.newPlan")}</Text>
        </TouchableOpacity>
      )}
    </ModalShell>
  );
}
