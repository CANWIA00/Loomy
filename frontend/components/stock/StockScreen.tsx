import { useEffect, useCallback, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import ScreenHeader from "../ScreenHeader";
import CustomAlert from "../CustomAlert";
import { stockApi, type StockItem, type StockItemDetail, type InvoiceRecord, type StockItemInput } from "../../apiclient/stock";
import { formatMoney, formatQty, formatDate } from "./format";
import StockFormModal from "./StockFormModal";
import StockDetailModal from "./StockDetailModal";
import InvoiceImportModal from "./InvoiceImportModal";
import InvoiceDetailModal from "./InvoiceDetailModal";

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "confirm";
  title: string;
  message: string;
  confirmColor?: string;
  confirmText?: string;
  onConfirm?: () => void;
};

const emptyAlert: AlertState = { visible: false, type: "success", title: "", message: "" };

export default function StockScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { rates } = useCurrency();

  const [mode, setMode] = useState<"items" | "invoices">("items");
  const [itemFilter, setItemFilter] = useState<"all" | "low">("all");

  const [items, setItems] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalByCurrency, setTotalByCurrency] = useState<Record<string, number>>({});

  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formItem, setFormItem] = useState<StockItem | null>(null);
  const [importVisible, setImportVisible] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceRecord | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(emptyAlert);

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoicePage, setInvoicePage] = useState(0);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesEnd, setInvoicesEnd] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 20;

  const loadItems = useCallback(
    async (pageNum = 0, q = search) => {
      setLoading(true);
      try {
        const res = await stockApi.list(q || undefined, pageNum, PAGE_SIZE, itemFilter === "low");
        setItems(res.data.content);
        setPage(res.data.number);
        setTotalPages(res.data.totalPages);
        setTotalProducts(res.data.totalProducts);
        setLowStockCount(res.data.lowStockCount);
        setTotalByCurrency(res.data.totalByCurrency);
      } catch {
        setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, itemFilter]
  );

  useEffect(() => {
    if (mode !== "items") return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadItems(0, search), 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, mode, loadItems]);

  const loadInvoices = useCallback(
    async (page = 0, append = false) => {
      setInvoicesLoading(true);
      try {
        const res = await stockApi.listInvoices(page, 20);
        if (append) {
          setInvoices((prev) => [...prev, ...res.data.content]);
        } else {
          setInvoices(res.data.content);
        }
        setInvoiceTotal(res.data.totalElements);
        setInvoicesEnd(page * 20 + res.data.content.length >= res.data.totalElements);
      } catch {
        setAlert({ visible: true, type: "error", title: t("stock.invoices"), message: t("stock.loading") });
      } finally {
        setInvoicesLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (mode === "invoices") loadInvoices(0, false);
  }, [mode, loadInvoices]);

  const openDetail = async (item: StockItem) => {
    try {
      const res = await stockApi.get(item.id);
      setDetail(res.data);
      setDetailVisible(true);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const handleFormSubmit = async (data: StockItemInput) => {
    try {
      if (formItem) {
        await stockApi.update(formItem.id, data);
      } else {
        await stockApi.create(data);
      }
      setFormVisible(false);
      setFormItem(null);
      await loadItems(page, search);
      setAlert({
        visible: true,
        type: "success",
        title: t("stock.title"),
        message: formItem ? t("stock.update") : t("stock.save"),
      });
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const handleAdjust = async (target: StockItemDetail, change: number, note: string) => {
    setAdjusting(true);
    try {
      await stockApi.addTransaction(target.id, { change, note: note || undefined });
      await loadItems(page, search);
      const refreshed = (await stockApi.get(target.id)).data;
      setDetail(refreshed);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    } finally {
      setAdjusting(false);
    }
  };

  const doDelete = async (target: StockItemDetail) => {
    setDetailVisible(false);
    setAlert(emptyAlert);
    try {
      await stockApi.remove(target.id);
      await loadItems(page, search);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const doDeleteInvoice = async (inv: InvoiceRecord, revertStock: boolean) => {
    setInvoiceDetail(null);
    try {
      await stockApi.deleteInvoice(inv.id, revertStock);
      await loadItems(page, search);
      loadInvoices();
      setAlert({ visible: true, type: "success", title: t("stock.title"), message: t("stock.invoiceDeleted") });
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const handleToggleAlert = async (target: StockItemDetail) => {
    try {
      const updated = (await stockApi.update(target.id, { lowStockAlert: !target.lowStockAlert })).data;
      setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, lowStockAlert: updated.lowStockAlert } : i)));
      setDetail((prev) => (prev ? { ...prev, lowStockAlert: updated.lowStockAlert } : prev));
      await loadItems(page, search);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const searchQ = search.trim().toLowerCase();
  const currencyParts = Object.entries(totalByCurrency).map(([cur, val]) => formatMoney(val, cur));
  const usdRate = rates?.rates?.["USD"];
  const totalValueUsd =
    usdRate && usdRate > 0
      ? Object.entries(totalByCurrency).reduce((acc, [cur, val]) => {
          const r = rates?.rates?.[cur];
          return acc + (r ? (val * r) / usdRate : 0);
        }, 0)
      : null;
  const totalValueUsdStr = totalValueUsd != null ? formatMoney(totalValueUsd, "USD") : null;
  const totalValue = currencyParts.join(" + ");

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.bg }} className="flex-1" indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader title={t("stock.title")} subtitle={t("stock.subtitle")} />

          <View className="flex-row gap-2 mb-3">
            {(["items", "invoices"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: mode === m ? colors.primary : colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
                onPress={() => setMode(m)}
              >
                <Text style={{ color: mode === m ? "white" : colors.textSecondary }} className="font-semibold text-sm">
                  {m === "items" ? t("stock.allItems") : t("stock.invoices")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === "items" ? (
            <>
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  className="h-11 rounded-lg items-center justify-center px-4 flex-row gap-2"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => setImportVisible(true)}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="white" />
                  <Text style={{ color: "white" }} className="font-semibold text-sm">{t("stock.importInvoice")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-11 rounded-lg items-center justify-center px-4 flex-row gap-2"
                  style={{ backgroundColor: colors.success }}
                  onPress={() => { setFormItem(null); setFormVisible(true); }}
                >
                  <Ionicons name="add" size={18} color="white" />
                  <Text style={{ color: "white" }} className="font-semibold text-sm">{t("stock.addItem")}</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-2 mb-4">
                <View className="flex-1 min-w-[120px] rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.totalProducts")}</Text>
                  <Text className="text-lg font-bold" style={{ color: colors.text }}>{totalProducts}</Text>
                </View>
                <View className="flex-1 min-w-[120px] rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.lowStockCount")}</Text>
                  <Text className="text-lg font-bold" style={{ color: lowStockCount > 0 ? colors.warning : colors.text }}>{lowStockCount}</Text>
                </View>
                <View className="flex-1 min-w-[240px] rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.totalValue")}</Text>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    {totalValue || "-"}
                  </Text>
                  {totalValueUsdStr ? (
                    <Text className="text-[11px] mt-0.5" style={{ color: colors.primary }}>
                      {t("stock.totalUsd")}: {totalValueUsdStr}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="rounded-lg px-3 py-2.5 mb-3 flex-row items-center" style={{ backgroundColor: colors.bgInput }}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={t("stock.searchPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  className="flex-1 ml-2"
                  style={{ color: colors.text }}
                />
              </View>

              <View className="flex-row gap-2 mb-4">
                <TouchableOpacity
                  className="flex-1 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: itemFilter === "all" ? colors.primary : colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => { setItemFilter("all"); setPage(0); }}
                >
                  <Text style={{ color: itemFilter === "all" ? "white" : colors.textSecondary }} className="font-semibold text-xs">
                    {t("stock.allItems")} ({totalProducts})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-9 rounded-lg items-center justify-center flex-row gap-1"
                  style={{ backgroundColor: itemFilter === "low" ? colors.warning : colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => { setItemFilter("low"); setPage(0); }}
                >
                  <Text style={{ color: itemFilter === "low" ? "white" : colors.textSecondary }} className="font-semibold text-xs">
                    {t("stock.lowStock")} ({lowStockCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View className="items-center justify-center py-10">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : items.length === 0 ? (
                <View className="rounded-xl px-4 py-8 items-center" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                  <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                  <Text className="text-sm mt-2 text-center" style={{ color: colors.textMuted }}>
                    {searchQ ? t("stock.noResults") : itemFilter === "low" ? t("stock.noLowStock") : t("stock.empty")}
                  </Text>
                </View>
              ) : (
                items.map((item) => {
                  const low = item.lowStockAlert && item.quantity <= item.minQuantity;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className="rounded-xl px-4 py-3 mb-2 flex-row items-center"
                      style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}
                      onPress={() => openDetail(item)}
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{item.name}</Text>
                          {low ? (
                            <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: colors.warning + "33" }}>
                              <Text className="text-[10px] font-bold" style={{ color: colors.warning }}>{t("stock.low")}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                          {item.supplierName || "-"}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm font-bold" style={{ color: low ? colors.warning : colors.text }}>
                          {formatQty(item.quantity)} <Text className="text-xs font-normal" style={{ color: colors.textMuted }}>{item.unit}</Text>
                        </Text>
                        <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                          {item.unitPrice != null ? formatMoney(item.unitPrice, item.currency) : "-"}
                        </Text>
                        <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                          {item.vatRate > 0 ? `KDV %${formatQty(item.vatRate)}` : "-"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              {totalPages > 1 ? (
                <View className="flex-row items-center justify-center gap-3 mt-5">
                  <TouchableOpacity
                    disabled={page === 0 || loading}
                    onPress={() => loadItems(page - 1, search)}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: page === 0 || loading ? colors.bgCard : colors.primary, opacity: page === 0 || loading ? 0.5 : 1 }}
                  >
                    <Text className="text-sm" style={{ color: "white" }}>{t("stock.previous")}</Text>
                  </TouchableOpacity>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {page + 1} / {totalPages}
                  </Text>
                  <TouchableOpacity
                    disabled={page >= totalPages - 1 || loading}
                    onPress={() => loadItems(page + 1, search)}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: page >= totalPages - 1 || loading ? colors.bgCard : colors.primary, opacity: page >= totalPages - 1 || loading ? 0.5 : 1 }}
                  >
                    <Text className="text-sm" style={{ color: "white" }}>{t("stock.next")}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  className="h-11 rounded-lg items-center justify-center px-4 flex-row gap-2"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => setImportVisible(true)}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="white" />
                  <Text style={{ color: "white" }} className="font-semibold text-sm">{t("stock.importInvoice")}</Text>
                </TouchableOpacity>
              </View>

              {invoicesLoading && invoices.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : invoices.length === 0 ? (
                <View className="rounded-xl px-4 py-8 items-center" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                  <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
                  <Text className="text-sm mt-2 text-center" style={{ color: colors.textMuted }}>{t("stock.noInvoices")}</Text>
                </View>
              ) : (
                invoices.map((inv) => (
                  <TouchableOpacity
                    key={inv.id}
                    className="rounded-xl px-4 py-3 mb-2"
                    style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}
                    onPress={() => setInvoiceDetail(inv)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>{inv.invoiceNo}</Text>
                      {inv.totalAmount != null || inv.vatAmount != null ? (
                        <View className="items-end">
                          {inv.totalAmount != null ? (
                            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>{formatMoney(inv.totalAmount, inv.currency)}</Text>
                          ) : null}
                          {inv.vatAmount != null ? (
                            <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                              KDV {formatMoney(inv.vatAmount, inv.currency)}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {inv.supplierName || "-"}{inv.date ? ` · ${formatDate(inv.date)}` : ""}
                    </Text>
                    <View className="mt-1.5">
                      {inv.lines.slice(0, 4).map((line) => (
                        <View key={line.id} className="flex-row items-center justify-between py-1">
                          <Text className="text-xs flex-1 mr-2" style={{ color: colors.textSecondary }} numberOfLines={1}>{line.name}</Text>
                          <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                            {formatQty(line.quantity)} {line.unit}
                          </Text>
                        </View>
                      ))}
                      {inv.lines.length > 4 ? (
                        <Text className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
                          +{inv.lines.length - 4} {t("stock.line")}
                        </Text>
                      ) : null}
</View>
                  </TouchableOpacity>
                ))
              )}
              {invoicesLoading && invoices.length > 0 ? (
                <View className="py-3 items-center">
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null}
              {invoiceTotal > invoices.length && !invoicesEnd && !invoicesLoading ? (
                <TouchableOpacity
                  className="h-10 rounded-lg items-center justify-center mt-1"
                  style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}
                  onPress={() => loadInvoices(invoicePage + 1, true)}
                >
                  <Text style={{ color: colors.primary }} className="font-semibold text-sm">{t("stock.loadMore")}</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <StockDetailModal
        visible={detailVisible}
        item={detail}
        adjusting={adjusting}
        onClose={() => setDetailVisible(false)}
        onEdit={(item) => { setDetailVisible(false); setFormItem(item); setFormVisible(true); }}
        onDelete={(item) => {
          setDetailVisible(false);
          setAlert({
            visible: true,
            type: "confirm",
            title: t("stock.deletePermanent"),
            message: t("stock.deleteConfirm", { name: item.name }),
            confirmColor: colors.danger,
            confirmText: t("stock.deletePermanent"),
            onConfirm: () => doDelete(item),
          });
        }}
        onAdjust={handleAdjust}
        onToggleAlert={handleToggleAlert}
      />

      <StockFormModal
        visible={formVisible}
        item={formItem}
        onClose={() => { setFormVisible(false); setFormItem(null); }}
        onSubmit={handleFormSubmit}
      />

      <InvoiceImportModal
        visible={importVisible}
        onClose={() => setImportVisible(false)}
        onImported={(summary) => {
          setImportVisible(false);
          loadItems(page, search);
          setAlert({
            visible: true,
            type: "success",
            title: t("stock.importTitle"),
            message: t("stock.importSuccess", { created: String(summary.created), updated: String(summary.updated) }),
          });
        }}
      />

      <InvoiceDetailModal
        visible={invoiceDetail !== null}
        invoice={invoiceDetail}
        onClose={() => setInvoiceDetail(null)}
        onDelete={doDeleteInvoice}
      />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmColor={alert.confirmColor}
        onClose={() => setAlert(emptyAlert)}
        onConfirm={alert.onConfirm}
        confirmText={alert.confirmText}
      />
    </>
  );
}