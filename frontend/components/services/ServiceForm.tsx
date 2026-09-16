import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useServices } from "./ServicesContext";
import { type TemplateField, type TemplateChipGroup, effectiveFields, type UsedProductFormItem } from "./types";import SvgAwareImage from "../SvgAwareImage";
import { getCurrentAddress } from "../../utils/location";
import { stockApi, type StockItem } from "../../apiclient/stock";
import { UNIT_OPTIONS } from "../quotes/types";
import { useCurrency } from "../../contexts/CurrencyContext";
import { formatMoney, getCurrencySymbol, parseNumericInput, CURRENCIES } from "../stock/format";

const formatDateInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  return formatted;
};

const formatTimeInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const adjustTime = (value: string, deltaMinutes: number) => {
  const [h = 0, m = 0] = (value || "00:00").split(":").map((n) => parseInt(n, 10) || 0);
  const total = (h * 60 + m + deltaMinutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

const labelOf = (field: TemplateField, lang: string) => (lang === "tr" ? field.labelTr : field.labelEn);

function FieldLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{children}</Text>;
}

function FeeInput({ value, currency, onChangeFee, onChangeCurrency }: {
  value: string;
  currency: string;
  onChangeFee: (v: string) => void;
  onChangeCurrency: (c: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View>
      <View className="flex-row gap-2">
        <TextInput
          className="flex-1 h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(v) => onChangeFee(v.replace(/[^0-9.]/g, ""))}
        />
        <TouchableOpacity
          className="h-10 px-3 border rounded-lg flex-row items-center"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          onPress={() => setModalOpen(true)}
        >
          <Text className="text-sm font-medium" style={{ color: colors.text }}>{currency || "TRY"}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.currency")}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c, ci, arr) => (
              <TouchableOpacity
                key={c.code}
                className="flex-row items-center px-3 py-3"
                style={ci < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  onChangeCurrency(c.code);
                  setModalOpen(false);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{c.code}</Text>
                <Text className="text-xs mr-3" style={{ color: colors.textMuted }}>{c.symbol} · {c.label}</Text>
                {currency === c.code && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChipGroupSection({ group }: { group: TemplateChipGroup }) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const { form, toggleChip, setGroupValue, updateCustomField } = useServices();
  const [selectOpen, setSelectOpen] = useState(false);
  const label = lang === "tr" ? group.labelTr : group.labelEn;
  const inputType = group.inputType || "multi";

  const selected =
    group.key === "services"
      ? form.services
      : group.key === "technical"
        ? form.technical
        : form.customChips[group.key] || [];

  if (!group.options.length) return null;

  if (inputType === "text") {
    return (
      <View className="mb-3">
        <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{label}</Text>
        {group.options.map((opt) => {
          const optLabel = lang === "tr" ? opt.labelTr : opt.labelEn;
          const value = form.customValues[opt.key] || "";
          return (
            <View key={opt.key} className="mb-2">
              <Text className="text-[11px] mb-0.5" style={{ color: colors.textMuted }}>{optLabel}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                value={value}
                onChangeText={(v) => updateCustomField(opt.key, v)}
                placeholder={optLabel}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          );
        })}
      </View>
    );
  }

  if (inputType === "select") {
    const value = selected.length ? selected[selected.length - 1] : "";
    return (
      <View className="mb-3">
        <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{label}</Text>
        <TouchableOpacity
          className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          onPress={() => setSelectOpen(true)}
        >
          <Text className="text-sm flex-1" style={{ color: value ? colors.text : colors.textMuted }}>{value || label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <Modal visible={selectOpen} transparent animationType="fade" onRequestClose={() => setSelectOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{label}</Text>
                <TouchableOpacity onPress={() => setSelectOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {group.options.map((opt, i, arr) => {
                const optLabel = lang === "tr" ? opt.labelTr : opt.labelEn;
                const active = value === optLabel;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    className="flex-row items-center px-3 py-3"
                    style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                    onPress={() => {
                      setGroupValue(group.key, active ? [] : [optLabel]);
                      setSelectOpen(false);
                    }}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? colors.primary : colors.textMuted} />
                    <Text className="text-sm ml-3" style={{ color: colors.text }}>{optLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View className="mb-3">
      <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{label}</Text>
      <View className="flex-row flex-wrap gap-1.5">
        {group.options.map((opt) => {
          const optLabel = lang === "tr" ? opt.labelTr : opt.labelEn;
          const active = selected.includes(optLabel);
          if (inputType === "radio") {
            return (
              <TouchableOpacity
                key={opt.key}
                className="flex-row items-center px-2.5 h-7 rounded-lg border"
                style={{
                  backgroundColor: active ? colors.primary + '33' : colors.bg,
                  borderColor: active ? colors.primary : colors.border,
                }}
                onPress={() => setGroupValue(group.key, active ? [] : [optLabel])}
              >
                <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={14} color={colors.primary} />
                <Text className="text-[11px] ml-1" style={{ color: active ? colors.primary : colors.textSecondary }}>{optLabel}</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={opt.key}
              className="flex-row items-center px-2.5 h-7 rounded-lg border"
              style={{
                backgroundColor: active ? colors.primary + '33' : colors.bg,
                borderColor: active ? colors.primary : colors.border,
              }}
              onPress={() => toggleChip(group.key, optLabel)}
            >
              <Ionicons name="checkmark" size={12} color={colors.primary} />
              <Text
                className="text-[11px] ml-1"
                style={{ color: active ? colors.primary : colors.textSecondary }}
              >
                {optLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FieldCell({ field }: { field: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm, updateCustomField } = useServices();
  const label = labelOf(field, lang);

  const inputProps = {
    className: "w-full h-10 border rounded-lg px-3 text-sm",
    style: { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text },
    placeholderTextColor: colors.textMuted,
  };

  if (field.key === "technician") {
    return (
      <View className="flex-1 mb-3">
        <FieldLabel>{label}</FieldLabel>
        <View className="w-full h-10 border rounded-lg px-3 items-center justify-center flex-row" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Ionicons name="person-outline" size={14} color={colors.primary} />
          <Text className="text-sm ml-1.5 flex-1" numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.text }}>{form.technician || "-"}</Text>
        </View>
      </View>
    );
  }

  if (field.key === "fee") {
    return (
      <View className="flex-1 mb-3">
        <FieldLabel>{label}</FieldLabel>
        <FeeInput
          value={form.fee}
          currency={form.feeCurrency || "TRY"}
          onChangeFee={(v) => updateForm("fee", v)}
          onChangeCurrency={(c) => updateForm("feeCurrency", c)}
        />
      </View>
    );
  }

  if (field.key === "labor") {
    return (
      <View className="flex-1 mb-3">
        <FieldLabel>{label}</FieldLabel>
        <FeeInput
          value={form.labor}
          currency={form.laborCurrency || "TRY"}
          onChangeFee={(v) => updateForm("labor", v)}
          onChangeCurrency={(c) => updateForm("laborCurrency", c)}
        />
      </View>
    );
  }

  if (field.key === "kdv") {
    return (
      <View className="flex-1 mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          {...inputProps}
          placeholder={t("svc.kdvPlaceholder")}
          keyboardType="decimal-pad"
          value={form.kdvRate}
          onChangeText={(v) => updateForm("kdvRate", v.replace(/[^0-9.,]/g, "").slice(0, 5))}
        />
      </View>
    );
  }

  if (field.key === "phone") {
    return (
      <View className="flex-1 mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          {...inputProps}
          placeholder={t("svc.phonePlaceholder")}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => updateForm("phone", v)}
        />
      </View>
    );
  }

  const isCustom = field.key.startsWith("custom_");
  const customVal = isCustom
    ? form.customValues[field.key] || ""
    : field.key === "internalIp"
      ? form.internalIp
      : field.key === "externalIp"
        ? form.externalIp
        : form.customValues[field.key] || "";

  const customUpdate = (v: string) => {
    if (isCustom) updateCustomField(field.key, v);
    else if (field.key === "internalIp") updateForm("internalIp", v);
    else if (field.key === "externalIp") updateForm("externalIp", v);
    else updateCustomField(field.key, v);
  };

  return (
    <View className="flex-1 mb-3">
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        {...inputProps}
        placeholder={label}
        value={customVal}
        onChangeText={customUpdate}
      />
    </View>
  );
}

function FieldPairRow({ fields }: { fields: TemplateField[] }) {
  if (!fields.length) return null;
  const rows: TemplateField[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  return (
    <>
      {rows.map((row, ri) => (
        <View key={ri} className="flex-row gap-3">
          {row.map((f) => <FieldCell key={f.key} field={f} />)}
        </View>
      ))}
    </>
  );
}

function DocumentDateField({ field }: { field: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm } = useServices();
  const label = labelOf(field, lang);

  return (
    <View className="mb-3">
      <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{label}</Text>
      <View className="flex-row items-center">
        <TextInput
          className="flex-1 h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.datePlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={form.documentDate}
          onChangeText={(v) => updateForm("documentDate", formatDateInput(v))}
        />
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center ml-1"
          onPress={() => {
            const now = new Date();
            const tarih = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
            updateForm("documentDate", tarih);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CustomerRow({ customerName, address }: { customerName?: TemplateField; address?: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm, setMapSelectorVisible } = useServices();

  const cols: ReactNode[] = [];
  if (customerName) {
    cols.push(
      <View key="name" className="flex-1">
        <FieldLabel>{labelOf(customerName, lang)}</FieldLabel>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.customerNamePlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={form.customerName}
          onChangeText={(v) => updateForm("customerName", v)}
        />
      </View>
    );
  }
  if (address) {
    cols.push(
      <View key="address" className="flex-1">
        <FieldLabel>{labelOf(address, lang)}</FieldLabel>
        <View className="relative flex-1">
          <TextInput
            className="w-full h-10 border rounded-lg px-3 pr-10 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("svc.serviceAddressPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={form.serviceAddress}
            onChangeText={(v) => updateForm("serviceAddress", v)}
          />
          <TouchableOpacity className="absolute right-2 top-1/2 -translate-y-1/2" onPress={() => setMapSelectorVisible(true)}>
            <Ionicons name="locate-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  if (!cols.length) return null;
  return <View className="flex-row gap-3 mb-3">{cols}</View>;
}

function TimeRow({ start, end }: { start?: TemplateField; end?: TemplateField }) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const { form, updateForm } = useServices();

  const renderTimeField = (field: TemplateField, value: string, isEnd: boolean) => (
    <View key={field.key} className="flex-1">
      <FieldLabel>{labelOf(field, lang)}</FieldLabel>
      <View className="relative flex-1">
        <TextInput
          className="w-full h-10 border rounded-lg px-3 pr-28 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder="HH:MM"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={5}
          value={value}
          onChangeText={(v) => updateForm(isEnd ? "endTime" : "startTime", formatTimeInput(v))}
        />
        <View className="absolute right-1 top-0 bottom-0 flex-row items-center gap-0.5">
          <TouchableOpacity
            className="h-10 w-8 items-center justify-center"
            onPress={() => updateForm(isEnd ? "endTime" : "startTime", getCurrentTime())}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-8 items-center justify-center"
            onPress={() => updateForm(isEnd ? "endTime" : "startTime", adjustTime(value, 10))}
          >
            <Ionicons name="chevron-up" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 w-8 items-center justify-center"
            onPress={() => updateForm(isEnd ? "endTime" : "startTime", adjustTime(value, -10))}
          >
            <Ionicons name="chevron-down" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const cols: ReactNode[] = [];
  if (start) cols.push(renderTimeField(start, form.startTime, false));
  if (end) cols.push(renderTimeField(end, form.endTime, true));
  if (!cols.length) return null;
  return <View className="flex-row gap-3 mb-3">{cols}</View>;
}

function SingleField({ field }: { field: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm, updateCustomField } = useServices();
  const [selectOpen, setSelectOpen] = useState(false);
  const label = labelOf(field, lang);
  const inputType = field.inputType || "text";
  const options = field.options || [];
  const value = form.customValues[field.key] || "";
  const current = value ? value.split(",").filter(Boolean) : [];
  const toggleOption = (opt: string) => {
    const set = new Set(current);
    if (set.has(opt)) set.delete(opt);
    else set.add(opt);
    updateCustomField(field.key, [...set].join(","));
  };

  if (field.key === "externalIp") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          value={form.externalIp}
          onChangeText={(v) => updateForm("externalIp", v)}
        />
      </View>
    );
  }

  if (field.key === "details") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          className="w-full min-h-[64px] border rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.detailsPlaceholder")}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          value={form.details}
          onChangeText={(v) => updateForm("details", v)}
        />
      </View>
    );
  }

  if (field.key === "fee") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <FeeInput
          value={form.fee}
          currency={form.feeCurrency || "TRY"}
          onChangeFee={(v) => updateForm("fee", v)}
          onChangeCurrency={(c) => updateForm("feeCurrency", c)}
        />
      </View>
    );
  }

  if (field.key === "labor") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <FeeInput
          value={form.labor}
          currency={form.laborCurrency || "TRY"}
          onChangeFee={(v) => updateForm("labor", v)}
          onChangeCurrency={(c) => updateForm("laborCurrency", c)}
        />
      </View>
    );
  }

  if (field.key === "kdv") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.kdvPlaceholder")}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={form.kdvRate}
          onChangeText={(v) => updateForm("kdvRate", v.replace(/[^0-9.,]/g, "").slice(0, 5))}
        />
      </View>
    );
  }

  if (field.key === "documentDate") {
    return <DocumentDateField field={field} />;
  }

  if (inputType === "number") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={label}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(v) => updateCustomField(field.key, v.replace(/[^0-9.,]/g, ""))}
        />
      </View>
    );
  }

  if (inputType === "textarea") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TextInput
          className="w-full min-h-[64px] border rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={label}
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={(v) => updateCustomField(field.key, v)}
        />
      </View>
    );
  }

  if (inputType === "radio") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <View className="flex-row flex-wrap gap-1.5">
          {options.map((o) => {
            const oLabel = lang === "tr" ? o.labelTr : o.labelEn;
            const active = value === oLabel;
            return (
              <TouchableOpacity
                key={o.key}
                className="flex-row items-center px-2.5 h-7 rounded-lg border"
                style={{
                  backgroundColor: active ? colors.primary + '33' : colors.bg,
                  borderColor: active ? colors.primary : colors.border,
                }}
                onPress={() => updateCustomField(field.key, active ? "" : oLabel)}
              >
                <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={14} color={colors.primary} />
                <Text className="text-[11px] ml-1" style={{ color: active ? colors.primary : colors.textSecondary }}>{oLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (inputType === "multi") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <View className="flex-row flex-wrap gap-1.5">
          {options.map((o) => {
            const oLabel = lang === "tr" ? o.labelTr : o.labelEn;
            const active = current.includes(oLabel);
            return (
              <TouchableOpacity
                key={o.key}
                className="flex-row items-center px-2.5 h-7 rounded-lg border"
                style={{
                  backgroundColor: active ? colors.primary + '33' : colors.bg,
                  borderColor: active ? colors.primary : colors.border,
                }}
                onPress={() => toggleOption(oLabel)}
              >
                <Ionicons name="checkmark" size={12} color={colors.primary} />
                <Text className="text-[11px] ml-1" style={{ color: active ? colors.primary : colors.textSecondary }}>{oLabel}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (inputType === "select") {
    return (
      <View className="mb-3">
        <FieldLabel>{label}</FieldLabel>
        <TouchableOpacity
          className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          onPress={() => setSelectOpen(true)}
        >
          <Text className="text-sm flex-1" style={{ color: value ? colors.text : colors.textMuted }}>{value || label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <Modal visible={selectOpen} transparent animationType="fade" onRequestClose={() => setSelectOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{label}</Text>
                <TouchableOpacity onPress={() => setSelectOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {options.map((o, i, arr) => {
                const oLabel = lang === "tr" ? o.labelTr : o.labelEn;
                const active = value === oLabel;
                return (
                  <TouchableOpacity
                    key={o.key}
                    className="flex-row items-center px-3 py-3"
                    style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                    onPress={() => {
                      updateCustomField(field.key, active ? "" : oLabel);
                      setSelectOpen(false);
                    }}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? colors.primary : colors.textMuted} />
                    <Text className="text-sm ml-3" style={{ color: colors.text }}>{oLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View className="mb-3">
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm"
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={(v) => updateCustomField(field.key, v)}
      />
    </View>
  );
}

function UsedProductsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { form, addUsedProduct, updateUsedProduct, removeUsedProduct } = useServices();
  const { rates, convert } = useCurrency();
  const [suggestions, setSuggestions] = useState<StockItem[]>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [unitModalIdx, setUnitModalIdx] = useState<number | null>(null);
  const [currencyModalIdx, setCurrencyModalIdx] = useState<number | null>(null);
  const [totalCurrency, setTotalCurrency] = useState("TRY");
  const [totalCurrencyModal, setTotalCurrencyModal] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, index: number) => {
    setActiveRow(index);
    if (!q.trim()) { setSuggestions([]); return; }
    try {
      const res = await stockApi.list(q.trim(), 0, 5);
      setSuggestions(res.data.content);
    } catch { setSuggestions([]); }
  }, []);

  const onNameChange = useCallback((index: number, value: string) => {
    updateUsedProduct(index, { name: value, stockItemId: null });
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => runSearch(value, index), 400);
  }, [runSearch, updateUsedProduct]);

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  const pick = (index: number, item: StockItem) => {
    updateUsedProduct(index, {
      name: item.name,
      unit: item.unit,
      unitPrice: item.unitPrice != null ? String(item.unitPrice) : "",
      currency: item.currency || "TRY",
      stockItemId: item.id,
      inStock: true,
    });
    setSuggestions([]);
    setActiveRow(null);
  };

  const items = form.usedProducts || [];
  const notInStockCount = items.filter((p) => p.stockItemId == null && p.name.trim()).length;

  const lineTotal = (p: UsedProductFormItem) => (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0);
  const perCurrency = items.reduce<Record<string, number>>((acc, p) => {
    const cur = p.currency || "TRY";
    acc[cur] = (acc[cur] || 0) + lineTotal(p);
    return acc;
  }, {});

  const feeValue = parseNumericInput(form.fee || "");
  const feeCurrency = form.feeCurrency || "TRY";
  const laborValue = parseNumericInput(form.labor || "");
  const laborCurrency = form.laborCurrency || "TRY";
  const kdvRate = parseNumericInput(form.kdvRate || "20") / 100;
  let totalTry = 0;
  let conversionOk = true;
  Object.entries(perCurrency).forEach(([cur, amt]) => {
    if (!amt) return;
    if (cur === "TRY") { totalTry += amt; return; }
    const conv = convert(amt, cur);
    if (conv != null) totalTry += conv;
    else conversionOk = false;
  });
  if (feeValue > 0) {
    if (feeCurrency === "TRY") totalTry += feeValue;
    else {
      const conv = convert(feeValue, feeCurrency);
      if (conv != null) totalTry += conv;
      else conversionOk = false;
    }
  }
  if (laborValue > 0) {
    if (laborCurrency === "TRY") totalTry += laborValue;
    else {
      const conv = convert(laborValue, laborCurrency);
      if (conv != null) totalTry += conv;
      else conversionOk = false;
    }
  }

  const baseTry = totalTry;
  const kdvTry = baseTry * kdvRate;
  totalTry = baseTry + kdvTry;

  let grandTotal: number | null = null;
  let kdvDisplay: number | null = null;
  if (totalCurrency === "TRY") {
    grandTotal = totalTry;
    kdvDisplay = kdvTry;
  } else {
    const rate = rates?.rates[totalCurrency];
    if (rate) {
      grandTotal = totalTry / rate;
      kdvDisplay = kdvTry / rate;
    }
  }

  const hasAmounts = Object.keys(perCurrency).length > 0 || feeValue > 0 || laborValue > 0;

  return (
    <View className="mb-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="cube-outline" size={16} color={colors.primary} />
        <Text className="text-sm font-medium" style={{ color: colors.text }}>{t("svc.usedProducts")}</Text>
        {items.length > 0 && (
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + "1A" }}>
            <Text className="text-[10px] font-semibold" style={{ color: colors.primary }}>
              {t("svc.usedProductsCount").replace("{count}", String(items.length))}
            </Text>
          </View>
        )}
      </View>

      {items.map((p, i) => (
        <View key={i} className="rounded-xl p-3 mb-2" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, zIndex: activeRow === i ? 100 : 0 }}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{t("svc.productName")}</Text>
            <TouchableOpacity onPress={() => removeUsedProduct(i)} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <View style={{ position: "relative", zIndex: activeRow === i ? 1000 : undefined }}>
            <TextInput
              className="w-full h-9 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
              placeholder={t("svc.productNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={p.name}
              onChangeText={(v) => onNameChange(i, v)}
              onFocus={() => { setActiveRow(i); if (p.name.trim()) runSearch(p.name, i); }}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            />
            {activeRow === i && suggestions.length > 0 && (
              <View className="overflow-hidden" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, borderRadius: 8, position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4, zIndex: 1000, elevation: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" className="max-h-56">
                  {suggestions.map((s, si, arr) => (
                    <TouchableOpacity key={s.id} className="px-3 py-2" style={{ backgroundColor: colors.bgCard, ...(si < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}) }} onPress={() => pick(i, s)}>
                      <Text className="text-sm" style={{ color: colors.text }}>{s.name}</Text>
                      <Text className="text-[11px]" style={{ color: colors.textMuted }}>{s.unit} · {s.quantity}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View className="flex-row gap-2 mt-2">
            <View className="flex-1">
              <Text className="text-[11px] mb-0.5" style={{ color: colors.textMuted }}>{t("svc.qty")}</Text>
              <TextInput
                className="w-full h-9 border rounded-lg px-3 text-sm"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={p.quantity}
                onChangeText={(v) => updateUsedProduct(i, { quantity: v.replace(/[^0-9.]/g, "") })}
              />
            </View>
            <View style={{ width: 84 }}>
              <Text className="text-[11px] mb-0.5" style={{ color: colors.textMuted }}>{t("svc.unit")}</Text>
              <TouchableOpacity
                className="w-full h-9 border rounded-lg px-2 flex-row items-center justify-center"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                onPress={() => setUnitModalIdx(i)}
              >
                <Text className="text-xs font-medium" style={{ color: colors.text }} numberOfLines={1}>{p.unit || "Adet"}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] mb-0.5" style={{ color: colors.textMuted }}>{t("svc.price")}</Text>
              <TextInput
                className="w-full h-9 border rounded-lg px-3 text-sm"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={p.unitPrice}
                onChangeText={(v) => updateUsedProduct(i, { unitPrice: v.replace(/[^0-9.]/g, "") })}
              />
            </View>
            <View style={{ width: 84 }}>
              <Text className="text-[11px] mb-0.5" style={{ color: colors.textMuted }}>{t("svc.currency")}</Text>
              <TouchableOpacity
                className="w-full h-9 border rounded-lg px-2 flex-row items-center justify-center"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
                onPress={() => setCurrencyModalIdx(i)}
              >
                <Text className="text-xs font-medium" style={{ color: colors.text }} numberOfLines={1}>{p.currency || "TRY"}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>

          {p.stockItemId != null && p.inStock !== false && (
            <View className="flex-row items-center gap-1 mt-2">
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
              <Text className="text-[10px]" style={{ color: "#10B981" }}>{t("svc.inStock")}</Text>
            </View>
          )}
        </View>
      ))}

            {notInStockCount > 0 && (
        <Text className="text-xs mb-2" style={{ color: colors.warning }}>
          {t("svc.notInStockCount").replace("{count}", String(notInStockCount))}
        </Text>
      )}

      {hasAmounts && (
        <View className="rounded-xl p-3 mb-2" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}>
          {Object.entries(perCurrency).filter(([, amt]) => amt > 0).map(([cur, amt]) => (
            <View key={cur} className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {t("svc.subtotal")} {getCurrencySymbol(cur)}
              </Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(amt, cur)}</Text>
            </View>
          ))}
          {laborValue > 0 && (
            <View className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {t("svc.laborLabel")} {getCurrencySymbol(laborCurrency)}
              </Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(laborValue, laborCurrency)}</Text>
            </View>
          )}
          {feeValue > 0 && (
            <View className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {t("svc.serviceFeeLabel")} {getCurrencySymbol(feeCurrency)}
              </Text>
              <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(feeValue, feeCurrency)}</Text>
            </View>
          )}
          {kdvRate > 0 && (
            <View className="flex-row items-center justify-between py-0.5">
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                KDV ({Math.round(kdvRate * 100)}%)
              </Text>
              {kdvDisplay != null ? (
                <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(kdvDisplay, totalCurrency)}</Text>
              ) : (
                <Text className="text-xs" style={{ color: colors.warning }}>{t("svc.ratesNote")}</Text>
              )}
            </View>
          )}
          <View className="flex-row items-center justify-between pt-2 mt-1 border-t" style={{ borderColor: colors.borderAlt }}>
            <View className="flex-row items-center gap-2 flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("svc.grandTotal")}</Text>
              <TouchableOpacity
                className="h-7 px-2 rounded-lg flex-row items-center"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}
                onPress={() => setTotalCurrencyModal(true)}
              >
                <Text className="text-xs font-medium" style={{ color: colors.text }}>{totalCurrency}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
            {grandTotal != null ? (
              <Text className="text-base font-bold" style={{ color: colors.primary }}>{formatMoney(grandTotal, totalCurrency)}</Text>
            ) : (
              <Text className="text-xs" style={{ color: colors.warning }}>{t("svc.ratesNote")}</Text>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        className="h-9 rounded-lg items-center justify-center flex-row gap-1.5 border"
        style={{ borderColor: colors.border, backgroundColor: colors.bg }}
        onPress={addUsedProduct}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text className="text-xs font-medium" style={{ color: colors.primary }}>{t("svc.addProduct")}</Text>
      </TouchableOpacity>

      <Modal visible={unitModalIdx !== null} transparent animationType="fade" onRequestClose={() => setUnitModalIdx(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-60 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.unit")}</Text>
              <TouchableOpacity onPress={() => setUnitModalIdx(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {UNIT_OPTIONS.map((u, ui, arr) => (
              <TouchableOpacity
                key={u}
                className="flex-row items-center px-3 py-3"
                style={ui < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  if (unitModalIdx !== null) updateUsedProduct(unitModalIdx, { unit: u });
                  setUnitModalIdx(null);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{u}</Text>
                {items[unitModalIdx ?? 0]?.unit === u && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={currencyModalIdx !== null} transparent animationType="fade" onRequestClose={() => setCurrencyModalIdx(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.currency")}</Text>
              <TouchableOpacity onPress={() => setCurrencyModalIdx(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c, ci, arr) => (
              <TouchableOpacity
                key={c.code}
                className="flex-row items-center px-3 py-3"
                style={ci < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  if (currencyModalIdx !== null) updateUsedProduct(currencyModalIdx, { currency: c.code });
                  setCurrencyModalIdx(null);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{c.code}</Text>
                <Text className="text-xs mr-3" style={{ color: colors.textMuted }}>{c.symbol} · {c.label}</Text>
                {items[currencyModalIdx ?? 0]?.currency === c.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={totalCurrencyModal} transparent animationType="fade" onRequestClose={() => setTotalCurrencyModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-72 p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.currency")}</Text>
              <TouchableOpacity onPress={() => setTotalCurrencyModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            {CURRENCIES.map((c, ci, arr) => (
              <TouchableOpacity
                key={c.code}
                className="flex-row items-center px-3 py-3"
                style={ci < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                onPress={() => {
                  setTotalCurrency(c.code);
                  setTotalCurrencyModal(false);
                }}
              >
                <Text className="text-sm font-medium flex-1" style={{ color: colors.text }}>{c.code}</Text>
                <Text className="text-xs mr-3" style={{ color: colors.textMuted }}>{c.symbol} · {c.label}</Text>
                {totalCurrency === c.code && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ServiceForm() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    companyLogo,
    form,
    updateForm,
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
    templates,
    activeTemplate,
    selectTemplate,
    templateConfig,
  } = useServices();

  const isAdmin = user?.role === "ADMIN";
  const [locatingNewAddress, setLocatingNewAddress] = useState(false);

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

  const selectCustomerFromList = (m: { id: string; companyName: string; address?: string; phone?: string }) =>
    selectCustomer(m.id, m.companyName, m.address || "", m.phone || "");

  const openNewCustomerModal = () => {
    resetNewCustomerForm();
    setCustomerSelectModal(false);
    setNewCustomerModal(true);
  };

  const groups = templateConfig.chipGroups.filter((g) => g.enabled !== false && g.options.length > 0).sort((a, b) => a.order - b.order);
  const fields = effectiveFields(templateConfig);

  const customerNameField = fields.find((f) => f.key === "customerName");
  const addressField = fields.find((f) => f.key === "serviceAddress");
  const startTimeField = fields.find((f) => f.key === "startTime");
  const endTimeField = fields.find((f) => f.key === "endTime");
  const phoneField = fields.find((f) => f.key === "phone");
  const technicianField = fields.find((f) => f.key === "technician");
  const documentDateField = fields.find((f) => f.key === "documentDate");
  const detailsField = fields.find((f) => f.key === "details");
  const feeField = fields.find((f) => f.key === "fee");
  const laborField = fields.find((f) => f.key === "labor");
  const kdvField = fields.find((f) => f.key === "kdv");
  const customFields = fields.filter((f) => f.key.startsWith("custom_"));

  const orderedGroups = [...groups].sort((a, b) => a.order - b.order);

  return (
    <>
      <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            {companyLogo && (
              <SvgAwareImage
                uri={companyLogo}
                style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.bg }}
                resizeMode="contain"
              />
            )}
            <Text className="font-semibold text-base ml-2" style={{ color: colors.text }}>
              {isEditing ? t("svc.editRecord") : t("svc.newRecord")}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {isAdmin && (
              <TouchableOpacity onPress={() => router.push("/templates")} className="flex-row items-center h-7 px-2.5 rounded-lg" style={{ backgroundColor: colors.bgInput }}>
                <Ionicons name="settings-outline" size={14} color={colors.primary} />
                <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.manage")}</Text>
              </TouchableOpacity>
            )}
            {isEditing && (
              <TouchableOpacity onPress={handleCancelEditing} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                <Ionicons name="close-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {templates.length > 0 && (
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{t("tpl.formLabel")}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-1.5">
                {templates.map((tpl) => {
                  const active = activeTemplate?.id === tpl.id;
                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      className="flex-row items-center px-3 h-8 rounded-lg border"
                      style={{
                        backgroundColor: active ? colors.primary + '1A' : colors.bg,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                      onPress={() => selectTemplate(tpl.id)}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: active ? colors.primary : colors.textSecondary }}
                      >
                        {tpl.name}
                      </Text>
                      {tpl.isDefault && <Ionicons name="star" size={10} color={colors.warning} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.selectCustomer")}</Text>
            <TouchableOpacity
              className="flex-row items-center h-10 border rounded-lg px-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}
              onPress={() => { setCustomerSearch(""); setCustomerSelectModal(true); }}
            >
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <Text className="text-sm ml-2 flex-1" style={{ color: selectedCustomerId ? colors.text : colors.textMuted }}>
                {selectedCustomerId ? customerList.find((m) => m.id === selectedCustomerId)?.companyName : t("svc.searchCustomer")}
              </Text>
              {selectedCustomerId && (
                <TouchableOpacity onPress={clearCustomerSelection}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {!selectedCustomerId && <Ionicons name="chevron-down" size={16} color={colors.textMuted} />}
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={customerSelectModal} transparent animationType="fade" onRequestClose={() => setCustomerSelectModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md max-h-[70%] p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.selectCustomer")}</Text>
                <View className="flex-row items-center gap-3">
                  {selectedCustomerId && (
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => {
                        clearCustomerSelection();
                        setCustomerSelectModal(false);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                      <Text className="text-xs font-medium ml-1" style={{ color: colors.danger }}>{t("svc.clearSelection")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setCustomerSelectModal(false)}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.searchCustomer")}
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
                      onPress={() => selectCustomerFromList(m)}
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
              <TouchableOpacity
                className="flex-row items-center justify-center h-10 rounded-lg mt-3"
                style={{ backgroundColor: colors.primary + '15' }}
                onPress={openNewCustomerModal}
              >
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.primary }}>{t("svc.addNewCustomer")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={newCustomerModal} transparent animationType="fade" onRequestClose={() => setNewCustomerModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.newCustomer")}</Text>
                <TouchableOpacity onPress={() => setNewCustomerModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.companyName")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.companyNamePlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.companyName}
                onChangeText={(v) => updateNewCustomerForm("companyName", v)}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.subscriberNo")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.subscriberNo")}
                placeholderTextColor={colors.textMuted}
                keyboardType="default"
                value={newCustomerForm.subscriberNo}
                onChangeText={(v) => updateNewCustomerForm("subscriberNo", v)}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.address")}</Text>
              <View className="relative mb-3">
                <TextInput
                  className="w-full h-10 border rounded-lg px-3 pr-10 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder={t("svc.serviceAddressPlaceholder")}
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
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.email")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.email")}
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={newCustomerForm.email}
                onChangeText={(v) => updateNewCustomerForm("email", v)}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.phone")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.phonePlaceholder")}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newCustomerForm.phone}
                onChangeText={(v) => updateNewCustomerForm("phone", v)}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.contactPerson")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.contactPersonPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.contactPerson}
                onChangeText={(v) => updateNewCustomerForm("contactPerson", v)}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.contactPhone")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-4"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.contactPhonePlaceholder")}
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
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.cancel")}</Text>
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

        <CustomerRow customerName={customerNameField} address={addressField} />

        <TimeRow start={startTimeField} end={endTimeField} />

        <FieldPairRow fields={[phoneField, ...customFields].filter((f): f is TemplateField => !!f)} />

        {orderedGroups.map((g) => (
          <ChipGroupSection key={g.key} group={g} />
        ))}

        {detailsField && <SingleField field={detailsField} />}

        <FieldPairRow fields={[feeField, laborField, kdvField, technicianField].filter((f): f is TemplateField => !!f)} />

        {documentDateField && <DocumentDateField field={documentDateField} />}

        <UsedProductsSection />

        <View className="flex-row gap-2 mt-1">
          <TouchableOpacity
            className="h-10 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
            onPress={handleClear}
          >
            <View className="flex-row items-center">
              <Ionicons name="refresh-outline" size={14} color={colors.danger} />
              <Text className="text-xs font-semibold ml-1" style={{ color: colors.danger }}>{t("svc.clear")}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 h-10 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handleSave}
          >
            <Text className="font-semibold text-sm" style={{ color: "white" }}>{isEditing ? t("svc.update") : t("common.save")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
