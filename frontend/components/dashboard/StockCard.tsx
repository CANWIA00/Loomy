import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import CustomAlert from "../CustomAlert";
import { stockApi, type StockItem, type StockItemDetail, type StockItemInput } from "../../apiclient/stock";
import { formatMoney, formatQty } from "../stock/format";
import StockFormModal from "../stock/StockFormModal";
import StockDetailModal from "../stock/StockDetailModal";
import InvoiceImportModal from "../stock/InvoiceImportModal";

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "confirm";
  title: string;
  message: string;
  confirmColor?: string;
  onConfirm?: () => void;
};

const emptyAlert: AlertState = { visible: false, type: "success", title: "", message: "" };

export default function StockCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [expanded, setExpanded] = useState(false);

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<StockItemDetail | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formItem, setFormItem] = useState<StockItem | null>(null);
  const [importVisible, setImportVisible] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(emptyAlert);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockApi.list();
      setItems(res.data.content);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowStockCount = items.filter((i) => i.lowStockAlert && i.quantity <= i.minQuantity).length;
  const totalByCurrency = items.reduce<Record<string, number>>((acc, i) => {
    if (i.unitPrice == null) return acc;
    const cur = i.currency || "TRY";
    acc[cur] = (acc[cur] || 0) + i.quantity * i.unitPrice;
    return acc;
  }, {});
  const totalValue = Object.entries(totalByCurrency)
    .map(([cur, val]) => formatMoney(val, cur))
    .join(" · ");

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
        await stockApi.update(formItem.id, { ...data, quantity: undefined });
      } else {
        await stockApi.create(data);
      }
      setFormVisible(false);
      setFormItem(null);
      await loadItems();
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

  const handleAdjust = async (target: StockItemDetail, change: number) => {
    setAdjusting(true);
    try {
      await stockApi.addTransaction(target.id, { change });
      await loadItems();
      const refreshed = (await stockApi.get(target.id)).data;
      setDetail(refreshed);
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleAlert = async (target: StockItemDetail) => {
    try {
      const updated = (await stockApi.update(target.id, { lowStockAlert: !target.lowStockAlert })).data;
      setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, lowStockAlert: updated.lowStockAlert } : i)));
      setDetail((prev) => (prev ? { ...prev, lowStockAlert: updated.lowStockAlert } : prev));
    } catch {
      setAlert({ visible: true, type: "error", title: t("stock.title"), message: t("stock.loading") });
    }
  };

  const lowStockItems = items.filter((i) => i.lowStockAlert && i.quantity <= i.minQuantity).slice(0, 4);

  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
      <View className="flex-row items-center mb-0">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          activeOpacity={0.7}
          onPress={() => setExpanded((v) => !v)}
        >
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.teal + "15" }}>
            <Ionicons name="cube" size={20} color={colors.teal} />
          </View>
          <View className="ml-3 flex-1">
            <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.stock")}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              {t("dash.stock.desc")}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgCard2 }}
          onPress={() => setExpanded((v) => !v)}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="h-8 px-3 rounded-lg items-center justify-center ml-2"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/stock" as any)}
        >
          <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.manage")}</Text>
        </TouchableOpacity>
      </View>

      {!expanded ? null : (
        <>
          <View className="flex-row gap-2 my-3">
        <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.totalProducts")}</Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{loading ? "-" : items.length}</Text>
        </View>
        <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.lowStockCount")}</Text>
          <Text className="text-lg font-bold" style={{ color: lowStockCount > 0 ? colors.warning : colors.text }}>{loading ? "-" : lowStockCount}</Text>
        </View>
        <View className="flex-1 rounded-xl px-3 py-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.totalValue")}</Text>
          <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>
            {loading ? "-" : totalValue || "-"}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity
          className="h-10 flex-1 rounded-lg items-center justify-center flex-row gap-1.5"
          style={{ backgroundColor: colors.primary }}
          onPress={() => setImportVisible(true)}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="white" />
          <Text style={{ color: "white" }} className="font-semibold text-xs">{t("stock.importInvoice")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="h-10 flex-1 rounded-lg items-center justify-center flex-row gap-1.5"
          style={{ backgroundColor: colors.success }}
          onPress={() => { setFormItem(null); setFormVisible(true); }}
        >
          <Ionicons name="add" size={16} color="white" />
          <Text style={{ color: "white" }} className="font-semibold text-xs">{t("stock.addItem")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : lowStockCount > 0 ? (
        <View>
          <Text className="text-xs font-semibold mb-2" style={{ color: colors.warning }}>
            {t("dash.stock.lowStock")}
          </Text>
          {lowStockItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center py-2.5 border-b"
              style={{ borderColor: colors.border + "50" }}
              onPress={() => openDetail(item)}
            >
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>{item.name}</Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  {formatQty(item.quantity)} {item.unit}
                </Text>
              </View>
              <View className="flex-row gap-1.5">
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.success + "22" }}
                  onPress={() => openDetail(item)}
                >
                  <Ionicons name="add" size={16} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-8 h-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.danger + "22" }}
                  onPress={() => openDetail(item)}
                >
                  <Ionicons name="remove" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="items-center justify-center py-6 rounded-xl" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
          <Text className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>{t("dash.stock.noLowStock")}</Text>
        </View>
      )}
        </>
      )}

      <StockDetailModal
        visible={detailVisible}
        item={detail}
        adjusting={adjusting}
        onClose={() => setDetailVisible(false)}
        onEdit={(item) => { setDetailVisible(false); setFormItem(item); setFormVisible(true); }}
        onDelete={() => setDetailVisible(false)}
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
          loadItems();
          setAlert({
            visible: true,
            type: "success",
            title: t("stock.importTitle"),
            message: t("stock.importSuccess", { created: String(summary.created), updated: String(summary.updated) }),
          });
        }}
      />

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmColor={alert.confirmColor}
        onClose={() => setAlert(emptyAlert)}
        onConfirm={alert.onConfirm}
        confirmText={t("common.confirm")}
      />
    </View>
  );
}