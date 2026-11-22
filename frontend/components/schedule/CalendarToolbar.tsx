import { View, Text, TouchableOpacity } from "react-native";
import type { Mode } from "react-native-big-calendar";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSchedule } from "./ScheduleContext";

export default function CalendarToolbar() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    mode,
    setMode,
    selectedTeamFilter,
    setSelectedTeamFilter,
    showTeamFilter,
    openNewAppointment,
    isPhone,
  } = useSchedule();
  const teamFiltered = selectedTeamFilter !== t("sch.allTeams");

  return (
    <View className="flex-row flex-wrap gap-2 mb-4 items-center">
      {(["day", "week", "month"] as Mode[]).map((m) => (
        <TouchableOpacity
          key={m}
          className={`px-4 h-8 rounded-lg items-center justify-center ${
            mode === m ? "" : "border"
          }`}
          style={{
            backgroundColor: mode === m ? colors.primary : colors.bgCard,
            borderColor: mode === m ? undefined : colors.border,
          }}
          onPress={() => setMode(m)}
        >
          <Text className="text-xs font-medium" style={{ color: mode === m ? "white" : colors.textSecondary }}>
            {m === "day" ? t("sch.day") : m === "week" ? (isPhone ? t("sch.threeDays") : t("sch.week")) : t("sch.month")}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        className="flex-row items-center h-8 px-3 border rounded-lg"
        style={{ backgroundColor: teamFiltered ? colors.primary + "15" : colors.bgCard, borderColor: teamFiltered ? colors.primary : colors.border }}
        onPress={() => showTeamFilter("calendar")}
      >
        <Text className="text-xs mr-2" style={{ color: colors.text }}>
          {selectedTeamFilter === t("sch.allTeams") ? t("sch.allTeams") : selectedTeamFilter}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {teamFiltered ? (
        <TouchableOpacity
          className="h-8 w-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={() => setSelectedTeamFilter(t("sch.allTeams"))}
          accessibilityLabel={t("sch.clearTeamFilter")}
        >
          <Ionicons name="close" size={16} color={colors.danger} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        className="flex-row items-center h-8 px-3 rounded-lg ml-auto"
        style={{ backgroundColor: colors.primary }}
        onPress={() => openNewAppointment()}
      >
        <Ionicons name="add" size={16} color="white" />
        <Text className="text-xs font-medium ml-1" style={{ color: "white" }}>{t("sch.newPlan")}</Text>
      </TouchableOpacity>
    </View>
  );
}
