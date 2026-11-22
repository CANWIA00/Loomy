import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSchedule } from "./ScheduleContext";

export default function CalendarNavigator() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { calendarDate, setCalendarDate, calendarMode: mode } = useSchedule();

  // Ileri/geri: gun/hafta gun ekleyerek; ay gorunumunde takvim ayi kadar
  // (30 gun eklemek 31 cekmeli aylarda bir ayi atlatabiliyordu).
  const step = (dir: 1 | -1) => {
    const d = new Date(calendarDate);
    if (mode === "month") {
      setCalendarDate(new Date(d.getFullYear(), d.getMonth() + dir, 1));
      return;
    }
    d.setDate(d.getDate() + dir * (mode === "week" ? 7 : mode === "3days" ? 3 : 1));
    setCalendarDate(d);
  };

  const label = (() => {
    const d = new Date(calendarDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    if (mode === "day") return `${dd}/${mm}/${yyyy}`;
    if (mode === "3days") {
      const end = new Date(d);
      end.setDate(d.getDate() + 2);
      return `${dd}/${mm} - ${String(end.getDate()).padStart(2, "0")}/${String(end.getMonth() + 1).padStart(2, "0")}/${end.getFullYear()}`;
    }
    if (mode === "week") {
      const weekStart = new Date(d);
      // Hafta pazartesi baslar (takvim ve plan listesiyle ayni)
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const ws = String(weekStart.getDate()).padStart(2, "0");
      const wsm = String(weekStart.getMonth() + 1).padStart(2, "0");
      const wsy = weekStart.getFullYear();
      const we = String(weekEnd.getDate()).padStart(2, "0");
      const wem = String(weekEnd.getMonth() + 1).padStart(2, "0");
      const wey = weekEnd.getFullYear();
      return `${ws}/${wsm}/${wsy} - ${we}/${wem}/${wey}`;
    }
    const aylar = [t("month.january"), t("month.february"), t("month.march"), t("month.april"), t("month.may"), t("month.june"), t("month.july"), t("month.august"), t("month.september"), t("month.october"), t("month.november"), t("month.december")];
    return `${aylar[d.getMonth()]} ${yyyy}`;
  })();

  return (
    <View className="rounded-2xl border p-3 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity
          className="h-8 px-3 rounded-lg items-center justify-center flex-row"
          style={{ backgroundColor: colors.bgInput }}
          onPress={() => step(-1)}
        >
          <Ionicons name="chevron-back" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          className="h-8 px-4 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary + '15' }}
          onPress={() => setCalendarDate(new Date())}
        >
          <Text className="text-xs font-medium" style={{ color: colors.primary }}>
            {label}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="h-8 px-3 rounded-lg items-center justify-center flex-row"
          style={{ backgroundColor: colors.bgInput }}
          onPress={() => step(1)}
        >
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
