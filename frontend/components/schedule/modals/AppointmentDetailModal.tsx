import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { strToDate, formatIsoDate, formatDuration } from "../../../utils/date";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

/**
 * Is detayi; islemler isin durumuna gore:
 * - Atama bekliyor: Servis formu · Ata · Iptal
 * - Planli: Servis formu · Duzenle · Atamayi geri al · Iptal (teklif isi) / Sil
 * - Tamamlandi: Servis kaydini ac (teklif isi degilse Sil)
 * Teklife bagli islerde "Teklifi ac" baglantisi; teklif isi silinemez (zincir kopmasin).
 */
export default function AppointmentDetailModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const router = useRouter();
  const {
    detailVisible, detailAppointment: job, teams, closeDetail, editDetail, requestDeleteDetail,
    unassignJob, requestCancelJob, openAssignJob, todayStr,
  } = useSchedule();

  const status = job?.status || "SCHEDULED";
  const isDone = status === "DONE";
  const isAwaiting = status === "AWAITING";
  const overdue = !!job && status === "SCHEDULED" && job.tarih < todayStr;
  const fromQuote = !!job?.quoteId;

  const go = (pathname: string, params: Record<string, string>) => {
    closeDetail();
    router.push({ pathname: pathname as any, params });
  };

  const team = job ? teams.find((x) => x.id === job.ekipId) : undefined;
  const accent = team?.color || (isAwaiting ? colors.warning : "#6080FF");
  const gunler = [t("day.sunday"), t("day.monday"), t("day.tuesday"), t("day.wednesday"), t("day.thursday"), t("day.friday"), t("day.saturday")];
  const waitingDays = job?.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000)) : null;

  const badge = isDone
    ? { icon: "checkmark-circle" as const, color: colors.success, text: t("sch.jobDone") }
    : overdue
      ? { icon: "alert-circle" as const, color: colors.danger, text: t("sch.serviceFormPending") }
      : isAwaiting
        ? { icon: "hourglass-outline" as const, color: colors.warning, text: t("sch.awaitingBadge") }
        : null;

  const smallBtn = (icon: any, label: string, color: string, onPress: () => void, filled = false) => (
    <TouchableOpacity
      key={label}
      className="flex-1 h-10 rounded-lg items-center justify-center flex-row gap-1.5 px-2"
      style={{ backgroundColor: filled ? color : color + "15" }}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={15} color={filled ? "white" : color} />
      <Text className="text-xs font-medium" style={{ color: filled ? "white" : color }} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ModalShell visible={detailVisible} onRequestClose={closeDetail}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.planDetail")}</Text>
        <TouchableOpacity onPress={closeDetail} accessibilityLabel={t("common.close")}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {job && (
        <View>
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${accent}15` }}>
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${accent}30` }}>
                <Ionicons name={isAwaiting ? "hourglass-outline" : "people"} size={20} color={accent} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm" style={{ color: colors.text }}>{job.customerName}</Text>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{job.tur}</Text>
              </View>
              {badge ? (
                <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: badge.color + "22" }}>
                  <Ionicons name={badge.icon} size={12} color={badge.color} />
                  <Text className="text-[11px] font-semibold ml-1" style={{ color: badge.color }}>{badge.text}</Text>
                </View>
              ) : null}
            </View>
            {fromQuote ? (
              <TouchableOpacity
                className="flex-row items-center mt-3 self-start"
                onPress={() => go("/quotes", { view: String(job.quoteId) })}
                accessibilityRole="link"
              >
                <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("sch.openQuote", { id: String(job.quoteId) })}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="gap-3 mb-4">
            {isAwaiting ? (
              <View className="flex-row items-center gap-3">
                <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
                <View>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.status")}</Text>
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>
                    {waitingDays === null || waitingDays === 0 ? t("sch.waitingToday") : t("sch.waitingDays", { n: String(waitingDays) })}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View className="flex-row items-center gap-3">
                  <Ionicons name="calendar-outline" size={18} color={overdue ? colors.danger : colors.primary} />
                  <View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.date")}</Text>
                    <Text className="text-sm font-medium" style={{ color: overdue ? colors.danger : colors.text }}>
                      {gunler[strToDate(job.tarih).getDay()]}, {formatIsoDate(job.tarih)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.timeDuration")}</Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>
                      {job.startTime} · {formatDuration(job.duration, { h: t("dur.h"), m: t("dur.m") })}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <Ionicons name="people-outline" size={18} color={colors.primary} />
                  <View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.team")}</Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>{job.ekip}</Text>
                  </View>
                </View>
              </>
            )}
            {job.notes ? (
              <View className="flex-row items-start gap-3">
                <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.notes")}</Text>
                  <Text className="text-sm" style={{ color: colors.text }}>{job.notes}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Ana islem */}
          {isDone ? (
            <TouchableOpacity
              className="h-11 rounded-lg items-center justify-center flex-row gap-2 mb-2"
              style={{ backgroundColor: colors.success + "18", borderWidth: 1, borderColor: colors.success + "55" }}
              onPress={() => job.serviceRecordId && go("/services", { edit: String(job.serviceRecordId) })}
              disabled={!job.serviceRecordId}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.success} />
              <Text className="text-sm font-semibold" style={{ color: colors.success }}>{t("sch.openServiceRecord")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="h-11 rounded-lg items-center justify-center flex-row gap-2 mb-2"
              style={{ backgroundColor: colors.success }}
              onPress={() => go("/services", { fromJob: String(job.id) })}
            >
              <Ionicons name="construct-outline" size={16} color="white" />
              <Text className="text-sm font-semibold" style={{ color: "white" }}>{t("sch.createServiceForm")}</Text>
            </TouchableOpacity>
          )}

          {/* Diger islemler (yonetici) */}
          {isAdmin && (
            <View className="flex-row gap-2">
              {isAwaiting && [
                smallBtn("close", t("sch.cancelJob"), colors.danger, () => requestCancelJob(job)),
                smallBtn("calendar-outline", t("sch.assignJob"), colors.primary, () => openAssignJob(job), true),
              ]}
              {status === "SCHEDULED" && [
                fromQuote
                  ? smallBtn("close", t("sch.cancelJob"), colors.danger, () => requestCancelJob(job))
                  : smallBtn("trash-outline", t("common.delete"), colors.danger, requestDeleteDetail),
                smallBtn("arrow-undo-outline", t("sch.unassign"), colors.warning, () => unassignJob(job)),
                smallBtn("create-outline", t("common.edit"), colors.primary, editDetail, true),
              ]}
              {isDone && !fromQuote && smallBtn("trash-outline", t("common.delete"), colors.danger, requestDeleteDetail)}
            </View>
          )}
        </View>
      )}
    </ModalShell>
  );
}
