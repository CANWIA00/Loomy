import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { strToDate } from "../../../utils/date";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function AppointmentDetailModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { detailVisible, detailAppointment, teams, closeDetail, editDetail, requestDeleteDetail } = useSchedule();
  const isDone = detailAppointment?.status === "DONE";

  // Is tamamlaninca servis formu planli isten acilir: musteri ve teklif kalemleri dolu gelir.
  const openServiceForm = () => {
    if (!detailAppointment) return;
    closeDetail();
    router.push({ pathname: "/services", params: { fromJob: String(detailAppointment.id) } });
  };
  const openServiceRecord = () => {
    if (!detailAppointment?.serviceRecordId) return;
    closeDetail();
    router.push({ pathname: "/services", params: { edit: String(detailAppointment.serviceRecordId) } });
  };

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
                {isDone ? (
                  <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: colors.success + "22" }}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text className="text-[11px] font-semibold ml-1" style={{ color: colors.success }}>{t("sch.jobDone")}</Text>
                  </View>
                ) : detailAppointment.quoteId ? (
                  <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary + "1A" }}>
                    <Text className="text-[11px] font-semibold" style={{ color: colors.primary }}>{t("sch.fromQuote")}</Text>
                  </View>
                ) : null}
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

            {isDone ? (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center flex-row gap-2 mb-3"
                style={{ backgroundColor: colors.success + "18", borderWidth: 1, borderColor: colors.success + "55" }}
                onPress={openServiceRecord}
                disabled={!detailAppointment.serviceRecordId}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.success} />
                <Text className="text-xs font-semibold" style={{ color: colors.success }}>{t("sch.openServiceRecord")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center flex-row gap-2 mb-3"
                style={{ backgroundColor: colors.success }}
                onPress={openServiceForm}
              >
                <Ionicons name="construct-outline" size={16} color="white" />
                <Text className="text-xs font-semibold" style={{ color: "white" }}>{t("sch.createServiceForm")}</Text>
              </TouchableOpacity>
            )}

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
                style={{ backgroundColor: isDone ? colors.bgInput : colors.primary, opacity: isDone ? 0.5 : 1 }}
                onPress={editDetail}
                disabled={isDone}
              >
                <Ionicons name="create-outline" size={16} color={isDone ? colors.textMuted : "white"} />
                <Text className="text-xs font-medium" style={{ color: isDone ? colors.textMuted : "white" }}>{t("common.edit")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </ModalShell>
  );
}
