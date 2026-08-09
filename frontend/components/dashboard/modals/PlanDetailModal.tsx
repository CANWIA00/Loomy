import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useDashboard } from "../DashboardContext";
import { strToDate } from "../../../utils/date";

export default function PlanDetailModal() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { detailModal, setDetailModal, detailAppointment, teams } = useDashboard();

  return (
    <Modal visible={detailModal} transparent animationType="fade" onRequestClose={() => setDetailModal(false)}>
      <View className="flex-1 justify-center items-center bg-black/60">
        <View className="rounded-2xl w-11/12 max-w-md p-5" style={{ backgroundColor: colors.bgCard }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("dash.planDetail")}</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {detailAppointment && (() => {
            const team = teams.find((t) => t.id === detailAppointment.ekipId);
            const gunler = ["day.sunday", "day.monday", "day.tuesday", "day.wednesday", "day.thursday", "day.friday", "day.saturday"].map((k) => t(k));
            const d = strToDate(detailAppointment.tarih);
            return (
              <View>
                <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${team?.color || colors.purple}15` }}>
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${team?.color || colors.purple}30` }}>
                      <Ionicons name="people" size={20} color={team?.color || colors.purple} />
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
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("dash.date")}</Text>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{gunler[d.getDay()]}, {detailAppointment.tarih}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                    <View>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("dash.timeDuration")}</Text>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.startTime} - {detailAppointment.duration}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <Ionicons name="people-outline" size={18} color={colors.primary} />
                    <View>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("dash.team")}</Text>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.ekip}</Text>
                    </View>
                  </View>

                  {detailAppointment.notes ? (
                    <View className="flex-row items-start gap-3">
                      <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                      <View className="flex-1">
                        <Text className="text-xs" style={{ color: colors.textMuted }}>{t("dash.notes")}</Text>
                        <Text className="text-sm" style={{ color: colors.text }}>{detailAppointment.notes}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  className="h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.purple }}
                  onPress={() => {
                    setDetailModal(false);
                    router.push("/schedule" as any);
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: "white" }}>{t("dash.goToPlan")}</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </View>
    </Modal>
  );
}
