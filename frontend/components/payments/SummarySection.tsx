import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePayments } from "./PaymentsContext";
import AnimatedBar from "./AnimatedBar";

export default function SummarySection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { summary, formatAmount } = usePayments();

  const total = summary?.total || 0;
  const paid = summary?.paidTotal || 0;
  const pending = summary?.pendingTotal || 0;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  return (
    <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <View style={{ backgroundColor: colors.warning + '15' }} className="w-10 h-10 rounded-xl items-center justify-center">
          <Ionicons name="card" size={20} color={colors.warning} />
        </View>
        <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("pay.status")}</Text>
      </View>

      <View className="flex-col gap-3">
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
  );
}
