import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, Platform, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuotes } from "./QuoteContext";
import QuoteActionsMenu from "./modals/QuoteActionsMenu";
import type { QuoteRecord } from "../../apiclient/quotes";
import type { QuoteFilter } from "./types";
import { getCurrencySymbol, round2, formatMoney } from "./types";
import { useCurrency } from "../../contexts/CurrencyContext";
import { convertToTry } from "../../utils/currencyRates";

const FILTERS: QuoteFilter[] = ["all", "gun", "ay", "yil"];
const PAGE_SIZE = 15;

/**
 * Masaustu satir islemi: 32px dokunma alani, ustune gelince vurgu ve tarayicinin
 * kendi ipucu balonu (title). Liste kaydirma alaninin icinde kirpilmasin diye
 * ozel bir balon yerine yerel title kullanilir.
 */
function RowAction({ icon, color, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const ref = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === "web" && ref.current?.setAttribute) ref.current.setAttribute("title", label);
  }, [label]);
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }: any) => ({
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hovered || pressed ? colors.bgInput : "transparent",
      })}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

export default function QuoteRecordsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const { convert: convertTry } = useCurrency();
  const [page, setPage] = useState(0);
  const {
    filteredRecords,
    filter,
    setFilter,
    filterDate,
    setFilterDate,
    filterCustomer,
    setFilterCustomer,
    resetFilters,
    refreshRecords,
    handleShare,
    handleView,
    openQuotePDF,
    handleEdit,
    handleDuplicate,
    setDeleteAlert,
  } = useQuotes();

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pagedRecords = filteredRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [filter, filterDate, filterCustomer]);

  const changePage = (delta: number) => {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p + delta)));
  };

  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsRecord, setActionsRecord] = useState<QuoteRecord | null>(null);

  const filterLabel = (f: QuoteFilter) =>
    f === "all" ? t("qot.filterAll") : f === "gun" ? t("qot.filterDay") : f === "ay" ? t("qot.filterMonth") : t("qot.filterYear");

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("qot.allQuotes")}</Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={() => refreshRecords()}
          >
            <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{filteredRecords.length} {t("qot.showing")}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4 items-center">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            className="px-4 h-8 rounded-lg items-center justify-center"
            style={{
              backgroundColor: filter === f ? colors.primary : colors.bgCard,
              borderColor: colors.border,
              borderWidth: filter === f ? 0 : 1,
            }}
            onPress={() => setFilter(filter === f ? "all" : f)}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: filter === f ? "white" : colors.textSecondary }}
            >
              {filterLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs w-28"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("qot.filterDate")}
          placeholderTextColor={colors.textMuted}
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[140px]"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("qot.filterCustomer")}
          placeholderTextColor={colors.textMuted}
          value={filterCustomer}
          onChangeText={setFilterCustomer}
        />
        <TouchableOpacity onPress={resetFilters}>
          <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        {!compact && (
          <View className="flex-row px-3 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            <Text className="w-24 text-xs font-semibold" style={{ color: colors.textSecondary }}>{t("qot.colDate")}</Text>
            <Text className="flex-1 text-xs font-semibold" style={{ color: colors.textSecondary }}>{t("qot.colCustomer")}</Text>
            <Text className="w-28 text-xs font-semibold text-right" style={{ color: colors.textSecondary }}>{t("qot.colTotal")}</Text>
            <View className="w-44 ml-6" />
          </View>
        )}

        <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle={colors.indicatorBg as any}>
          {pagedRecords.map((k) => {
            const currencyTotals: Record<string, number> = {};
            (k.lines || []).forEach((l) => {
              const cur = l.currency || "TRY";
              currencyTotals[cur] = (currencyTotals[cur] || 0) + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
            });
            const totalLabels = Object.keys(currencyTotals)
              .map((cur) => `${round2(currencyTotals[cur]).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol(cur)}`)
              .join(" · ");
            const savedRates = k.tryRates && k.tryRates.rates && Object.keys(k.tryRates.rates).length ? k.tryRates : null;
            // Yalnizca TL iceren tekliflerde "≈ ... ₺" satiri ayni tutari tekrarlar; gosterilmez.
            const hasForeignCurrency = Object.keys(currencyTotals).some((c) => c !== "TRY");
            const totalTry = Object.entries(currencyTotals).reduce((s, [cur, val]) => {
              const conv = savedRates ? convertToTry(val, cur, savedRates) : convertTry(val, cur);
              return conv === null ? s : s + conv;
            }, 0);
            return compact ? (
              <View
                key={k.id}
                className="px-3 py-3 border-b"
                style={{ borderColor: colors.borderAlt }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-baseline flex-wrap gap-x-2">
                      <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{k.tarih}</Text>
                      <Text className="flex-1 text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>
                        {k.customer}
                      </Text>
                    </View>
                    {k.title ? (
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {k.title}
                      </Text>
                    ) : null}
                    <View className="mt-1">
                      <Text className="text-sm" style={{ color: colors.text }} numberOfLines={1}>
                        {totalLabels}
                      </Text>
                      {hasForeignCurrency && totalTry > 0 && (
                        <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                          ≈ {formatMoney(totalTry)} ₺
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    className="w-9 h-9 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.bgInput }}
                    onPress={() => {
                      setActionsRecord(k);
                      setActionsOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.more")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                key={k.id}
                className="flex-row items-center px-3 py-3 border-b"
                style={{ borderColor: colors.borderAlt }}
              >
                <Text className="w-24 text-xs" style={{ color: colors.textSecondary }}>{k.tarih}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>
                    {k.customer}
                  </Text>
                  {k.title ? (
                    <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {k.title}
                    </Text>
                  ) : null}
                </View>
                <View className="w-28 items-end">
                  <Text className="text-xs text-right" style={{ color: colors.text }} numberOfLines={1}>
                    {totalLabels}
                  </Text>
                  {hasForeignCurrency && totalTry > 0 && (
                    <Text className="text-[10px] text-right mt-0.5" style={{ color: colors.textMuted }}>
                      ≈ {formatMoney(totalTry)} ₺
                    </Text>
                  )}
                </View>
                {/* Tum islemler gorunur; Sil yanlislikla tiklanmasin diye en sonda, ayirici cizgiyle ayri (onay da sorar). */}
                <View className="ml-6 flex-row items-center justify-end gap-1">
                  <RowAction icon="eye-outline" color={colors.primary} label={t("qot.preview")} onPress={() => handleView(k)} />
                  <RowAction icon="create-outline" color={colors.teal} label={t("common.edit")} onPress={() => handleEdit(k)} />
                  <RowAction icon="copy-outline" color={colors.textSecondary} label={t("qot.copy")} onPress={() => handleDuplicate(k)} />
                  <RowAction icon="download-outline" color={colors.warning} label={t("qot.downloadPdf")} onPress={() => openQuotePDF(k)} />
                  <RowAction icon="share-social-outline" color={colors.purple} label={t("qot.share")} onPress={() => handleShare(k)} />
                  <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 }} />
                  <RowAction icon="trash-outline" color={colors.danger} label={t("common.delete")} onPress={() => setDeleteAlert({ visible: true, record: k })} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {totalPages > 1 ? (
        <View className="flex-row items-center justify-center gap-3 mt-4">
          <TouchableOpacity
            disabled={page === 0}
            onPress={() => changePage(-1)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: page === 0 ? colors.bgCard : colors.primary, opacity: page === 0 ? 0.5 : 1 }}
          >
            <Text className="text-sm" style={{ color: "white" }}>{t("qot.previous")}</Text>
          </TouchableOpacity>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {page + 1} / {totalPages}
          </Text>
          <TouchableOpacity
            disabled={page >= totalPages - 1}
            onPress={() => changePage(1)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: page >= totalPages - 1 ? colors.bgCard : colors.primary, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            <Text className="text-sm" style={{ color: "white" }}>{t("qot.next")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <QuoteActionsMenu
        record={actionsRecord}
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />
    </>
  );
}
