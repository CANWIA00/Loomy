import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { dateToStr, strToDate } from "../../utils/date";
import { useSchedule } from "./ScheduleContext";
import type { PlanFilter } from "./types";

export default function PlanList() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    filteredAppointments,
    teams,
    planFilter,
    setPlanFilter,
    listTeamFilter,
    setListTeamFilter,
    calendarDate,
    showTeamFilter,
    openDetail,
  } = useSchedule();

  const d = new Date(calendarDate);
  const todayStr = dateToStr(new Date());

  const dayStartStr = dateToStr(d);

  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = dateToStr(weekStart);
  const weekEndStr = dateToStr(weekEnd);

  const monthStartStr = dateToStr(new Date(d.getFullYear(), d.getMonth(), 1));
  const monthEndStr = dateToStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));

  const listFilteredAppointments = listTeamFilter === t("sch.allTeams")
    ? filteredAppointments
    : filteredAppointments.filter((a) => a.ekip === listTeamFilter);

  const sorted = [...listFilteredAppointments].sort((a, b) => {
    if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih);
    return a.startTime.localeCompare(b.startTime);
  });

  const filtered = sorted.filter((a) => {
    if (planFilter === "gun") return a.tarih === dayStartStr;
    if (planFilter === "hafta") return a.tarih >= weekStartStr && a.tarih <= weekEndStr;
    if (planFilter === "ay") return a.tarih >= monthStartStr && a.tarih <= monthEndStr;
    return true;
  });

  const filterButtons: { key: PlanFilter; label: string }[] = [
    { key: "gun", label: t("sch.day") },
    { key: "hafta", label: t("sch.week") },
    { key: "ay", label: t("sch.month") },
    { key: "tum", label: t("sch.allTeams") },
  ];

  return (
    <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="list" size={18} color={colors.primary} />
          <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("sch.planList")}</Text>
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{filteredAppointments.length}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3 items-center">
        {filterButtons.map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`px-3 h-7 rounded-lg items-center justify-center ${planFilter !== f.key ? "border" : ""}`}
            style={{
              backgroundColor: planFilter === f.key ? colors.primary : colors.bgCard,
              borderColor: planFilter === f.key ? undefined : colors.border,
            }}
            onPress={() => setPlanFilter(f.key)}
          >
            <Text className="text-xs font-medium" style={{ color: planFilter === f.key ? "white" : colors.textSecondary }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          className="flex-row items-center h-7 px-2.5 border rounded-lg"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          onPress={() => showTeamFilter("list")}
        >
          <Text className="text-xs mr-1.5" style={{ color: colors.text }}>
            {listTeamFilter === t("sch.allTeams") ? t("sch.allTeams") : listTeamFilter}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </TouchableOpacity>

        {(planFilter !== "gun" || listTeamFilter !== t("sch.allTeams")) && (
          <TouchableOpacity
            className="h-7 w-7 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.danger + '15' }}
            onPress={() => {
              setPlanFilter("gun");
              setListTeamFilter(t("sch.allTeams"));
            }}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View className="py-8 items-center">
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>
            {planFilter === "gun" ? t("sch.noPlanToday") : planFilter === "hafta" ? t("sch.noPlanWeek") : planFilter === "ay" ? t("sch.noPlanMonth") : t("sch.noPlanFound")}
          </Text>
        </View>
      ) : (
        <ScrollView className="max-h-[400px]" nestedScrollEnabled indicatorStyle={colors.indicatorBg as any}>
          {(() => {
            let lastDate = "";
            return filtered.map((a) => {
              const team = teams.find((t) => t.id === a.ekipId);
              const gunler = [t("dayShort.sun"), t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat")];
              const d2 = strToDate(a.tarih);
              const dateLabel = `${gunler[d2.getDay()]} ${a.tarih}`;
              const showDateHeader = a.tarih !== lastDate;
              if (showDateHeader) lastDate = a.tarih;
              return (
                <View key={a.id}>
                  {showDateHeader && (
                    <View className="flex-row items-center gap-2 mt-2 mb-1.5">
                      <Ionicons name="calendar" size={13} color={colors.primary} />
                      <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{dateLabel}</Text>
                      <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                    </View>
                  )}
                  <TouchableOpacity
                    className="rounded-xl p-3 mb-1.5 flex-row items-center gap-3"
                    style={{
                      backgroundColor: `${team?.color || "#6080FF"}10`,
                      borderLeftWidth: 3,
                      borderLeftColor: team?.color || "#6080FF",
                      opacity: a.tarih < todayStr ? 0.5 : 1,
                    }}
                    onPress={() => openDetail(a)}
                    activeOpacity={0.7}
                  >
                    <View className="items-center" style={{ minWidth: 45 }}>
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>{a.startTime}</Text>
                      <Text className="text-[10px]" style={{ color: colors.textMuted }}>{a.duration}</Text>
                    </View>
                    <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{a.customerName}</Text>
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <View className="w-2 h-2 rounded-full" style={{ backgroundColor: team?.color || "#6080FF" }} />
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.ekip}</Text>
                        <Text className="text-xs" style={{ color: colors.textMuted }}>•</Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.tur}</Text>
                      </View>
                    </View>
                    {a.tarih < todayStr ? (
                      <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.textMuted + '30' }}>
                        <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>{t("sch.past")}</Text>
                      </View>
                    ) : a.tarih === todayStr ? (
                      <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '20' }}>
                        <Text className="text-[10px] font-medium" style={{ color: colors.primary }}>{t("dash.today")}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            });
          })()}
        </ScrollView>
      )}
    </View>
  );
}
