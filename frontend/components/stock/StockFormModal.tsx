import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { StockItem } from "../../apiclient/stock";
import { parseNumericInput, CURRENCIES, getCurrencySymbol } from "./format";

interface Props {
  visible: boolean;
  item: StockItem | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    unitPrice: number | null;
    currency: string;
    vatRate: number;
    supplierName: string;
    supplierTaxNumber: string;
    notes: string;
    lowStockAlert: boolean;
  }) => void;
}

export default function StockFormModal({ visible, item, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const isEdit = !!item;

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("AD");
  const [initialQty, setInitialQty] = useState("0");
  const [minQty, setMinQty] = useState("0");
  const [unitPrice, setUnitPrice] = useState("");
  const [vatRate, setVatRate] = useState("0");
  const [currency, setCurrency] = useState("TRY");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTaxNumber, setSupplierTaxNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [unitModal, setUnitModal] = useState(false);

  const UNIT_OPTIONS = ["Adet", "Kutu", "Koli", "Kg", "Gram", "metre", "cm", "lt", "ml"] as const;

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setUnit(item?.unit || "AD");
      setInitialQty(item ? String(item.quantity) : "0");
      setMinQty(item ? String(item.minQuantity || 0) : "0");
      setUnitPrice(item?.unitPrice != null ? String(item.unitPrice).replace(".", ",") : "");
      setVatRate(item ? String(item.vatRate || 0) : "0");
      setCurrency(item?.currency || "TRY");
      setSupplierName(item?.supplierName || "");
      setSupplierTaxNumber(item?.supplierTaxNumber || "");
      setNotes(item?.notes || "");
      setLowStockAlert(item?.lowStockAlert !== false);
    }
  }, [visible, item]);

  const submitDisabled = !name.trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-center px-4"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="rounded-2xl p-4 w-full max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: "95%" }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {isEdit ? t("stock.edit") : t("stock.addItem")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted }} className="text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 2 }}>
              <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.name")} *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t("stock.namePlaceholder")}
                placeholderTextColor={colors.textMuted}
                className="rounded-lg px-3 py-2 mb-2.5"
                style={{ backgroundColor: colors.bgInput, color: colors.text }}
              />

              <View className="flex-row gap-2 mb-2.5">
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.unit")}</Text>
                  <TouchableOpacity
                    onPress={() => setUnitModal(true)}
                    className="rounded-lg px-3 py-2 flex-row items-center"
                    style={{ backgroundColor: colors.bgInput }}
                  >
                    <Text style={{ color: colors.text }} className="flex-1">{unit}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.currency")}</Text>
                  <TouchableOpacity
                    onPress={() => setCurrencyModal(true)}
                    className="rounded-lg px-3 py-2 flex-row items-center"
                    style={{ backgroundColor: colors.bgInput }}
                  >
                    <Text style={{ color: colors.text }} className="flex-1" numberOfLines={1}>
                      {currency} {getCurrencySymbol(currency)}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-2 mb-2.5">
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.qty")} ({unit})</Text>
                  <TextInput
                    value={initialQty}
                    onChangeText={(v) => setInitialQty(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="decimal-pad"
                    placeholder={isEdit ? t("stock.qtyEditHint") : t("stock.qty")}
                    placeholderTextColor={colors.textMuted}
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.minQty")} ({unit})</Text>
                  <TextInput
                    value={minQty}
                    onChangeText={(v) => setMinQty(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="decimal-pad"
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
              </View>

              <View className="flex-row gap-2 mb-2.5">
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.unitPrice")}</Text>
                  <TextInput
                    value={unitPrice}
                    onChangeText={(v) => setUnitPrice(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="decimal-pad"
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.vat")} (%)</Text>
                  <TextInput
                    value={vatRate}
                    onChangeText={(v) => setVatRate(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="decimal-pad"
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
              </View>

              <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.supplier")}</Text>
              <TextInput
                value={supplierName}
                onChangeText={setSupplierName}
                className="rounded-lg px-3 py-2 mb-2.5"
                style={{ backgroundColor: colors.bgInput, color: colors.text }}
              />

              <Text className="text-xs mb-0.5" style={{ color: colors.textSecondary }}>{t("stock.notes")}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                className="rounded-lg px-3 py-2 mb-2.5"
                style={{ backgroundColor: colors.bgInput, color: colors.text, minHeight: 44, textAlignVertical: "top" }}
              />

              {isEdit ? (
                <View
                  className="flex-row items-center justify-between rounded-lg px-3 py-2 mb-2"
                  style={{ backgroundColor: colors.bgInput }}
                >
                  <Text className="text-xs flex-1 mr-2" style={{ color: colors.textSecondary }}>
                    {t("stock.lowStockAlert")}
                  </Text>
                  <Switch
                    value={lowStockAlert}
                    onValueChange={setLowStockAlert}
                    trackColor={{ true: colors.success, false: colors.border }}
                    thumbColor="white"
                  />
                </View>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              disabled={submitDisabled}
              className="h-10 rounded-lg items-center justify-center mt-2"
              style={{ backgroundColor: submitDisabled ? colors.bgInput : colors.primary, opacity: submitDisabled ? 0.6 : 1 }}
                onPress={() =>
                  onSubmit({
                    name: name.trim(),
                    unit: unit.trim() || "AD",
                    quantity: parseNumericInput(initialQty),
                    minQuantity: parseNumericInput(minQty),
                    unitPrice: unitPrice.trim() ? parseNumericInput(unitPrice) : null,
                    currency: currency.trim() || "TRY",
                    vatRate: parseNumericInput(vatRate),
                    supplierName: supplierName.trim(),
                    supplierTaxNumber: supplierTaxNumber.trim(),
                    notes: notes.trim(),
                    lowStockAlert,
                  })
                }
              >
                <Text style={{ color: "white" }} className="font-semibold text-base">
                  {isEdit ? t("stock.update") : t("stock.save")}
                </Text>
              </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={unitModal} transparent animationType="fade" onRequestClose={() => setUnitModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("stock.unit")}</Text>
              <TouchableOpacity onPress={() => setUnitModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {UNIT_OPTIONS.map((u, i, arr) => (
              <TouchableOpacity
                key={u}
                className="flex-row items-center px-3 py-3"
                style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  setUnit(u);
                  setUnitModal(false);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{u}</Text>
                {unit === u && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={currencyModal} transparent animationType="fade" onRequestClose={() => setCurrencyModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("stock.currency")}</Text>
              <TouchableOpacity onPress={() => setCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c, i, arr) => (
              <TouchableOpacity
                key={c.code}
                className="flex-row items-center px-3 py-3"
                style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  setCurrency(c.code);
                  setCurrencyModal(false);
                }}
              >
                <Text className="text-base mr-2" style={{ color: colors.text }}>{c.symbol}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{c.code}</Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{c.label}</Text>
                </View>
                {currency === c.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}