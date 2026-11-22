import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
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
  const router = useRouter();
  const { awaitingJobs, openAssignJob, requestCancelJob, openManualJob, openDetail } = useSchedule();

  // Teklif tutari (para birimine gore) ve bekleme suresi
  const totalOf = (job: (typeof awaitingJobs)[number]) => {
    const sums: Record<string, number> = {};
    (job.quoteLines || []).forEach((l) => {
      const cur = l.currency || "TRY";
      sums[cur] = (sums[cur] || 0) + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    });
    const sym: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
    return Object.entries(sums).filter(([, v]) => v > 0)
      .map(([c, v]) => `${v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${sym[c] || c}`).join(" + ");
  };
  const waitLabel = (createdAt?: string) => {
    if (!createdAt) return "";
    const d = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
    return d === 0 ? t("sch.waitingToday") : t("sch.waitingDays", { n: String(d) });
  };
  // Planlamadan gecmeden (orn. ayni gun yapilan is) servis formu: kayitla is tamamlanir.
  const openServiceForm = (id: number) => router.push({ pathname: "/services", params: { fromJob: String(id) } });

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
            const total = totalOf(job);
            const days = job.createdAt ? Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000) : 0;
            return (
              <View key={job.id} className="rounded-xl border p-3" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                <View className="flex-row items-start">
                  {/* Karta dokununca detay (notlar, teklif baglantisi, tum islemler) */}
                  <TouchableOpacity className="flex-1 pr-2" onPress={() => openDetail(job)} accessibilityRole="button" activeOpacity={0.7}>
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
                    <View className="flex-row items-center flex-wrap gap-x-3 mt-1.5">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={11} color={days >= 3 ? colors.danger : colors.textMuted} />
                        <Text className="text-[11px] ml-1" style={{ color: days >= 3 ? colors.danger : colors.textMuted }}>{waitLabel(job.createdAt)}</Text>
                      </View>
                      {total ? (
                        <Text className="text-[11px] font-semibold" style={{ color: colors.text }}>{total}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
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
                        className="h-9 px-2.5 rounded-lg items-center justify-center"
                        style={{ backgroundColor: colors.success + "1F" }}
                        onPress={() => openServiceForm(job.id)}
                        accessibilityRole="button"
                        accessibilityLabel={t("sch.createServiceForm")}
                        {...({ title: t("sch.createServiceForm") } as any)}
                      >
                        <Ionicons name="construct-outline" size={16} color={colors.success} />
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
