import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSchedule } from "./ScheduleContext";

/**
 * Atama bekleyen isler: kabul edilen teklifler ve elle eklenen isler.
 * "Ata" ile ekip/tarih secilir ve is takvime gecer; "Iptal" ile listeden cikar.
 */
export default function AwaitingJobsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { awaitingJobs, openAssignJob, requestCancelJob, openManualJob } = useSchedule();

  return (
    <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: awaitingJobs.length ? colors.warning + "66" : colors.borderAlt }}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Ionicons name="hourglass-outline" size={18} color={awaitingJobs.length ? colors.warning : colors.textMuted} />
          <Text className="font-semibold text-base ml-2" style={{ color: colors.text }}>{t("sch.awaitingTitle")}</Text>
          <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: (awaitingJobs.length ? colors.warning : colors.textMuted) + "22" }}>
            <Text className="text-xs font-semibold" style={{ color: awaitingJobs.length ? colors.warning : colors.textMuted }}>{awaitingJobs.length}</Text>
          </View>
        </View>
        {isAdmin && (
          <TouchableOpacity
            className="flex-row items-center h-8 px-3 rounded-lg border border-dashed"
            style={{ borderColor: colors.primary, backgroundColor: colors.primary + "0A" }}
            onPress={openManualJob}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("sch.addJob")}</Text>
          </TouchableOpacity>
        )}
      </View>

      {awaitingJobs.length === 0 ? (
        <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.awaitingEmpty")}</Text>
      ) : (
        <View className="gap-2 mt-1">
          {awaitingJobs.map((job) => {
            const firstNote = (job.notes || "").split("\n").filter(Boolean);
            return (
              <View key={job.id} className="rounded-xl border p-3" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                <View className="flex-row items-start">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center flex-wrap gap-x-2">
                      <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{job.customerName}</Text>
                      {job.quoteId ? (
                        <View className="px-1.5 py-0.5 rounded-md" style={{ backgroundColor: colors.success + "1F" }}>
                          <Text className="text-[10px] font-semibold" style={{ color: colors.success }}>{t("sch.fromQuote")}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>{job.tur}</Text>
                    {firstNote.length > 0 && (
                      <Text className="text-[11px] mt-1" style={{ color: colors.textMuted }} numberOfLines={2}>
                        {firstNote.slice(job.quoteId ? 1 : 0).join("  ") || firstNote[0]}
                      </Text>
                    )}
                  </View>
                  {isAdmin && (
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        className="h-9 px-2.5 rounded-lg items-center justify-center"
                        style={{ backgroundColor: colors.danger + "14" }}
                        onPress={() => requestCancelJob(job)}
                        accessibilityRole="button"
                        accessibilityLabel={t("sch.cancelJob")}
                      >
                        <Ionicons name="close" size={16} color={colors.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="h-9 px-3 rounded-lg flex-row items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                        onPress={() => openAssignJob(job)}
                        accessibilityRole="button"
                      >
                        <Ionicons name="calendar-outline" size={14} color="white" />
                        <Text className="text-xs font-semibold ml-1" style={{ color: "white" }}>{t("sch.assignJob")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
