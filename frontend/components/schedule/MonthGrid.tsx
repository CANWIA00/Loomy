import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { dateToStr } from "../../utils/date";
import { useSchedule } from "./ScheduleContext";

export default function MonthGrid() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { calendarDate, events, appointments, openDayList, openDetailFromEvent } = useSchedule();

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const today = new Date();
  const gunKisa = [t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat"), t("dayShort.sun")];

  const cells: { day: number | null; date: Date | null }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ day: null, date: null });
    } else {
      cells.push({ day: dayNum, date: new Date(year, month, dayNum) });
    }
  }

  return (
    <View>
      <View className="flex-row border-b" style={{ borderColor: colors.border }}>
        {gunKisa.map((g, i) => (
          <View key={i} className="flex-1 items-center py-2">
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{g}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((cell, i) => {
          const isToday = cell.date && cell.date.getDate() === today.getDate() && cell.date.getMonth() === today.getMonth() && cell.date.getFullYear() === today.getFullYear();
          const dayEvents = cell.date ? events.filter((e) => e.start.getDate() === cell.date!.getDate() && e.start.getMonth() === cell.date!.getMonth() && e.start.getFullYear() === cell.date!.getFullYear()) : [];
          return (
            <TouchableOpacity
              key={i}
              style={{
                width: `${100 / 7}%`,
                minHeight: 80,
                borderWidth: 0.5,
                borderColor: colors.border + '40',
                backgroundColor: isToday ? colors.primary + '15' : 'transparent',
                padding: 4,
              }}
              onPress={() => {
                if (!cell.date) return;
                const dateStr = dateToStr(cell.date);
                const dayAppts = appointments.filter((a) => a.tarih === dateStr);
                openDayList(cell.date, dayAppts);
              }}
              activeOpacity={0.7}
            >
              {cell.day !== null && (
                <Text
                  style={{
                    color: isToday ? colors.primary : colors.textSecondary,
                    fontSize: 11,
                    fontWeight: isToday ? '700' : '500',
                    marginBottom: 2,
                  }}
                >
                  {cell.day}
                </Text>
              )}
              {dayEvents.slice(0, 3).map((ev, j) => (
                <TouchableOpacity
                  key={j}
                  style={{
                    backgroundColor: `${ev.renk}25`,
                    borderLeftWidth: 2,
                    borderLeftColor: ev.renk,
                    borderRadius: 3,
                    paddingHorizontal: 3,
                    paddingVertical: 1,
                    marginBottom: 2,
                  }}
                  onPress={() => openDetailFromEvent(ev)}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.text, fontSize: 9, fontWeight: '600', lineHeight: 12 }} numberOfLines={1}>{ev.title}</Text>
                  {ev.notlar ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 7, lineHeight: 10 }} numberOfLines={1}>{ev.notlar}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
              {dayEvents.length > 3 && (
                <Text style={{ color: colors.primary, fontSize: 8, fontWeight: '600' }}>+{dayEvents.length - 3} {t("sch.more")}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
