import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { strToDate } from "../../../utils/date";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function AppointmentDetailModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { detailVisible, detailAppointment, teams, closeDetail, editDetail, requestDeleteDetail } = useSchedule();

  return (
    <ModalShell visible={detailVisible} onRequestClose={closeDetail}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.planDetail")}</Text>
        <TouchableOpacity onPress={closeDetail}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {detailAppointment && (() => {
        const team = teams.find((t) => t.id === detailAppointment.ekipId);
        const gunler = [t("day.sunday"), t("day.monday"), t("day.tuesday"), t("day.wednesday"), t("day.thursday"), t("day.friday"), t("day.saturday")];
        const d = strToDate(detailAppointment.tarih);
        return (
          <View>
            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${team?.color || "#6080FF"}15` }}>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${team?.color || "#6080FF"}30` }}>
                  <Ionicons name="people" size={20} color={team?.color || "#6080FF"} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-sm" style={{ color: colors.text }}>{detailAppointment.customerName}</Text>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>{detailAppointment.tur}</Text>
                </View>
              </View>
            </View>

            <View className="gap-3 mb-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.date")}</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{gunler[d.getDay()]}, {detailAppointment.tarih}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <View>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.timeDuration")}</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.startTime} - {detailAppointment.duration}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <View>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.team")}</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.ekip}</Text>
                </View>
              </View>

              {detailAppointment.notes ? (
                <View className="flex-row items-start gap-3">
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.notes")}</Text>
                    <Text className="text-sm" style={{ color: colors.text }}>{detailAppointment.notes}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.danger + '15' }}
                onPress={requestDeleteDetail}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text className="text-xs font-medium" style={{ color: colors.danger }}>{t("common.delete")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.primary }}
                onPress={editDetail}
              >
                <Ionicons name="create-outline" size={16} color="white" />
                <Text className="text-xs font-medium" style={{ color: "white" }}>{t("common.edit")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </ModalShell>
  );
}
