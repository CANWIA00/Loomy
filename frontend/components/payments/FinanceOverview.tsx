import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { financeApi, type FinanceOverview as FinanceOverviewData, type FinanceTimeline } from "../../apiclient/finance";
import { formatMoney } from "../stock/format";
import FinanceChart, { type FinanceChartSeries } from "./FinanceChart";

function sumToTry(map: Record<string, number>, convert: (a: number, c: string) => number | null): number | null {
  let missing = false;
  let total = 0;
  for (const [cur, val] of Object.entries(map)) {
    const conv = convert(val, cur);
    if (conv == null) {
      missing = true;
      continue;
    }
    total += conv;
  }
  return missing ? null : total;
}

function breakdown(map: Record<string, number>): string {
  const parts = Object.entries(map)
    .map(([cur, val]) => formatMoney(val, cur));
  return parts.length ? parts.join(" + ") : "";
}

function seriesToTry(
  map: Record<string, number[]>,
  convert: (a: number, c: string) => number | null,
  length: number
): number[] | null {
  let missing = false;
  const arr: number[] = new Array(length).fill(0);
  for (const [cur, vals] of Object.entries(map)) {
    for (let i = 0; i < length; i++) {
      const conv = convert(vals[i] || 0, cur);
      if (conv == null) {
        missing = true;
        break;
      }
      arr[i] += conv;
    }
  }
  return missing ? null : arr;
}

export default function FinanceOverview() {
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const { convert, loading: ratesLoading } = useCurrency();

  const [data, setData] = useState<FinanceOverviewData | null>(null);
  const [timeline, setTimeline] = useState<FinanceTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string | null>(currentPeriod);
  const [pickerYear, setPickerYear] = useState<number>(now.getFullYear());

  const load = useCallback(async (month?: string | null) => {
    try {
      setLoading(true);
      const [overviewRes, timelineRes] = await Promise.all([
        financeApi.getOverview(month ?? undefined),
        financeApi.getTimeline(12),
      ]);
      setData(overviewRes.data);
      setTimeline(timelineRes.data);
    } catch {
      setData(null);
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedMonth);
  }, [load, selectedMonth]);

  const stockTry = data ? sumToTry(data.stockByCurrency, convert) : null;
  const expenseTry = data ? sumToTry(data.expenseByCurrency, convert) : null;
  const paid = data?.paidTotal || 0;
  const pending = data?.pendingTotal || 0;

  const stockStr = stockTry != null ? formatMoney(stockTry, "TRY") : (data && breakdown(data.stockByCurrency)) || "-";
  const expenseStr = expenseTry != null ? formatMoney(expenseTry, "TRY") : (data && breakdown(data.expenseByCurrency)) || "-";

  const net =
    stockTry != null && expenseTry != null ? stockTry + paid + pending - expenseTry : null;
  const netStr = net != null ? formatMoney(net, "TRY") : "-";

  const periods = timeline?.periods || [];
  const stockSeries = timeline ? seriesToTry(timeline.stockByCurrency, convert, periods.length) : null;
  const expenseSeries = timeline ? seriesToTry(timeline.expenseByCurrency, convert, periods.length) : null;
  const chartSeries: FinanceChartSeries[] | null =
    !ratesLoading && timeline && stockSeries && expenseSeries
      ? [
          { name: t("pay.financeStock"), color: colors.teal, values: stockSeries },
          { name: t("pay.financeExpense"), color: colors.danger, values: expenseSeries },
          { name: t("pay.financePending"), color: colors.warning, values: timeline.pending },
          { name: t("pay.financePaid"), color: colors.blue, values: timeline.received },
        ]
      : null;

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    (data?.availablePeriods || []).forEach((p) => {
      const y = Number(p.slice(0, 4));
      if (Number.isFinite(y)) yearsSet.add(y);
    });
    if (selectedMonth) {
      const y = Number(selectedMonth.slice(0, 4));
      if (Number.isFinite(y)) yearsSet.add(y);
    }
    yearsSet.add(now.getFullYear());
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [data?.availablePeriods, selectedMonth]);

  if (loading) {
    return (
      <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <View style={{ backgroundColor: colors.teal + "15" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="analytics" size={20} color={colors.teal} />
          </View>
          <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("pay.financeTitle")}</Text>
        </View>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <View style={{ backgroundColor: colors.teal + "15" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Ionicons name="analytics" size={20} color={colors.teal} />
          </View>
          <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("pay.financeTitle")}</Text>
        </View>
        <Text className="text-sm" style={{ color: colors.textMuted }}>{t("pay.financeError")}</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-1">
        <View style={{ backgroundColor: colors.teal + "15" }} className="w-10 h-10 rounded-xl items-center justify-center">
          <Ionicons name="analytics" size={20} color={colors.teal} />
        </View>
        <Text style={{ color: colors.text }} className="text-lg font-bold ml-3">{t("pay.financeTitle")}</Text>
        <TouchableOpacity onPress={() => load(selectedMonth)} className="ml-auto p-1">
          <Ionicons name="refresh" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {selectedMonth ? fullMonthLabel(selectedMonth, locale) : t("pay.financeAllTime")}
          </Text>
          <MonthChip
            label={t("common.all")}
            active={selectedMonth === null}
            onPress={() => setSelectedMonth(null)}
          />
        </View>

        <View className="rounded-xl p-3" style={{ backgroundColor: colors.bgCard2 }}>
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={() => setPickerYear((y) => Math.max(years[years.length - 1], y - 1))}
              disabled={pickerYear <= years[years.length - 1]}
              className="p-1"
              accessibilityLabel={t("pay.financePrevYear")}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={pickerYear <= years[years.length - 1] ? colors.border : colors.textSecondary}
              />
            </TouchableOpacity>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>{pickerYear}</Text>
            <TouchableOpacity
              onPress={() => setPickerYear((y) => Math.min(years[0], y + 1))}
              disabled={pickerYear >= years[0]}
              className="p-1"
              accessibilityLabel={t("pay.financeNextYear")}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={pickerYear >= years[0] ? colors.border : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {[0, 1, 2, 3].map((row) => (
            <View key={row} className="flex-row gap-2 mb-2">
              {[0, 1, 2].map((col) => {
                const monthNum = row * 3 + col;
                const period = `${pickerYear}-${String(monthNum + 1).padStart(2, "0")}`;
                return (
                  <MonthGridCell
                    key={period}
                    label={monthName(monthNum, locale)}
                    active={selectedMonth === period}
                    hasData={(data?.availablePeriods || []).includes(period)}
                    onPress={() => setSelectedMonth(period)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {ratesLoading || stockTry == null || expenseTry == null ? (
        <Text className="text-[11px] mb-3" style={{ color: colors.textMuted }}>{t("pay.financeNoRates")}</Text>
      ) : (
        <Text className="text-[11px] mb-3" style={{ color: colors.textMuted }}>{t("pay.financeTryNote")}</Text>
      )}
      <Text className="text-[10px] mb-3" style={{ color: colors.textMuted }}>{t("pay.financeSignNote")}</Text>

      {chartSeries ? (
        <FinanceChart periods={periods} series={chartSeries} />
      ) : null}

      <View style={{ borderColor: colors.border }} className="border rounded-xl overflow-hidden mt-3">
        <Row
          label={t("pay.financeStock")}
          value={stockStr}
          icon="cube-outline"
          color={colors.teal}
          sub={t("pay.financeStockSub")}
          sign="+"
        />
        <Row
          label={t("pay.financeExpense")}
          value={expenseStr}
          icon="receipt-outline"
          color={colors.danger}
          sub={t("pay.financeExpenseSub")}
          sign="-"
        />
        <Row
          label={t("pay.financePending")}
          value={formatMoney(pending, "TRY")}
          icon="trending-up-outline"
          color={colors.warning}
          sub={t("pay.financePendingSub", { count: String((data.pendingCount || 0)) })}
          sign="+"
        />
        <Row
          label={t("pay.financePaid")}
          value={formatMoney(paid, "TRY")}
          icon="cash-outline"
          color={colors.blue}
          sub={t("pay.financePaidSub", { count: String(data.paidCount || 0) })}
          sign="+"
        />
        <View className="flex-row items-center justify-between px-3 py-2.5"
          style={{ backgroundColor: colors.bgCard2 }}>
          <View className="flex-row items-center flex-1">
            <Ionicons name="wallet-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
            <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("pay.financeNet")}</Text>
          </View>
          <Text className="text-base font-bold" style={{ color: net != null && net < 0 ? colors.danger : colors.success }}>
            {net != null ? "= " : ""}{netStr}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3 mt-3">
        <View className="flex-1 min-w-[140px]">
          <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("pay.financePerCurrency")}</Text>
          <Text className="text-[11px]" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {t("pay.financeStock")}: {data && breakdown(data.stockByCurrency) || "-"}
          </Text>
          <Text className="text-[11px]" style={{ color: colors.textSecondary }} numberOfLines={2}>
            {t("pay.financeExpense")}: {data && breakdown(data.expenseByCurrency) || "-"}
          </Text>
        </View>
        <View className="flex-1 min-w-[140px]">
          <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("pay.financeCurSrc")}</Text>
          <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
            {t("pay.financeRatesNote")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  sub,
  icon,
  color,
  sign,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  sign?: "+" | "-";
}) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center justify-between px-3 py-2.5"
      style={{ backgroundColor: colors.bgCard }}>
      <View className="flex-row items-center flex-1">
        <Ionicons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
        <View className="flex-1">
          <Text className="text-sm font-medium" style={{ color: colors.text }}>{label}</Text>
          <Text className="text-[10px]" style={{ color: colors.textMuted }}>{sub}</Text>
        </View>
      </View>
      <View className="flex-row items-center ml-2">
        {sign ? (
          <Text
            className="text-sm font-bold mr-1"
            style={{ color }}
          >
            {sign}
          </Text>
        ) : null}
        <Text className="text-sm font-bold" style={{ color }} numberOfLines={2} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
    </View>
  );
}

function monthName(monthIndex: number, locale: string): string {
  return new Date(2026, monthIndex, 1).toLocaleDateString(locale === "tr" ? "tr-TR" : locale, {
    month: "long",
  });
}

function fullMonthLabel(period: string, locale: string): string {
  const [y, m] = period.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(locale === "tr" ? "tr-TR" : locale, {
    month: "long",
    year: "numeric",
  });
}

function MonthGridCell({
  label,
  active,
  hasData,
  onPress,
}: {
  label: string;
  active: boolean;
  hasData: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 rounded-xl py-2 items-center"
      style={{
        backgroundColor: active ? colors.primary + "1A" : colors.bgInput,
        borderWidth: 1,
        borderColor: active ? colors.primary + "66" : hasData ? colors.border : colors.borderAlt,
        opacity: hasData ? 1 : 0.45,
      }}
    >
      <Text className="text-[11px] font-semibold" style={{ color: active ? colors.primary : colors.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MonthChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-full px-3 py-1.5"
      style={{
        backgroundColor: active ? colors.primary + "1A" : colors.bgInput,
        borderWidth: 1,
        borderColor: active ? colors.primary + "66" : colors.border,
      }}
    >
      <Text className="text-xs font-semibold" style={{ color: active ? colors.primary : colors.textSecondary }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}