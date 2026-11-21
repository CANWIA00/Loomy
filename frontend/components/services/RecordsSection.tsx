import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useServices } from "./ServicesContext";
import RecordActionsMenu from "./modals/RecordActionsMenu";
import RowAction from "../RowAction";
import { formatMoney, parseNumericInput } from "../stock/format";
import type { ServiceRecord } from "../../apiclient/services";
import type { RecordFilter } from "./types";

const FILTERS: RecordFilter[] = ["all", "gun", "ay", "yil"];
const PAGE_SIZE = 15;

export default function RecordsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [page, setPage] = useState(0);
  const {
    filteredRecords,
    hasMoreRecords,
    loadMoreRecords,
    filter,
    setFilter,
    filterDate,
    setFilterDate,
    filterDocument,
    setFilterDocument,
    filterCustomer,
    setFilterCustomer,
    filterTemplate,
    setFilterTemplate,
    resetFilters,
    refreshRecords,
    handleShare,
    handleViewService,
    openServicePDF,
    handleEdit,
    handleDuplicate,
    setDeleteAlert,
    templates,
  } = useServices();

  // Imza / odeme durumu: renkli nokta + kisa etiket
  const StatusDot = ({ ok, okLabel, noLabel, noColor }: { ok: boolean; okLabel: string; noLabel: string; noColor: string }) => (
    <View className="flex-row items-center">
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ok ? colors.success : noColor }} />
      <Text className="text-[11px] font-medium ml-1" style={{ color: ok ? colors.success : noColor }}>{ok ? okLabel : noLabel}</Text>
    </View>
  );
  const amountOf = (k: ServiceRecord) => formatMoney(parseNumericInput(k.ucret || "0"), k.ucretCurrency || "TRY");

  useEffect(() => {
    setPage(0);
  }, [filter, filterDate, filterDocument, filterCustomer, filterTemplate]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pagedRecords = filteredRecords.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const changePage = (delta: number) => {
    setPage((p) => Math.max(0, Math.min(totalPages - 1, p + delta)));
  };

  const [templateFilterOpen, setTemplateFilterOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsRecord, setActionsRecord] = useState<ServiceRecord | null>(null);

  const filterLabel = (f: RecordFilter) =>
    f === "all" ? t("svc.filterAll") : f === "gun" ? t("svc.filterDay") : f === "ay" ? t("svc.filterMonth") : t("svc.filterYear");

  const columns: { label: string; className: string }[] = [
    { label: t("svc.colDate"), className: "w-24" },
    { label: t("svc.colCustomer"), className: "flex-1" },
    { label: t("svc.colTemplate"), className: "w-32" },
    { label: t("svc.colAmount"), className: "w-28 text-right" },
    { label: t("svc.colStatus"), className: "w-28 ml-6" },
    { label: "", className: "w-60 ml-2" },
  ];

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("svc.allRecords")}</Text>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={() => refreshRecords()}
          >
            <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{filteredRecords.length} {t("svc.showing")}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4 items-center">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            className={`px-4 h-8 rounded-lg items-center justify-center ${filter === f ? "" : "border"}`}
            style={{
              backgroundColor: filter === f ? colors.primary : colors.bgCard,
              borderColor: colors.border,
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
        <TouchableOpacity
          className="h-8 rounded-lg px-3 flex-row items-center"
          style={{
            backgroundColor: filterTemplate ? colors.primary + "1A" : colors.bgCard,
            borderColor: filterTemplate ? colors.primary : colors.border,
            borderWidth: 1,
          }}
          onPress={() => setTemplateFilterOpen(true)}
        >
          <Text className="text-xs font-medium mr-1 max-w-[120px]" numberOfLines={1} style={{ color: filterTemplate ? colors.primary : colors.textSecondary }}>
            {filterTemplate || t("svc.allTemplates")}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs w-28"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterDate")}
          placeholderTextColor={colors.textMuted}
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterDocName")}
          placeholderTextColor={colors.textMuted}
          value={filterDocument}
          onChangeText={setFilterDocument}
        />
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterCustomer")}
          placeholderTextColor={colors.textMuted}
          value={filterCustomer}
          onChangeText={setFilterCustomer}
        />
        <TouchableOpacity onPress={resetFilters}>
          <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={templateFilterOpen} transparent animationType="fade" onRequestClose={() => setTemplateFilterOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.colTemplate")}</Text>
              <TouchableOpacity onPress={() => setTemplateFilterOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView nestedScrollEnabled className="max-h-80" indicatorStyle={colors.indicatorBg as any}>
              <TouchableOpacity
                className="flex-row items-center px-3 py-3"
                onPress={() => {
                  setFilterTemplate("");
                  setTemplateFilterOpen(false);
                }}
              >
                <Ionicons name={!filterTemplate ? "radio-button-on" : "radio-button-off"} size={18} color={!filterTemplate ? colors.primary : colors.textMuted} />
                <Text className="text-sm ml-3" style={{ color: colors.text }}>{t("svc.allTemplates")}</Text>
              </TouchableOpacity>
              {templates.map((tpl, i) => {
                const active = filterTemplate === tpl.name;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    className="flex-row items-center px-3 py-3"
                    style={i < templates.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                    onPress={() => {
                      setFilterTemplate(tpl.name);
                      setTemplateFilterOpen(false);
                    }}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? colors.primary : colors.textMuted} />
                    <Text className="text-sm ml-3 flex-1" style={{ color: colors.text }} numberOfLines={1}>{tpl.name}</Text>
                    {tpl.isDefault && <Ionicons name="star" size={14} color={colors.warning} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        {!compact && (
          <View className="flex-row px-3 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            {columns.map((col, i) => (
              <Text
                key={i}
                className={`text-xs font-semibold ${col.className}`}
                style={{ color: colors.textSecondary }}
              >
                {col.label}
              </Text>
            ))}
          </View>
        )}

        <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle={colors.indicatorBg as any}>
          {pagedRecords.map((k) =>
            compact ? (
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
                    <View className="mt-1">
                      <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={2}>
                        {k.service}
                      </Text>
                      {k.usedProducts && k.usedProducts.length > 0 && (
                        <Text className="text-[10px] mt-0.5" numberOfLines={1} style={{ color: colors.teal }}>
                          {k.usedProducts.map((p) => `${p.name} x${p.quantity}`).join(", ")}
                        </Text>
                      )}
                      {k.usedProducts && k.usedProducts.some((p) => p.inStock === false) && (
                        <Text className="text-[9px] mt-0.5" style={{ color: colors.warning }}>
                          {t("svc.notInStockCount").replace("{count}", String(k.usedProducts.filter((p) => p.inStock === false).length))}
                        </Text>
                      )}
                    </View>
                    <Text className="text-sm font-semibold mt-1.5" style={{ color: colors.text }}>{amountOf(k)}</Text>
                    <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <StatusDot ok={!!k.imzali} okLabel={t("svc.signed")} noLabel={t("svc.unsigned")} noColor={colors.warning} />
                      <StatusDot ok={!!k.odendi} okLabel={t("svc.paid")} noLabel={t("svc.unpaid")} noColor={colors.danger} />
                      <View
                        className="px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: k.templateName ? colors.purple + "1A" : colors.bgInput }}
                      >
                        <Text className="text-[10px] font-medium" numberOfLines={1} style={{ color: k.templateName ? colors.purple : colors.textMuted }}>
                          {k.templateName || t("svc.noTemplate")}
                        </Text>
                      </View>
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
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>{k.customer}</Text>
                  <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>{k.service}</Text>
                  {k.usedProducts && k.usedProducts.length > 0 && (
                    <Text className="text-[10px] mt-0.5" numberOfLines={1} style={{ color: colors.teal }}>
                      {k.usedProducts.map((p) => `${p.name} x${p.quantity}`).join(", ")}
                    </Text>
                  )}
                  {k.usedProducts && k.usedProducts.some((p) => p.inStock === false) && (
                    <Text className="text-[9px] mt-0.5" style={{ color: colors.warning }}>
                      {t("svc.notInStockCount").replace("{count}", String(k.usedProducts.filter((p) => p.inStock === false).length))}
                    </Text>
                  )}
                </View>
                <View className="w-32 pr-2">
                  <View
                    className="self-start px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: k.templateName ? colors.purple + "1A" : colors.bgInput }}
                  >
                    <Text className="text-[10px] font-medium" numberOfLines={1} style={{ color: k.templateName ? colors.purple : colors.textMuted }}>
                      {k.templateName || t("svc.noTemplate")}
                    </Text>
                  </View>
                </View>
                <Text className="w-28 text-xs text-right font-semibold" style={{ color: colors.text }} numberOfLines={1}>{amountOf(k)}</Text>
                <View className="w-28 ml-6 gap-1">
                  <StatusDot ok={!!k.imzali} okLabel={t("svc.signed")} noLabel={t("svc.unsigned")} noColor={colors.warning} />
                  <StatusDot ok={!!k.odendi} okLabel={t("svc.paid")} noLabel={t("svc.unpaid")} noColor={colors.danger} />
                </View>
                {/* Tum islemler gorunur; Sil yanlislikla tiklanmasin diye en sonda, ayirici cizgiyle ayri (onay da sorar). */}
                <View className="w-60 ml-2 flex-row items-center justify-end gap-1">
                  <RowAction icon="eye-outline" color={colors.primary} label={t("svc.preview")} onPress={() => handleViewService(k)} />
                  <RowAction icon="create-outline" color={colors.teal} label={t("common.edit")} onPress={() => handleEdit(k)} />
                  <RowAction icon="copy-outline" color={colors.textSecondary} label={t("svc.copy")} onPress={() => handleDuplicate(k)} />
                  <RowAction icon="download-outline" color={colors.warning} label={t("svc.downloadPdf")} onPress={() => openServicePDF(k)} />
                  <RowAction icon="share-social-outline" color={colors.purple} label={t("svc.share")} onPress={() => handleShare(k)} />
                  <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 4 }} />
                  <RowAction icon="trash-outline" color={colors.danger} label={t("common.delete")} onPress={() => setDeleteAlert({ visible: true, record: k })} />
                </View>
              </View>
            )
          )}
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
            <Text className="text-sm" style={{ color: "white" }}>{t("svc.previous")}</Text>
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
            <Text className="text-sm" style={{ color: "white" }}>{t("svc.next")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {hasMoreRecords && (
        <TouchableOpacity
          className="h-10 rounded-lg items-center justify-center mt-3"
          style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
          onPress={loadMoreRecords}
        >
          <Text style={{ color: colors.primary }} className="font-semibold text-sm">{t("svc.loadMore")}</Text>
        </TouchableOpacity>
      )}

      <RecordActionsMenu
        record={actionsRecord}
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />
    </>
  );
}
