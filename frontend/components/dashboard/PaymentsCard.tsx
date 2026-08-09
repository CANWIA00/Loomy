import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDashboard } from "./DashboardContext";

export default function PaymentsCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { paymentSummary, recentPayments, setToggleAlert } = useDashboard();

  return (
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
            <ScrollView className="max-h-64" nestedScrollEnabled indicatorStyle={colors.indicatorBg as any}>
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
  );
}
