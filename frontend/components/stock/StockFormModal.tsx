import { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { StockItem } from "../../apiclient/stock";
import { parseNumericInput } from "./format";

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

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setUnit(item?.unit || "AD");
      setInitialQty(item ? "0" : "0");
      setMinQty(item ? String(item.minQuantity || 0) : "0");
      setUnitPrice(item?.unitPrice != null ? String(item.unitPrice).replace(".", ",") : "");
      setVatRate(item ? String(item.vatRate || 0) : "0");
      setCurrency(item?.currency || "TRY");
      setSupplierName(item?.supplierName || "");
      setSupplierTaxNumber(item?.supplierTaxNumber || "");
      setNotes(item?.notes || "");
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
          <View className="rounded-2xl p-5 w-full max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: "88%" }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {isEdit ? t("stock.edit") : t("stock.addItem")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted }} className="text-xl">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.name")} *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t("stock.namePlaceholder")}
                placeholderTextColor={colors.textMuted}
                className="rounded-lg px-3 py-2.5 mb-3"
                style={{ backgroundColor: colors.bgInput, color: colors.text }}
              />

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.unit")}</Text>
                  <TextInput
                    value={unit}
                    onChangeText={setUnit}
                    placeholder={t("stock.unitPlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.currency")}</Text>
                  <TextInput
                    value={currency}
                    onChangeText={setCurrency}
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                    className="rounded-lg px-3 py-2.5"
                  />
                </View>
              </View>

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.initialQty")}</Text>
                  <TextInput
                    value={initialQty}
                    onChangeText={(v) => setInitialQty(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="numeric"
                    editable={!isEdit}
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: colors.bgInput, color: colors.text, opacity: isEdit ? 0.5 : 1 }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.minQty")}</Text>
                  <TextInput
                    value={minQty}
                    onChangeText={(v) => setMinQty(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="numeric"
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
              </View>

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.unitPrice")}</Text>
                  <TextInput
                    value={unitPrice}
                    onChangeText={(v) => setUnitPrice(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="numeric"
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.vat")} (%)</Text>
                  <TextInput
                    value={vatRate}
                    onChangeText={(v) => setVatRate(v.replace(/[^0-9.,]/g, ""))}
                    keyboardType="numeric"
                    className="rounded-lg px-3 py-2.5"
                    style={{ backgroundColor: colors.bgInput, color: colors.text }}
                  />
                </View>
              </View>

              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.supplier")}</Text>
              <TextInput
                value={supplierName}
                onChangeText={setSupplierName}
                className="rounded-lg px-3 py-2.5 mb-3"
                style={{ backgroundColor: colors.bgInput, color: colors.text }}
              />

              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>{t("stock.notes")}</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                className="rounded-lg px-3 py-2.5 mb-3"
                style={{ backgroundColor: colors.bgInput, color: colors.text, minHeight: 60, textAlignVertical: "top" }}
              />

              <TouchableOpacity
                disabled={submitDisabled}
                className="h-11 rounded-lg items-center justify-center mb-1"
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
                  })
                }
              >
                <Text style={{ color: "white" }} className="font-semibold text-base">
                  {isEdit ? t("stock.update") : t("stock.save")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}