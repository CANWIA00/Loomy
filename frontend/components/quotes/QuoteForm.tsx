import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useQuotes } from "./QuoteContext";
import type { Customer } from "../../apiclient/customers";
import { stockApi, type StockItem } from "../../apiclient/stock";
import { getCurrentAddress } from "../../utils/location";
import { formatMoney, round2, KDV_RATE, CURRENCIES, getCurrencySymbol, UNIT_OPTIONS, parseNumericInput } from "./types";

const formatRate = (rate: number) =>
  rate.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const formatDateInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  return formatted;
};

const computeValidUntil = (documentDate: string, daysToAdd = 0, monthsToAdd = 0) => {
  let base = new Date();
  if (documentDate) {
    const parts = documentDate.split("/");
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    if (day && month && year) base = new Date(year, month - 1, day);
  }
  const d = new Date(base);
  if (daysToAdd) d.setDate(d.getDate() + daysToAdd);
  if (monthsToAdd) d.setMonth(d.getMonth() + monthsToAdd);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

function RequiredMark() {
  const { colors } = useTheme();
  return <Text style={{ color: colors.danger }}> *</Text>;
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>
      {children}
      {required ? <RequiredMark /> : null}
    </Text>
  );
}

function DateField({
  label, value, onChange, placeholder, quickOptions = [], base = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  quickOptions?: { label: string; days: number; months: number }[];
  base?: string;
}) {
  const { colors } = useTheme();
  return (
    <View className="mb-3 flex-1">
      <FieldLabel>{label}</FieldLabel>
      <View className="flex-row items-center border rounded-lg px-2" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
        <TextInput
          className="flex-1 h-11 px-1 text-sm"
          style={{ color: colors.text }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(v) => onChange(formatDateInput(v))}
        />
        <TouchableOpacity
          className="h-11 w-10 items-center justify-center"
          onPress={() => {
            const now = new Date();
            const tarih = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
            onChange(tarih);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {quickOptions.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mt-1.5">
          {quickOptions.map((opt) => {
            const active = value === computeValidUntil(base, opt.days, opt.months);
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => onChange(computeValidUntil(base, opt.days, opt.months))}
                className="px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: active ? colors.primary : colors.bgInput,
                  borderColor: active ? colors.primary : colors.border,
                }}
              >
                <Text className="text-[11px] font-medium" style={{ color: active ? "white" : colors.primary }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function QuoteForm() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWide = width >= 1100;
  const isTable = width >= 900;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { convert: convertTry, rates, refresh: refreshRates, loading: loadingRates, stale: ratesStale } = useCurrency();
  const {
    form,
    updateForm,
    updateLine,
    addLine,
    removeLine,
    requiredErrors,
    isEditing,
    handleCancelEditing,
    handleClear,
    handleSave,
    customerList,
    selectedCustomerId,
    clearCustomerSelection,
    selectCustomer,
    customerSelectModal,
    setCustomerSelectModal,
    customerSearch,
    setCustomerSearch,
    newCustomerModal,
    setNewCustomerModal,
    newCustomerForm,
    updateNewCustomerForm,
    resetNewCustomerForm,
    createNewCustomer,
  } = useQuotes();

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [locatingNewAddress, setLocatingNewAddress] = useState(false);
  const [currencyModalIdx, setCurrencyModalIdx] = useState<number | null>(null);
  const [unitModalIdx, setUnitModalIdx] = useState<number | null>(null);

  // Masaüstünde üst alanı 3-4 kolona yay; mobilde mevcut 2'li düzeni koru.
  const cell = (mobileSpan: 1 | 2, desktopSpan: 1 | 2, wideSpan: 1 | 2 | 3 = desktopSpan) => ({
    width: (!isDesktop
      ? mobileSpan === 2 ? "100%" : "47%"
      : isWide
        ? wideSpan === 3 ? "71%" : wideSpan === 2 ? "47%" : "23%"
        : desktopSpan === 2 ? "63%" : "31%") as `${number}%`,
  });

  const [stockSuggestions, setStockSuggestions] = useState<StockItem[]>([]);
  const [savedNameSuggestions, setSavedNameSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [stockSearchIdx, setStockSearchIdx] = useState<number | null>(null);
  const stockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchSavedNames = useCallback(async (q: string, idx: number) => {
    if (!q.trim() || q.trim().length < 2) {
      setSavedNameSuggestions([]);
      return;
    }
    try {
      const res = await stockApi.listSavedNames(q.trim());
      setSavedNameSuggestions(res.data.content.slice(0, 8));
    } catch {
      setSavedNameSuggestions([]);
    }
  }, []);

  const searchStock = useCallback((q: string, idx: number) => {
    if (stockTimerRef.current) clearTimeout(stockTimerRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setStockSuggestions([]);
      setStockSearchIdx(null);
      return;
    }
    stockTimerRef.current = setTimeout(async () => {
      try {
        const res = await stockApi.list(q.trim());
        setStockSuggestions(res.data.content.slice(0, 8));
        setStockSearchIdx(idx);
        searchSavedNames(q.trim(), idx);
      } catch {
        setStockSuggestions([]);
      }
    }, 300);
  }, [searchSavedNames]);

  const saveNameFromLine = async (idx: number) => {
    const name = form.lines[idx]?.name.trim();
    if (!name) return;
    try {
      await stockApi.saveName(name);
      searchSavedNames(name, idx);
    } catch {}
  };

  const pickSavedName = (idx: number, name: string) => {
    updateLine(idx, "name", name);
    setSavedNameSuggestions([]);
    setStockSuggestions([]);
    setStockSearchIdx(null);
  };

  const selectStockItem = (idx: number, item: StockItem) => {
    updateLine(idx, "name", item.name);
    if (item.unitPrice != null) updateLine(idx, "unitPrice", String(item.unitPrice));
    if (item.currency) updateLine(idx, "currency", item.currency);
    if (item.unit) updateLine(idx, "unit", item.unit);
    if (item.notes) updateLine(idx, "details", item.notes);
    setStockSuggestions([]);
    setSavedNameSuggestions([]);
    setStockSearchIdx(null);
  };

  const handleAddLine = () => {
    addLine();
  };

  const validLines = form.lines.filter((l) => l.name || l.details);

  const currencyGroups: Record<string, { subTotal: number; kdv: number; grandTotal: number }> = {};
  validLines.forEach((l) => {
    const cur = l.currency || "TRY";
    const lineTotal = parseNumericInput(l.quantity) * parseNumericInput(l.unitPrice);
    if (!currencyGroups[cur]) currencyGroups[cur] = { subTotal: 0, kdv: 0, grandTotal: 0 };
    currencyGroups[cur].subTotal += lineTotal;
  });
  Object.keys(currencyGroups).forEach((cur) => {
    currencyGroups[cur].subTotal = round2(currencyGroups[cur].subTotal);
    currencyGroups[cur].kdv = round2(currencyGroups[cur].subTotal * KDV_RATE);
    currencyGroups[cur].grandTotal = round2(currencyGroups[cur].subTotal + currencyGroups[cur].kdv);
  });

  const currencyKeys = Object.keys(currencyGroups);
  const totalTry = currencyKeys.reduce((s, cur) => {
    const conv = convertTry(currencyGroups[cur].grandTotal, cur);
    return conv === null ? s : s + conv;
  }, 0);
  const hasForeignCurrency = currencyKeys.some((cur) => cur !== "TRY");
  const totalTryAvailable = totalTry > 0 && hasForeignCurrency && !!rates;

  const selectFromList = (m: Customer) => {
    selectCustomer(m);
    setCustomerModalOpen(false);
  };

  const openCustomerModal = () => {
    setCustomerSearch("");
    setCustomerModalOpen(true);
  };

  const openNewCustomerModal = () => {
    resetNewCustomerForm();
    setCustomerModalOpen(false);
    setNewCustomerModal(true);
  };

  const handleLocateNewAddress = async () => {
    setLocatingNewAddress(true);
    try {
      const adres = await getCurrentAddress();
      updateNewCustomerForm("address", adres);
    } catch (e: any) {
      if (e?.message === "PERMISSION_DENIED") {
        Alert.alert(t("map.permissionRequired"), t("map.permissionDenied"));
      } else {
        Alert.alert(t("common.error"), t("map.errorLocation"));
      }
    } finally {
      setLocatingNewAddress(false);
    }
  };

  return (
    <>
      <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        {(!isDesktop || isEditing) && (
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-base" style={{ color: colors.text }}>
              {isEditing ? t("qot.editQuote") : t("qot.newQuote")}
            </Text>
            {isEditing && (
              <TouchableOpacity onPress={handleCancelEditing} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                <Ionicons name="close-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text className="text-[10px] mb-3" style={{ color: colors.textMuted }}>
          <Text style={{ color: colors.danger }}>*</Text> {t("qot.requiredHint")}
        </Text>

        <View className="flex-row flex-wrap gap-3">
          <View style={cell(2, 2, 2)}>
            <FieldLabel>{t("qot.quoteTitle")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.quoteTitlePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(v) => updateForm("title", v)}
            />
          </View>

          <View style={cell(2, 1, 1)}>
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.selectCustomer")}</Text>
            <TouchableOpacity
              className="flex-row items-center h-10 border rounded-lg px-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              onPress={openCustomerModal}
            >
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <Text className="text-sm ml-2 flex-1" style={{ color: selectedCustomerId ? colors.text : colors.textMuted }}>
                {selectedCustomerId ? customerList.find((m) => m.id === selectedCustomerId)?.companyName : t("qot.searchCustomer")}
              </Text>
              {selectedCustomerId && (
                <TouchableOpacity onPress={clearCustomerSelection}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {!selectedCustomerId && <Ionicons name="chevron-down" size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel required>{t("qot.customerName")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: requiredErrors.customerName ? colors.danger : colors.border, color: colors.text }}
              placeholder={t("qot.customerNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.customerName}
              onChangeText={(v) => updateForm("customerName", v)}
            />
            {requiredErrors.customerName && (
              <Text className="text-[10px] mt-1" style={{ color: colors.danger }}>{t("qot.fieldRequired")}</Text>
            )}
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.phone")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.phonePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => updateForm("phone", v)}
            />
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.contactPerson")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.contactPersonPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.contactPerson}
              onChangeText={(v) => updateForm("contactPerson", v)}
            />
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.subscriberNo")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.subscriberNoPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.subscriberNo}
              onChangeText={(v) => updateForm("subscriberNo", v)}
            />
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.email")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => updateForm("email", v)}
            />
          </View>

          <View style={cell(1, 1, 2)}>
            <FieldLabel>{t("qot.address")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.addressPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.address}
              onChangeText={(v) => updateForm("address", v)}
            />
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.fax")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.faxPlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={form.fax}
              onChangeText={(v) => updateForm("fax", v)}
            />
          </View>

          <View style={cell(1, 1, 1)}>
            <FieldLabel>{t("qot.website")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.websitePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.website}
              onChangeText={(v) => updateForm("website", v)}
            />
          </View>
        </View>

        <View className="flex-row gap-3 mt-3">
          <DateField
            label={t("qot.documentDate")}
            value={form.documentDate}
            onChange={(v) => updateForm("documentDate", v)}
            placeholder={t("qot.datePlaceholder")}
            quickOptions={[{ label: t("qot.today"), days: 0, months: 0 }]}
          />
          <DateField
            label={t("qot.validUntil")}
            value={form.validUntil}
            onChange={(v) => updateForm("validUntil", v)}
            placeholder={t("qot.datePlaceholder")}
            base={form.documentDate}
            quickOptions={[
              { label: t("qot.today"), days: 0, months: 0 },
              { label: t("qot.valid1Day"), days: 1, months: 0 },
              { label: t("qot.valid1Week"), days: 7, months: 0 },
              { label: t("qot.valid2Week"), days: 14, months: 0 },
              { label: t("qot.valid1Month"), days: 0, months: 1 },
            ]}
          />
        </View>

        <View className="mt-3 mb-2">
          <View className={isTable ? "flex-row items-center justify-between mb-1.5" : ""}>
            <Text className={`text-sm font-semibold ${isTable ? "" : "mb-1.5"}`} style={{ color: colors.text }}>{t("qot.items")}</Text>
            {isTable && (
              <TouchableOpacity
                className="flex-row items-center justify-center h-8 px-3 rounded-lg border border-dashed"
                style={{ borderColor: colors.primary, backgroundColor: colors.primary + "0A" }}
                onPress={handleAddLine}
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("qot.addItem")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isTable && (
            <View className="flex-row items-center gap-1.5 mb-1 px-0.5">
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { flex: 1.6, minWidth: 140 }]}>{t("qot.productName")}<RequiredMark /></Text>
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { flex: 1, minWidth: 110 }]}>{t("qot.details")}</Text>
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { width: 68 }]}>{t("qot.quantity")}</Text>
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { width: 76 }]}>{t("qot.unit")}</Text>
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { width: 100 }]}>{t("qot.unitPrice")}</Text>
              <Text className="text-[10px] font-medium" style={[{ color: colors.textMuted }, { width: 78 }]}>{t("qot.currency")}</Text>
              <Text className="text-[10px] font-medium text-right" style={[{ color: colors.textMuted }, { width: 100 }]}>{t("qot.total")}</Text>
              <View style={{ width: 32 }} />
            </View>
          )}

          {form.lines.map((line, idx) => {
            const lineTotal = round2(parseNumericInput(line.quantity) * parseNumericInput(line.unitPrice));
            const nameHasError = requiredErrors.lines.includes(idx);
            const nameBlock = (
              <View className={isTable ? "" : "flex-1"} style={isTable ? { flex: 1.6, minWidth: 140 } : undefined}>
                {!isTable && (
                  <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>
                    {t("qot.productName")}
                    <RequiredMark />
                  </Text>
                )}
                <View className="flex-row items-center">
                      <TextInput
                        className="flex-1 h-9 border rounded-lg px-2.5 text-sm"
                        style={{ backgroundColor: colors.bgCard2, borderColor: nameHasError ? colors.danger : colors.border, color: colors.text }}
                        placeholder={t("qot.productNamePlaceholder")}
                        placeholderTextColor={colors.textMuted}
                        value={line.name}
                        onChangeText={(v) => {
                          updateLine(idx, "name", v);
                          searchStock(v, idx);
                        }}
                      />
                      {line.name ? (
                        <TouchableOpacity
                          onPress={() => {
                            updateLine(idx, "name", "");
                            setStockSuggestions([]);
                            setSavedNameSuggestions([]);
                            setStockSearchIdx(null);
                          }}
                          className="h-9 w-8 items-center justify-center"
                        >
                          <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      ) : null}
                      {line.name ? (
                        <TouchableOpacity
                          onPress={() => saveNameFromLine(idx)}
                          className={isTable ? "h-9 w-7 items-center justify-center ml-0.5" : "h-9 flex-row items-center justify-center gap-1 border rounded-lg px-2 ml-1"}
                          style={isTable ? undefined : { borderColor: colors.border, backgroundColor: colors.bgCard2 }}
                          accessibilityRole="button"
                          accessibilityLabel={t("qot.saveName")}
                        >
                          <Ionicons name="bookmark-outline" size={14} color={colors.purple} />
                          {!isTable && (
                            <Text className="text-xs font-medium" style={{ color: colors.purple }} numberOfLines={1}>
                              {t("qot.saveName")}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {nameHasError && (
                      <Text className="text-[10px] mt-1" style={{ color: colors.danger }}>
                        {t("qot.requiredLineName", { n: String(idx + 1) })} {t("qot.fieldRequired")}
                      </Text>
                    )}
                    {stockSearchIdx === idx && (stockSuggestions.length > 0 || savedNameSuggestions.length > 0) ? (
                      <ScrollView
                        nestedScrollEnabled
                        className="rounded-lg border mt-1"
                        style={{ backgroundColor: colors.bgCard, borderColor: colors.border, maxHeight: 240 }}
                        keyboardShouldPersistTaps="always"
                        indicatorStyle={colors.indicatorBg as any}
                      >
                        {stockSuggestions.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            className="px-3 py-2"
                            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                            onPress={() => selectStockItem(idx, s)}
                          >
                            <Text className="text-sm" style={{ color: colors.text }} numberOfLines={1}>{s.name}</Text>
                            <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                              {s.quantity} {s.unit} {s.supplierName ? `· ${s.supplierName}` : ""}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {savedNameSuggestions.map((s) => (
                          <TouchableOpacity
                            key={`saved-${s.id}`}
                            className="px-3 py-2"
                            style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
                            onPress={() => pickSavedName(idx, s.name)}
                          >
                            <Text className="text-sm" style={{ color: colors.text }} numberOfLines={1}>{s.name}</Text>
                            <Text className="text-[10px]" style={{ color: colors.purple }}>
                              {t("qot.savedName")}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : null}
                </View>
            );

            const deleteBtn = (
              <TouchableOpacity
                onPress={() => removeLine(idx)}
                disabled={form.lines.length <= 1}
                style={{ opacity: form.lines.length <= 1 ? 0.3 : 1 }}
                className={isTable ? "h-9 w-8 items-center justify-center" : "h-9 w-9 items-center justify-center"}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            );

            if (isTable) {
              return (
                <View key={idx} className="flex-row items-start gap-1.5 mb-2">
                  {nameBlock}
                  <View style={{ flex: 1, minWidth: 110 }}>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      placeholder={t("qot.detailsPlaceholder")}
                      placeholderTextColor={colors.textMuted}
                      value={line.details}
                      onChangeText={(v) => updateLine(idx, "details", v)}
                    />
                  </View>
                  <View style={{ width: 68 }}>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2 text-sm text-right"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={line.quantity}
                      onChangeText={(v) => updateLine(idx, "quantity", v)}
                    />
                  </View>
                  <View style={{ width: 76 }}>
                    <TouchableOpacity
                      className="h-9 border rounded-lg px-1.5 flex-row items-center justify-center"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                      onPress={() => setUnitModalIdx(idx)}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }} numberOfLines={1}>{line.unit || "Adet"}</Text>
                      <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: 100 }}>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={line.unitPrice}
                      onChangeText={(v) => updateLine(idx, "unitPrice", v)}
                    />
                    {line.currency !== "TRY" && convertTry(parseNumericInput(line.unitPrice), line.currency) !== null && (
                      <Text className="text-[9px] mt-0.5" style={{ color: colors.textMuted }} numberOfLines={1}>
                        ≈ {formatMoney(convertTry(parseNumericInput(line.unitPrice), line.currency)!)} ₺
                      </Text>
                    )}
                  </View>
                  <View style={{ width: 78 }}>
                    <TouchableOpacity
                      className="h-9 border rounded-lg px-1.5 flex-row items-center justify-center"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                      onPress={() => setCurrencyModalIdx(idx)}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }}>{line.currency || "TRY"}</Text>
                      <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ width: 100 }} className="items-end">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{formatMoney(lineTotal)} {getCurrencySymbol(line.currency)}</Text>
                    {line.currency !== "TRY" && convertTry(lineTotal, line.currency) !== null && (
                      <Text className="text-[9px]" style={{ color: colors.textMuted }} numberOfLines={1}>≈ {formatMoney(convertTry(lineTotal, line.currency)!)} ₺</Text>
                    )}
                  </View>
                  {deleteBtn}
                </View>
              );
            }

            return (
              <View key={idx} className="rounded-xl border p-2.5 mb-2" style={{ backgroundColor: colors.bg, borderColor: colors.borderAlt }}>
                <View className="flex-row items-center gap-2 mb-2">
                  {nameBlock}
                  {deleteBtn}
                </View>
                <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.details")}</Text>
                <TextInput
                  className="w-full min-h-[36px] border rounded-lg px-2.5 py-1.5 text-sm mb-2"
                  style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                  placeholder={t("qot.detailsPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  value={line.details}
                  onChangeText={(v) => updateLine(idx, "details", v)}
                />
                <View className="flex-row flex-wrap items-start gap-2">
                  <View className="flex-1" style={{ minWidth: 100, maxWidth: isDesktop ? 150 : undefined }}>
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.quantity")}</Text>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={line.quantity}
                      onChangeText={(v) => updateLine(idx, "quantity", v)}
                    />
                  </View>
                  <View style={{ width: 84 }}>
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.unit")}</Text>
                    <TouchableOpacity
                      className="h-9 border rounded-lg px-2 flex-row items-center justify-center"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                      onPress={() => setUnitModalIdx(idx)}
                    >
                      <Text className="text-xs font-medium" style={{ color: colors.text }} numberOfLines={1}>{line.unit || "Adet"}</Text>
                      <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1" style={{ minWidth: 120, maxWidth: isDesktop ? 160 : undefined }}>
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.unitPrice")}</Text>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={line.unitPrice}
                      onChangeText={(v) => updateLine(idx, "unitPrice", v)}
                    />
                    {line.currency !== "TRY" && convertTry(parseNumericInput(line.unitPrice), line.currency) !== null && (
                      <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        ≈ {formatMoney(convertTry(parseNumericInput(line.unitPrice), line.currency)!)} ₺
                      </Text>
                    )}
                  </View>
                  <View style={{ width: 96 }}>
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.currency")}</Text>
                    <TouchableOpacity
                      className="h-9 border rounded-lg px-2 flex-row items-center justify-center"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                      onPress={() => setCurrencyModalIdx(idx)}
                    >
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{line.currency || "TRY"}</Text>
                      <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                  <View className="items-end" style={{ marginLeft: "auto" }}>
                    <Text className="text-[10px] font-medium mb-1" style={{ color: "transparent" }}>·</Text>
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(lineTotal)} {getCurrencySymbol(line.currency)}</Text>
                    {line.currency !== "TRY" && convertTry(lineTotal, line.currency) !== null && (
                      <Text className="text-[10px]" style={{ color: colors.textMuted }}>≈ {formatMoney(convertTry(lineTotal, line.currency)!)} ₺</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {!isTable && (
            <TouchableOpacity
              className="flex-row items-center justify-center h-10 rounded-xl border border-dashed mt-1"
              style={{ borderColor: colors.primary, backgroundColor: colors.primary + "0A" }}
              onPress={handleAddLine}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("qot.addItem")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: colors.bg }}>
          {currencyKeys.map((cur) => (
            <View key={cur}>
              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("qot.subtotal")} ({cur})</Text>
                <View className="items-end">
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    {formatMoney(currencyGroups[cur].subTotal)} {getCurrencySymbol(cur)}
                  </Text>
                  {cur !== "TRY" && convertTry(currencyGroups[cur].subTotal, cur) !== null && (
                    <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                      ≈ {formatMoney(convertTry(currencyGroups[cur].subTotal, cur)!)} ₺
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("qot.kdv")} %{Math.round(KDV_RATE * 100)}</Text>
                <View className="items-end">
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    {formatMoney(currencyGroups[cur].kdv)} {getCurrencySymbol(cur)}
                  </Text>
                  {cur !== "TRY" && convertTry(currencyGroups[cur].kdv, cur) !== null && (
                    <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                      ≈ {formatMoney(convertTry(currencyGroups[cur].kdv, cur)!)} ₺
                    </Text>
                  )}
                </View>
              </View>
              <View className="flex-row justify-between py-1 mt-1 border-t" style={{ borderColor: colors.border }}>
                <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("qot.grandTotal")} ({cur})</Text>
                <View className="items-end">
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {formatMoney(currencyGroups[cur].grandTotal)} {getCurrencySymbol(cur)}
                  </Text>
                  {cur !== "TRY" && convertTry(currencyGroups[cur].grandTotal, cur) !== null && (
                    <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>
                      ≈ {formatMoney(convertTry(currencyGroups[cur].grandTotal, cur)!)} ₺
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}

          {!rates && !loadingRates && (
            <View className="flex-row items-center justify-center mt-2 pt-2 border-t" style={{ borderColor: colors.border }}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text className="text-[11px] ml-1" style={{ color: colors.warning }}>{t("qot.ratesUnavailable")}</Text>
            </View>
          )}

          {rates && (
            <View className="mt-2 pt-2 border-t" style={{ borderColor: colors.border }}>
              <View className="flex-row justify-between py-0.5">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("qot.effectiveSellingRate")}</Text>
                <View className="flex-row items-center">
                  {ratesStale && <Ionicons name="warning-outline" size={13} color={colors.warning} style={{ marginRight: 4 }} />}
                  <Text className="text-xs" style={{ color: ratesStale ? colors.warning : colors.textMuted }}>
                    {rates.source}: {rates.rateDate}{ratesStale ? ` · ${t("qot.savedRate")}` : ""}
                  </Text>
                </View>
              </View>
              {currencyKeys.filter((cur) => cur !== "TRY").map((cur) => (
                <View key={cur} className="flex-row justify-between py-0.5">
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>1 {cur}</Text>
                  <Text className="text-xs font-medium" style={{ color: colors.text }}>
                    = {formatRate(rates.rates[cur])} ₺
                  </Text>
                </View>
              ))}
              <TouchableOpacity onPress={refreshRates} className="flex-row items-center justify-center mt-1">
                <Ionicons name="refresh-outline" size={12} color={colors.primary} />
                <Text className="text-[11px] font-medium ml-1" style={{ color: colors.primary }}>{t("qot.refreshRates")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {totalTryAvailable && (
            <View className="flex-row justify-between py-1 mt-1 border-t" style={{ borderColor: colors.primary }}>
              <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("qot.grandTotalTry")}</Text>
              <Text className="text-sm font-bold" style={{ color: colors.primary }}>≈ {formatMoney(totalTry)} ₺</Text>
            </View>
          )}
        </View>

        <View className="mb-3">
          <FieldLabel>{t("qot.notes")}</FieldLabel>
          <TextInput
            className="w-full min-h-[64px] border rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("qot.notesPlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={form.notes}
            onChangeText={(v) => updateForm("notes", v)}
          />
        </View>

        <View className="flex-row gap-2 mt-1">
          <TouchableOpacity
            className="h-10 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
            onPress={handleClear}
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh-outline" size={14} color={colors.danger} />
              <Text className="text-xs font-semibold ml-1" style={{ color: colors.danger }}>{t("qot.clear")}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleSave}
          >
            <Text className="font-semibold text-sm" style={{ color: "white" }}>{isEditing ? t("qot.update") : t("common.save")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={customerModalOpen} transparent animationType="fade" onRequestClose={() => setCustomerModalOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-md max-h-[70%] p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.selectCustomer")}</Text>
              <TouchableOpacity onPress={() => setCustomerModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.searchCustomer")}
              placeholderTextColor={colors.textMuted}
              value={customerSearch}
              onChangeText={setCustomerSearch}
            />
            <ScrollView nestedScrollEnabled className="max-h-60" indicatorStyle={colors.indicatorBg as any}>
              {customerList
                .filter((m) => {
                  if (!customerSearch) return true;
                  const q = customerSearch.toLowerCase();
                  return m.companyName.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q);
                })
                .map((m, i, arr) => (
                  <TouchableOpacity
                    key={m.id}
                    className="flex-row items-center px-3 py-3"
                    style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                    onPress={() => selectFromList(m)}
                  >
                    <Ionicons
                      name={selectedCustomerId === m.id ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={selectedCustomerId === m.id ? colors.primary : colors.textMuted}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{m.companyName}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{m.contactPerson}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            {customerList.length === 0 && (
              <Text className="text-xs mt-2 text-center" style={{ color: colors.textMuted }}>{t("qot.noCustomers")}</Text>
            )}
            <TouchableOpacity
              className="flex-row items-center justify-center h-10 rounded-lg mt-3"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={openNewCustomerModal}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.primary }}>{t("qot.addNewCustomer")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={newCustomerModal} transparent animationType="fade" onRequestClose={() => setNewCustomerModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.newCustomer")}</Text>
              <TouchableOpacity onPress={() => setNewCustomerModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FieldLabel required>{t("qot.companyName")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("svc.companyNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={newCustomerForm.companyName}
              onChangeText={(v) => updateNewCustomerForm("companyName", v)}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.subscriberNo")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.subscriberNoPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={newCustomerForm.subscriberNo}
              onChangeText={(v) => updateNewCustomerForm("subscriberNo", v)}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.address")}</Text>
            <View className="relative mb-3">
              <TextInput
                className="w-full h-10 border rounded-lg px-3 pr-10 text-sm"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("qot.addressPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.address}
                onChangeText={(v) => updateNewCustomerForm("address", v)}
              />
              <TouchableOpacity
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onPress={handleLocateNewAddress}
                disabled={locatingNewAddress}
              >
                {locatingNewAddress ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="locate-outline" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.email")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newCustomerForm.email}
              onChangeText={(v) => updateNewCustomerForm("email", v)}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.phone")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.phonePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newCustomerForm.phone}
              onChangeText={(v) => updateNewCustomerForm("phone", v)}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.contactPerson")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.contactPersonPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={newCustomerForm.contactPerson}
              onChangeText={(v) => updateNewCustomerForm("contactPerson", v)}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("qot.contactPhone")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-4"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.contactPhonePlaceholder")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newCustomerForm.contactPhone}
              onChangeText={(v) => updateNewCustomerForm("contactPhone", v)}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={() => setNewCustomerModal(false)}
              >
                <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                onPress={createNewCustomer}
              >
                <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={currencyModalIdx !== null} transparent animationType="fade" onRequestClose={() => setCurrencyModalIdx(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.currency")}</Text>
              <TouchableOpacity onPress={() => setCurrencyModalIdx(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c, i, arr) => (
              <TouchableOpacity
                key={c.code}
                className="flex-row items-center px-3 py-3"
                style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  if (currencyModalIdx !== null) updateLine(currencyModalIdx, "currency", c.code);
                  setCurrencyModalIdx(null);
                }}
              >
                <Text className="text-base mr-2" style={{ color: colors.text }}>{c.symbol}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium" style={{ color: colors.text }}>{c.code}</Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{c.label}</Text>
                </View>
                {c.code !== "TRY" && rates?.rates[c.code] ? (
                  <Text className="text-xs font-medium mr-2" style={{ color: colors.textSecondary }}>
                    1 {c.code} = {formatRate(rates.rates[c.code])} ₺
                  </Text>
                ) : null}
                {form.lines[currencyModalIdx ?? 0]?.currency === c.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            <View className="flex-row items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: colors.border }}>
              <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                {t("qot.effectiveSellingRate")}{rates ? ` · ${rates.rateDate}` : ""}
              </Text>
              <TouchableOpacity onPress={refreshRates} className="flex-row items-center">
                <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                <Text className="text-[11px] font-medium ml-1" style={{ color: colors.primary }}>{t("qot.refreshRates")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={unitModalIdx !== null} transparent animationType="fade" onRequestClose={() => setUnitModalIdx(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-60 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.unit")}</Text>
              <TouchableOpacity onPress={() => setUnitModalIdx(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {UNIT_OPTIONS.map((u, i, arr) => (
              <TouchableOpacity
                key={u}
                className="flex-row items-center px-3 py-3"
                style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  if (unitModalIdx !== null) updateLine(unitModalIdx, "unit", u);
                  setUnitModalIdx(null);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{u}</Text>
                {form.lines[unitModalIdx ?? 0]?.unit === u && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}
