import { View, Text, TouchableOpacity, ScrollView, Pressable, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { customerApi, Customer } from "../../api/customers";
import { paymentApi, PaymentSummary, PaymentRecord } from "../../api/payments";
import { appointmentApi, Appointment } from "../../api/appointments";
import { teamApi, Team } from "../../api/teams";
import CustomAlert from "../../components/CustomAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [toggleAlert, setToggleAlert] = useState<{ visible: boolean; record: PaymentRecord | null }>({ visible: false, record: null });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [planFilter, setPlanFilter] = useState<"today" | "tomorrow" | "week">("today");
  const [detailModal, setDetailModal] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  const strToDate = (s: string): Date => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const dateToStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getWeekDates = (): string[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(dateToStr(d));
    }
    return dates;
  };

  const filteredAppointments = todayAppointments.filter((a) => {
    const now = new Date();
    const today = dateToStr(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = dateToStr(tomorrowDate);
    if (planFilter === "today") return a.tarih === today;
    if (planFilter === "tomorrow") return a.tarih === tomorrow;
    if (planFilter === "week") return getWeekDates().includes(a.tarih);
    return true;
  });

  const fetchPayments = useCallback(async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        paymentApi.getSummary(),
        paymentApi.getAll(0, 5),
      ]);
      setPaymentSummary(summaryRes.data);
      setRecentPayments(recentRes.data.content);
    } catch {}
  }, []);

  const togglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecentPayments((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      setPaymentSummary((prev) => {
        if (!prev) return prev;
        const fee = record.amount;
        if (record.paid) {
          return { ...prev, paidTotal: prev.paidTotal - fee, pendingTotal: prev.pendingTotal + fee, paidCount: prev.paidCount - 1, pendingCount: prev.pendingCount + 1 };
        } else {
          return { ...prev, paidTotal: prev.paidTotal + fee, pendingTotal: prev.pendingTotal - fee, paidCount: prev.paidCount + 1, pendingCount: prev.pendingCount - 1 };
        }
      });
    } catch {}
  };

  useEffect(() => {
    customerApi.getAllSimple().then((res) => setCustomers(res.data)).catch(() => {});
    fetchPayments();
    Promise.all([
      appointmentApi.getAll().catch(() => ({ data: [] })),
      teamApi.getAll().catch(() => ({ data: [] })),
    ]).then(([aptRes, teamRes]) => {
      setTodayAppointments(aptRes.data);
      setTeams(teamRes.data);
    });
  }, [fetchPayments]);

  return (
    <>
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row justify-between items-center mb-1">
          <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
            {t("dash.welcome")}
          </Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/profil" as any)}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: colors.textMuted }} className="text-sm mb-6">
          {t("dash.subtitle")}
        </Text>

        <View className="flex-col gap-4">
          {/* SATIR 1: SERVISLER */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/services" as any)}
          >
            <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                  <Ionicons name="chatbubbles" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.services")}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">
                    {t("dash.services.desc")}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="h-8 px-3 rounded-lg items-center justify-center flex-row"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.push("/services" as any)}
                  >
                    <Ionicons name="person-add-outline" size={14} color="white" />
                    <Text style={{ color: "white" }} className="text-xs font-medium ml-1">{t("dash.newService")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-8 px-3 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.push("/services" as any)}
                  >
                    <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.manage")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* SATIR 2: MUSTERILER + PLAN */}
          <View className="flex-col md:flex-row gap-4">
            <View className="flex-1">
              <Pressable onPress={() => router.push("/customers" as any)}>
                <View className="rounded-2xl p-4 h-80" style={{ backgroundColor: colors.bgCard }}>
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.teal + '15' }}>
                      <Ionicons name="people" size={20} color={colors.teal} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.customers")}</Text>
                      <Text style={{ color: colors.textSecondary }} className="text-sm">
                        {t("dash.customers.desc")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => router.push("/customers" as any)}
                    >
                      <Ionicons name="person-add-outline" size={18} color="white" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="flex-1" nestedScrollEnabled indicatorStyle={colors.indicatorBg}>
                    {customers.length === 0 ? (
                      <View className="items-center justify-center py-8">
                        <Ionicons name="people-outline" size={40} color={colors.border} />
                        <Text style={{ color: colors.textMuted }} className="text-sm mt-3 text-center">{t("dash.noCustomers")}</Text>
                      </View>
                    ) : customers.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        className="flex-row items-center py-3 border-b"
                        style={{ borderColor: colors.border + '50' }}
                        onPress={() => router.push(`/customers` as any)}
                      >
                        <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                            {m.companyName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="ml-3 flex-1">
                          <Text style={{ color: colors.text }} className="text-sm font-medium">{m.companyName}</Text>
                          <Text style={{ color: colors.textMuted }} className="text-xs">{m.contactPerson} · {m.phone}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.border} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </View>

            <View className="flex-1">
              <View className="rounded-2xl p-4 h-80" style={{ backgroundColor: colors.bgCard }}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.purple + '15' }}>
                      <Ionicons name="calendar" size={20} color={colors.purple} />
                    </View>
                    <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("dash.plan")}</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/schedule" as any)}>
                    <Ionicons name="arrow-forward" size={20} color={colors.purple} />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 mb-2 items-center">
                  {([
                    { key: "today" as const, label: t("dash.today") },
                    { key: "tomorrow" as const, label: t("dash.tomorrow") },
                    { key: "week" as const, label: t("dash.thisWeek") },
                  ]).map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      className="h-7 px-3 rounded-lg items-center justify-center"
                      style={{ backgroundColor: planFilter === f.key ? colors.purple : colors.bgInput, borderWidth: planFilter === f.key ? 0 : 1, borderColor: colors.border }}
                      onPress={() => setPlanFilter(f.key)}
                    >
                      <Text className="text-xs font-medium" style={{ color: planFilter === f.key ? "white" : colors.textMuted }}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <View className="ml-auto px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.purple + '20' }}>
                    <Text className="text-xs font-semibold" style={{ color: colors.purple }}>{filteredAppointments.length}</Text>
                  </View>
                </View>

                <Text className="text-xs mb-2" style={{ color: colors.textMuted }}>
                  {(() => {
                    const now = new Date();
                    if (planFilter === "today") return `${dateToStr(now)} — ${t("dash.today")}`;
                    if (planFilter === "tomorrow") { const tm = new Date(now); tm.setDate(now.getDate() + 1); return `${dateToStr(tm)} — ${t("dash.tomorrow")}`; }
                    const dayOfWeek = now.getDay();
                    const monday = new Date(now);
                    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    return `${dateToStr(monday)} — ${dateToStr(sunday)}`;
                  })()}
                </Text>

                <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg}>
                  {filteredAppointments.length === 0 ? (
                    <View className="items-center py-8">
                      <Ionicons name="calendar-outline" size={32} color={colors.border} />
                      <Text style={{ color: colors.textMuted }} className="text-xs mt-2">{t("dash.noPlan")}</Text>
                    </View>
                  ) : (
                    filteredAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((r) => {
                      const team = teams.find((t) => t.id === r.ekipId);
                      const renk = team?.color || colors.purple;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          className="rounded-xl border p-3 mb-2"
                          style={{ backgroundColor: `${renk}10`, borderColor: `${renk}30` }}
                          activeOpacity={0.7}
                          onPress={() => {
                            setDetailAppointment(r);
                            setDetailModal(true);
                          }}
                        >
                          <View className="flex-row items-center mb-1">
                            <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: `${renk}30` }}>
                              <Text className="text-xs font-semibold" style={{ color: renk }}>{r.startTime}</Text>
                            </View>
                            <Text style={{ color: colors.text }} className="text-sm font-medium ml-2" numberOfLines={1}>{r.customerName}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <View style={{ backgroundColor: renk, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text className="text-white font-bold" style={{ fontSize: 8 }}>{r.ekip}</Text>
                            </View>
                            <Text style={{ color: colors.textMuted }} className="text-xs">{r.tur}</Text>
                          </View>
                          {r.notes ? (
                            <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5" numberOfLines={1}>{r.notes}</Text>
                          ) : null}
                        </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
            </View>
          </View>

          {/* SATIR 3: ÖDEME DURUMU (sadece admin) */}
          {isAdmin && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/payments" as any)}
          >
            <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.warning + '15' }}>
                  <Ionicons name="card" size={20} color={colors.warning} />
                </View>
                <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("dash.paymentStatus")}</Text>
              </View>

              <View className="flex-col md:flex-row gap-6">
                <View className="flex-1">
                  {(() => {
                    const total = paymentSummary?.total || 0;
                    const paid = paymentSummary?.paidTotal || 0;
                    const pending = paymentSummary?.pendingTotal || 0;
                    const paidPct = total > 0 ? (paid / total) * 100 : 0;
                    const pendingPct = total > 0 ? (pending / total) * 100 : 0;
                    const formatAmount = (v: number) => `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

                    return (
                      <>
                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("dash.receivedPayment")}</Text>
                            <Text style={{ color: colors.primary }} className="text-xs font-bold">{formatAmount(paid)}</Text>
                          </View>
                          <View className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: colors.bgInput }}>
                            <View className="rounded-full h-full" style={{ backgroundColor: colors.primary, width: `${paidPct}%` }} />
                          </View>
                        </View>

                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("dash.pendingPayment")}</Text>
                            <Text style={{ color: colors.warning }} className="text-xs font-bold">{formatAmount(pending)}</Text>
                          </View>
                          <View className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: colors.bgInput }}>
                            <View className="rounded-full h-full" style={{ backgroundColor: colors.warning, width: `${pendingPct}%` }} />
                          </View>
                        </View>

                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("dash.estimatedTotal")}</Text>
                            <Text style={{ color: colors.success }} className="text-xs font-bold">{formatAmount(total)}</Text>
                          </View>
                          <View className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: colors.bgInput }}>
                            <View className="rounded-full h-full" style={{ backgroundColor: colors.success, width: "100%" }} />
                          </View>
                        </View>

                        <View className="mt-3 gap-2">
                          <View className="flex-row items-center justify-between">
                            <Text style={{ color: colors.textSecondary }} className="text-sm">{t("dash.receivedTotal")} ({paymentSummary?.paidCount || 0})</Text>
                            <Text style={{ color: colors.primary }} className="text-lg font-bold">{formatAmount(paid)}</Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text style={{ color: colors.textSecondary }} className="text-sm">{t("dash.pendingTotal")} ({paymentSummary?.pendingCount || 0})</Text>
                            <Text style={{ color: colors.warning }} className="text-lg font-bold">{formatAmount(pending)}</Text>
                          </View>
                          <View className="flex-row items-center justify-between pt-1 border-t" style={{ borderColor: colors.border }}>
                            <Text style={{ color: colors.textSecondary }} className="text-sm">{t("dash.estimatedCash")}</Text>
                            <Text style={{ color: colors.success }} className="text-xl font-bold">{formatAmount(total)}</Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>

                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-xs font-bold mb-3">{t("dash.recentServices")}</Text>
                  <ScrollView className="max-h-64" nestedScrollEnabled indicatorStyle={colors.indicatorBg}>
                    <View className="rounded-xl border" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}>
                      {recentPayments.length === 0 ? (
                        <View className="items-center py-6">
                          <Ionicons name="wallet-outline" size={32} color={colors.border} />
                          <Text style={{ color: colors.textMuted }} className="text-xs mt-2">{t("dash.noRecords")}</Text>
                        </View>
                      ) : (
                        recentPayments.map((s) => (
                          <View
                            key={s.id}
                            className="flex-row items-center justify-between px-3 py-2.5 border-b"
                            style={{ borderColor: colors.border }}
                          >
                            <TouchableOpacity className="flex-1" onPress={() => router.push("/payments" as any)}>
                              <Text style={{ color: colors.text }} className="text-sm font-medium">{s.customer}</Text>
                              <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">{s.serviceType || t("dash.service")} · {s.tarih}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-row items-center rounded-lg px-2 py-1"
                              style={{ backgroundColor: s.paid ? colors.success + '15' : colors.warning + '15' }}
                              onPress={() => setToggleAlert({ visible: true, record: s })}
                            >
                              <Ionicons name={s.paid ? "checkmark-circle" : "time"} size={12} color={s.paid ? colors.success : colors.warning} />
                              <Text className="text-xs font-medium ml-1" style={{ color: s.paid ? colors.success : colors.warning }}>
                                {s.paid ? t("dash.paid") : t("dash.pending")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          )}

          {/* SATIR 4: AYARLAR */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/settings" as any)}
          >
            <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.danger + '15' }}>
                  <Ionicons name="settings" size={20} color={colors.danger} />
                </View>
                <View className="ml-3 flex-1">
                  <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.settings")}</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">
                    {t("dash.settings.desc")}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="h-8 px-3 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.push("/(tabs)/profil" as any)}
                  >
                    <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.editProfile")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-8 px-3 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.push("/settings" as any)}
                  >
                    <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.settingsBtn")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

    <CustomAlert
      visible={toggleAlert.visible}
      type="confirm"
      title={toggleAlert.record?.paid ? t("dash.confirmRevert") : t("dash.confirmMarkPaid")}
      message={toggleAlert.record?.paid
        ? t("dash.confirmRevertMsg", { name: toggleAlert.record?.customer || "" })
        : t("dash.confirmMarkPaidMsg", { name: toggleAlert.record?.customer || "" })
      }
      onClose={() => setToggleAlert({ visible: false, record: null })}
      onConfirm={() => {
        if (toggleAlert.record) togglePaid(toggleAlert.record);
      }}
      confirmText={t("common.confirm")}
    />

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
    </>
  );
}
