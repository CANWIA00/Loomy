import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { paymentApi, PaymentRecord, PaymentSummary } from "../../api/payments";
import CustomAlert from "../../components/CustomAlert";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  const { colors, isDark, toggleTheme } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bgInput }} className="rounded-full h-2 overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          backgroundColor: color,
          width: `${Math.min(Math.max(percentage, 0), 100)}%`,
        }}
      />
    </View>
  );
}

export default function PaymentsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"all" | "gun" | "hafta" | "ay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "odendi" | "bekliyor">("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(0);
  const [toggleAlert, setToggleAlert] = useState<{ visible: boolean; record: PaymentRecord | null }>({ visible: false, record: null });

  const statusOptions = [
    { label: t("pay.allStatus"), value: "all" },
    { label: t("pay.paid"), value: "odendi" },
    { label: t("pay.pending"), value: "bekliyor" },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.all([
        paymentApi.getAll(0, 200),
        paymentApi.getSummary(),
      ]);
      setRecords(paymentsRes.data.content);
      setSummary(summaryRes.data);
    } catch {
      Alert.alert(t("common.error"), t("pay.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setListPage(0);
  }, [searchQuery, timeFilter, statusFilter]);

  const parseDate = (tarih: string): Date => {
    const sep = tarih.includes(".") ? "." : "/";
    const parts = tarih.split(sep);
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(0);
  };

  const filteredServices = records
    .filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = s.customer.toLowerCase().includes(q);
        const matchService = s.serviceType.toLowerCase().includes(q);
        if (!matchCustomer && !matchService) return false;
      }
      if (timeFilter !== "all") {
        const tarih = parseDate(s.tarih);
        const bugun = new Date();
        if (timeFilter === "gun" && tarih.toDateString() !== bugun.toDateString()) return false;
        if (timeFilter === "hafta") {
          const haftaBaslangic = new Date(bugun);
          haftaBaslangic.setDate(bugun.getDate() - bugun.getDay());
          const haftaBitis = new Date(bugun);
          haftaBitis.setDate(bugun.getDate() + (6 - bugun.getDay()));
          if (tarih < haftaBaslangic || tarih > haftaBitis) return false;
        }
        if (timeFilter === "ay" && (tarih.getMonth() !== bugun.getMonth() || tarih.getFullYear() !== bugun.getFullYear())) return false;
      }
      if (statusFilter !== "all") {
        const durum = s.paid ? "odendi" : "bekliyor";
        if (durum !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => parseDate(b.tarih).getTime() - parseDate(a.tarih).getTime());

  const handleTogglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      const summaryRes = await paymentApi.getSummary();
      setSummary(summaryRes.data);
    } catch {
      Alert.alert(t("common.error"), t("pay.errorUpdate"));
    }
  };

  const formatAmount = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const LIST_SIZE = 10;
  const listTotalPages = Math.ceil(filteredServices.length / LIST_SIZE);
  const pagedServices = filteredServices.slice(listPage * LIST_SIZE, (listPage + 1) * LIST_SIZE);

  if (loading) {
    return (
      <View style={{ backgroundColor: colors.bg }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="text-sm mt-3">{t("pay.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} className="flex-1" indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
              {t("pay.title")}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
              <Ionicons name="home-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: colors.textMuted }} className="text-sm mb-5">
          {t("pay.subtitle")}
        </Text>

        <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <View style={{ backgroundColor: colors.warning + '15' }} className="w-10 h-10 rounded-xl items-center justify-center">
              <Ionicons name="card" size={20} color={colors.warning} />
            </View>
            <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("pay.status")}</Text>
          </View>

          <View className="flex-col gap-3">
            {(() => {
              const total = summary?.total || 0;
              const paid = summary?.paidTotal || 0;
              const pending = summary?.pendingTotal || 0;
              const paidPct = total > 0 ? (paid / total) * 100 : 0;
              const pendingPct = total > 0 ? (pending / total) * 100 : 0;

              return (
                <>
                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("pay.receivedPayment")}</Text>
                      <Text style={{ color: colors.primary }} className="text-xs font-bold">{formatAmount(paid)}</Text>
                    </View>
                    <AnimatedBar percentage={paidPct} color={colors.primary} />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("pay.pendingPayment")}</Text>
                      <Text style={{ color: colors.warning }} className="text-xs font-bold">{formatAmount(pending)}</Text>
                    </View>
                    <AnimatedBar percentage={pendingPct} color={colors.warning} />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("pay.estimatedTotal")}</Text>
                      <Text style={{ color: colors.success }} className="text-xs font-bold">{formatAmount(total)}</Text>
                    </View>
                    <AnimatedBar percentage={100} color={colors.success} />
                  </View>
                </>
              );
            })()}

            <View style={{ borderColor: colors.border }} className="mt-2 pt-2 border-t gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text style={{ color: colors.textSecondary }} className="text-sm">{t("pay.receivedTotal")} ({summary?.paidCount || 0})</Text>
                <Text style={{ color: colors.primary }} className="text-base font-bold">{formatAmount(summary?.paidTotal || 0)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text style={{ color: colors.textSecondary }} className="text-sm">{t("pay.pendingTotal")} ({summary?.pendingCount || 0})</Text>
                <Text style={{ color: colors.warning }} className="text-base font-bold">{formatAmount(summary?.pendingTotal || 0)}</Text>
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <Text style={{ color: colors.textSecondary }} className="text-sm">{t("pay.estimatedCash")}</Text>
                <Text style={{ color: colors.success }} className="text-lg font-bold">{formatAmount(summary?.total || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }} className="rounded-xl border p-3 flex-1 min-h-[500px]">
          <Text style={{ color: colors.text }} className="text-xs font-bold mb-3">{t("pay.list")}</Text>

          <View className="flex-row flex-wrap gap-2 mb-3 items-center">
            <View style={{ backgroundColor: colors.bgCard, borderColor: colors.border }} className="flex-row items-center h-8 rounded-lg px-2">
              <Ionicons name="search-outline" size={14} color={colors.textMuted} />
              <TextInput
                style={{ color: colors.text }}
                className="w-28 text-xs ml-1.5"
                placeholder={t("pay.search")}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {(["all", "gun", "hafta", "ay"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                className={`px-3 h-8 rounded-lg items-center justify-center ${
                  timeFilter === f ? "" : "border"
                }`}
                style={timeFilter === f ? { backgroundColor: colors.primary } : { backgroundColor: colors.bgCard, borderColor: colors.border }}
                onPress={() => setTimeFilter(f)}
              >
                <Text className="text-xs font-medium" style={{ color: timeFilter === f ? "white" : colors.textSecondary }}>
                  {f === "all" ? t("pay.all") : f === "gun" ? t("pay.today") : f === "hafta" ? t("pay.thisWeek") : t("pay.thisMonth")}
                </Text>
              </TouchableOpacity>
            ))}

            <View className="relative">
              <TouchableOpacity
                style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
                className="flex-row items-center h-8 px-3 rounded-lg"
                onPress={() => setStatusDropdownOpen(true)}
              >
                <Text style={{ color: colors.text }} className="text-xs mr-2">
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
              className="h-8 w-8 rounded-lg items-center justify-center"
              onPress={() => {
                setTimeFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
                fetchData();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Modal visible={statusDropdownOpen} transparent animationType="fade">
            <TouchableOpacity
              className="flex-1 justify-center items-center bg-black/40"
              activeOpacity={1}
              onPress={() => setStatusDropdownOpen(false)}
            >
              <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-64 p-4">
                <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">{t("pay.selectStatus")}</Text>
                {statusOptions.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    className="px-3 py-3 border-b"
                    style={{ borderColor: colors.border, backgroundColor: statusFilter === s.value ? colors.primary + '15' : 'transparent' }}
                    onPress={() => {
                      setStatusFilter(s.value as any);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Text className="text-sm" style={{ color: statusFilter === s.value ? colors.primary : colors.text }}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{ backgroundColor: colors.bgInput }}
                  className="mt-3 h-10 rounded-lg items-center justify-center"
                  onPress={() => setStatusDropdownOpen(false)}
                >
                  <Text style={{ color: colors.textSecondary }} className="font-medium">{t("pay.cancel")}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <ScrollView style={{ maxHeight: 500 }} indicatorStyle={colors.indicatorBg}>
            {filteredServices.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted }} className="text-sm mt-3">{t("pay.noRecords")}</Text>
              </View>
            ) : (
              pagedServices.map((s) => (
                <View
                  key={s.id}
                  style={{ borderColor: colors.border }}
                  className="flex-row items-center justify-between px-1 py-2.5 border-b"
                >
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-sm font-medium">{s.customer}</Text>
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">{s.serviceType || t("pay.serviceReport")} · {s.tarih}</Text>
                  </View>

                  <Text style={{ color: colors.text }} className="text-sm font-semibold mr-3">{formatAmount(s.amount)}</Text>

                  <TouchableOpacity
                    className="flex-row items-center rounded-lg px-2 py-1"
                    style={{ backgroundColor: s.paid ? colors.success + '15' : colors.warning + '15' }}
                    onPress={() => setToggleAlert({ visible: true, record: s })}
                  >
                    <Ionicons name={s.paid ? "checkmark-circle" : "time"} size={12} color={s.paid ? colors.success : colors.warning} />
                    <Text className="text-xs font-medium ml-1" style={{ color: s.paid ? colors.success : colors.warning }}>
                      {s.paid ? t("pay.paid") : t("pay.pending")}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {listTotalPages > 1 && (
            <View className="flex-row items-center justify-center gap-3 mt-3 pt-3" style={{ borderColor: colors.border, borderTopWidth: 1 }}>
              <TouchableOpacity
                disabled={listPage === 0}
                onPress={() => setListPage(listPage - 1)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: listPage === 0 ? colors.bgInput : colors.primary, opacity: listPage === 0 ? 0.5 : 1 }}
              >
                <Text className="text-sm" style={{ color: "white" }}>{t("pay.previous")}</Text>
              </TouchableOpacity>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {listPage + 1} / {listTotalPages}
              </Text>
              <TouchableOpacity
                disabled={listPage >= listTotalPages - 1}
                onPress={() => setListPage(listPage + 1)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: listPage >= listTotalPages - 1 ? colors.bgInput : colors.primary, opacity: listPage >= listTotalPages - 1 ? 0.5 : 1 }}
              >
                <Text className="text-sm" style={{ color: "white" }}>{t("pay.next")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>

      <CustomAlert
        visible={toggleAlert.visible}
        type="confirm"
        title={toggleAlert.record?.paid ? t("dash.confirmRevert") : t("dash.confirmMarkPaid")}
        message={toggleAlert.record?.paid
          ? t("dash.confirmRevertMessage", { name: toggleAlert.record?.customer || "" })
          : t("dash.confirmMarkPaidMessage", { name: toggleAlert.record?.customer || "" })
        }
        onClose={() => setToggleAlert({ visible: false, record: null })}
        onConfirm={() => {
          if (toggleAlert.record) handleTogglePaid(toggleAlert.record);
        }}
        confirmText={t("common.confirm")}
      />
    </ScrollView>
  );
}
