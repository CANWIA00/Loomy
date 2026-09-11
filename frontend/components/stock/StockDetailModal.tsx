import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { StockItemDetail, StockTransaction } from "../../apiclient/stock";
import { formatMoney, formatQty, formatDate, formatDateTime, parseNumericInput } from "./format";

interface Props {
  visible: boolean;
  item: StockItemDetail | null;
  adjusting: boolean;
  onClose: () => void;
  onEdit: (item: StockItemDetail) => void;
  onDelete: (item: StockItemDetail) => void;
  onAdjust: (item: StockItemDetail, change: number, note: string) => void;
  onToggleAlert: (item: StockItemDetail) => void;
}

function reasonLabel(reason: string, t: (key: string, params?: any) => string): string {
  if (reason === "INITIAL") return t("stock.reasonInitial");
  if (reason === "INVOICE") return t("stock.reasonInvoice");
  return t("stock.reasonManual");
}

export default function StockDetailModal({ visible, item, adjusting, onClose, onEdit, onDelete, onAdjust, onToggleAlert }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (visible) {
      setQty("1");
      setNote("");
    }
  }, [visible, item]);

  if (!item) return null;

  const lowStock = item.quantity <= item.minQuantity;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-4 w-full max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: "95%" }}>

          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{item.name}</Text>
              {item.supplierName ? (
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{t("stock.supplier")}: {item.supplierName}</Text>
              ) : null}
              {item.lastInvoiceNo ? (
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                  {t("stock.invoiceNo")}: {item.lastInvoiceNo} · {formatDate(item.lastInvoiceDate)}
                </Text>
              ) : null}
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => onToggleAlert(item)} style={{ padding: 4 }}>
                <Ionicons
                  name={item.lowStockAlert ? "notifications" : "notifications-off-outline"}
                  size={20}
                  color={item.lowStockAlert ? colors.warning : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted }} className="text-xl">✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 2 }}>
            <View className="flex-row gap-2 mb-2.5">
              <View
                className="flex-1 rounded-xl px-3 py-2"
                style={{ backgroundColor: lowStock ? colors.warning + "22" : colors.success + "22", borderColor: lowStock ? colors.warning + "55" : colors.success + "55", borderWidth: 1 }}
              >
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.qty")}</Text>
                <Text className="text-lg font-bold" style={{ color: lowStock ? colors.warning : colors.success }}>
                  {formatQty(item.quantity)} {item.unit}
                </Text>
                {lowStock ? (
                  <Text className="text-[10px] mt-0.5" style={{ color: colors.warning }}>
                    {t("stock.low")} ⚠ ({t("stock.minQty")}: {formatQty(item.minQuantity)})
                  </Text>
                ) : null}
              </View>
              <View className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("stock.unitPrice")}</Text>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{formatMoney(item.unitPrice, item.currency)}</Text>
                <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>KDV %{formatQty(item.vatRate)}</Text>
              </View>
            </View>

            <View className="rounded-xl p-2.5 mb-2.5" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
              <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>{t("stock.adjustStock")}</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={qty}
                  onChangeText={(v) => setQty(v.replace(/[^0-9.,]/g, ""))}
                  keyboardType="numeric"
                  className="rounded-lg px-3 py-2 flex-1"
                  style={{ backgroundColor: colors.bgInput, color: colors.text }}
                />
                <TouchableOpacity
                  disabled={adjusting}
                  className="px-4 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.success, opacity: adjusting ? 0.5 : 1 }}
                  onPress={() => {
                    const n = parseNumericInput(qty);
                    if (n > 0) onAdjust(item, n, note);
                  }}
                >
                  <Text style={{ color: "white" }} className="font-semibold">{t("stock.in")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={adjusting}
                  className="px-4 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.danger, opacity: adjusting ? 0.5 : 1 }}
                  onPress={() => {
                    const n = parseNumericInput(qty);
                    if (n > 0) onAdjust(item, -n, note);
                  }}
                >
                  <Text style={{ color: "white" }} className="font-semibold">{t("stock.out")}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t("stock.notes")}
                placeholderTextColor={colors.textMuted}
                className="rounded-lg px-3 py-2 mt-1.5"
                style={{ backgroundColor: colors.bgInput, color: colors.text }}
              />
            </View>
          </ScrollView>

          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>{t("stock.history")}</Text>

          {item.transactions.length > 0 ? (
            <View style={{ maxHeight: 132 }} className="mb-2.5">
              <ScrollView showsVerticalScrollIndicator nestedScrollEnabled>
                {item.transactions.map((tr: StockTransaction) => (
                  <View key={tr.id} className="flex-row items-center justify-between rounded-lg px-3 py-1.5 mb-1" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-bold" style={{ color: tr.change > 0 ? colors.success : colors.danger }}>
                          {tr.change > 0 ? "+" : ""}{formatQty(tr.change)}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textMuted }}>{reasonLabel(tr.reason, t)}</Text>
                      </View>
<Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                      {formatDateTime(tr.createdAt)}
                      {tr.invoice ? ` · ${tr.invoice.invoiceNo}` : ""}
                    </Text>
                    {tr.vatRate != null && tr.vatRate > 0 ? (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Text className="text-[10px]" style={{ color: colors.textMuted }}>KDV %{formatQty(tr.vatRate)}</Text>
                        {tr.vatAmount != null ? (
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                            ({formatMoney(tr.vatAmount, tr.currency)})
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    </View>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {tr.unitPrice != null ? formatMoney(tr.unitPrice, tr.currency) : ""}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text className="text-xs mb-2.5" style={{ color: colors.textMuted }}>{t("stock.historyEmpty")}</Text>
          )}

          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 h-10 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.danger }}
              onPress={() => onDelete(item)}
            >
              <Text style={{ color: "white" }} className="font-semibold text-xs">{t("stock.deletePermanent")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-10 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => onEdit(item)}
            >
              <Text style={{ color: "white" }} className="font-semibold">{t("stock.edit")}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}