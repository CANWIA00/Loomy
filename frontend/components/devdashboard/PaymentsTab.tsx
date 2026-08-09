import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";
import { MONTHLY_FEE, formatDate, paymentInfo } from "./types";

export default function PaymentsTab() {
  const { colors } = useTheme();
  const { companies, paymentStats } = useDevDashboard();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.textMuted }} className="text-sm">
          {companies.length} müşteri · Aylık sabit ücret: {MONTHLY_FEE} TL
        </Text>
      </View>

      <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: "Beklenen Aylık Gelir", value: `${(companies.length * MONTHLY_FEE).toLocaleString("tr-TR")} TL`, icon: "wallet", color: colors.primary },
            { label: "Ödeme Alındı", value: `${paymentStats.paid} müşteri`, icon: "checkmark-circle", color: colors.success },
            { label: "Gecikmiş Ödeme", value: `${paymentStats.overdue} müşteri`, icon: "alert-circle", color: colors.danger },
            { label: "Ödeme Alınmadı", value: `${paymentStats.neverPaid} müşteri`, icon: "time", color: colors.warning },
            { label: "Yakında Doluyor", value: `${paymentStats.expiringSoon} müşteri`, icon: "hourglass", color: colors.teal },
          ].map((s) => (
            <View key={s.label} className="rounded-xl p-3 flex-1 min-w-[160px]" style={{ backgroundColor: colors.bgCard2 }}>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name={s.icon as any} size={14} color={s.color} />
                <Text style={{ color: colors.textMuted }} className="text-xs">
                  {s.label}
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="text-lg font-bold">
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
        {companies.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="card-outline" size={36} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-sm mt-3">
              Ödeme kaydı yok
            </Text>
          </View>
        ) : (
          companies.map((c, idx) => {
            const payInfo = paymentInfo(c.paidUntil);
            return (
              <View
                key={c.id}
                className="flex-row items-center px-4 py-3"
                style={idx < companies.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
              >
                <View className="flex-1 mr-2">
                  <Text style={{ color: colors.text }} className="font-semibold">{c.name}</Text>
                  <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                    {c.paidUntil ? `Son ödeme: ${formatDate(c.paidUntil)}` : "Henüz ödeme yok"}
                  </Text>
                </View>
                <Text style={{ color: colors.text }} className="font-semibold mr-3">{MONTHLY_FEE} TL</Text>
                <View
                  className="rounded-lg px-2 py-1"
                  style={{ backgroundColor: (payInfo.paid ? colors.success : colors.danger) + "15" }}
                >
                  <Text style={{ color: payInfo.paid ? colors.success : colors.danger, fontSize: 11, fontWeight: "700" }}>
                    {payInfo.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}
