import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuotes } from "./QuoteContext";
import type { QuoteFilter } from "./types";

const FILTERS: QuoteFilter[] = ["all", "gun", "ay", "yil"];

export default function QuoteRecordsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
    setDeleteAlert,
  } = useQuotes();

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
        <View className="flex-row px-3 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="w-24 text-xs font-semibold" style={{ color: colors.textSecondary }}>{t("qot.colDate")}</Text>
          <Text className="flex-1 text-xs font-semibold" style={{ color: colors.textSecondary }}>{t("qot.colCustomer")}</Text>
          <Text className="w-24 text-xs font-semibold text-right" style={{ color: colors.textSecondary }}>{t("qot.colTotal")}</Text>
          <View className="w-28 flex-row items-center justify-end" />
        </View>

        <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle={colors.indicatorBg as any}>
          {filteredRecords.map((k) => {
            const sum = (k.lines || []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
            return (
              <View
                key={k.id}
                className="flex-row items-center px-3 py-3 border-b"
                style={{ borderColor: colors.borderAlt }}
              >
                <Text className="w-24 text-xs" style={{ color: colors.textSecondary }}>{k.tarih}</Text>
                <Text className="flex-1 text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>
                  {k.customer}
                </Text>
                <Text className="w-24 text-xs text-right" style={{ color: colors.text }} numberOfLines={1}>
                  {sum.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                </Text>
                <View className="w-28 flex-row items-center justify-end gap-2.5">
                  <TouchableOpacity onPress={() => handleShare(k)}>
                    <Ionicons name="share-social-outline" size={20} color={colors.purple} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteAlert({ visible: true, record: k })}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleView(k)}>
                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(k)}>
                    <Ionicons name="create-outline" size={20} color={colors.teal} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openQuotePDF(k)}>
                    <Ionicons name="download-outline" size={20} color={colors.warning} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}
