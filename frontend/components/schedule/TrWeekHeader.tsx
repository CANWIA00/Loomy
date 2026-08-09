import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function TrWeekHeader({ dateRange }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View className="flex-row border-b" style={{ borderColor: colors.border }}>
      {dateRange.map((date: any, i: number) => {
        const bugun = new Date();
        const isToday = date.date() === bugun.getDate() && date.month() === bugun.getMonth();
        return (
          <View key={i} className="flex-1 items-center py-2">
            <Text className="text-xs mb-1" style={{ color: isToday ? colors.primary : colors.textSecondary }}>
              {[t("dayShort.sun"), t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat")][date.day()]}
            </Text>
            <View className={`h-7 w-7 rounded-full items-center justify-center ${isToday ? "" : ""}`} style={isToday ? { backgroundColor: colors.primary } : {}}>
              <Text className="text-sm font-semibold" style={{ color: "white" }}>
                {date.date()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
