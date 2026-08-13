import { useState, type ReactNode } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useServices } from "./ServicesContext";
import { type TemplateField, type TemplateChipGroup } from "./types";import SvgAwareImage from "../SvgAwareImage";
import { getCurrentAddress } from "../../utils/location";

const formatDateInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  return formatted;
};

const formatTimeInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10) || 0);
    const m = Math.min(59, parseInt(digits.slice(2), 10) || 0);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return digits;
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

function ChipGroupSection({ group }: { group: TemplateChipGroup }) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const { form, toggleChip, setGroupValue } = useServices();
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

function FeeTechnicianRow({ field }: { field: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm } = useServices();
  const label = lang === "tr" ? field.labelTr : field.labelEn;

  return (
    <View className="flex-row gap-3 mb-3">
      <View className="flex-1">
        <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{label}</Text>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={form.fee}
          onChangeText={(v) => updateForm("fee", v.replace(/[^0-9.]/g, ""))}
        />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.technician")}</Text>
        <View className="w-full h-10 border rounded-lg px-3 items-center justify-center flex-row" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Ionicons name="person-outline" size={14} color={colors.primary} />
          <Text className="text-sm ml-1.5 flex-1" numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.text }}>{form.technician || "-"}</Text>
        </View>
      </View>
    </View>
  );
}

function TechnicianField() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { form } = useServices();

  return (
    <View className="mb-3">
      <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.technician")}</Text>
      <View className="w-full h-10 border rounded-lg px-3 items-center justify-center flex-row" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
        <Ionicons name="person-outline" size={14} color={colors.primary} />
        <Text className="text-sm ml-1.5 flex-1" numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.text }}>{form.technician || "-"}</Text>
      </View>
    </View>
  );
}

function DocumentDateField({ field }: { field: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm } = useServices();
  const label = lang === "tr" ? field.labelTr : field.labelEn;

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

function CustomerRow({ address }: { address?: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm, setMapSelectorVisible } = useServices();

  return (
    <View className="flex-row gap-3 mb-3">
      <View className="flex-1">
        <FieldLabel>{t("svc.customerName")}</FieldLabel>
        <TextInput
          className="w-full h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.customerNamePlaceholder")}
          placeholderTextColor={colors.textMuted}
          value={form.customerName}
          onChangeText={(v) => updateForm("customerName", v)}
        />
      </View>
      {address && (
        <View className="flex-1">
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
      )}
    </View>
  );
}

function TimeRow({ start, end }: { start?: TemplateField; end?: TemplateField }) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const { form, updateForm } = useServices();

  const renderTimeField = (field: TemplateField, value: string, isEnd: boolean) => (
    <View className="flex-1">
      <FieldLabel>{labelOf(field, lang)}</FieldLabel>
      <View className="relative flex-1">
        <TextInput
          className="w-full h-10 border rounded-lg px-3 pr-20 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder="HH:MM"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={(v) => updateForm(isEnd ? "endTime" : "startTime", formatTimeInput(v))}
        />
        <View className="absolute right-0.5 top-0 bottom-0 flex-row items-center">
          <TouchableOpacity
            className="h-10 w-6 items-center justify-center"
            onPress={() => {
              const now = getCurrentTime();
              updateForm(isEnd ? "endTime" : "startTime", isEnd && now === form.startTime ? adjustTime(now, 10) : now);
            }}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity className="h-10 w-6 items-center justify-center" onPress={() => updateForm(isEnd ? "endTime" : "startTime", adjustTime(value, 10))}>
            <Ionicons name="chevron-up" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity className="h-10 w-6 items-center justify-center" onPress={() => updateForm(isEnd ? "endTime" : "startTime", adjustTime(value, -10))}>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-row gap-3 mb-3">
      {start && renderTimeField(start, form.startTime, false)}
      {end && renderTimeField(end, form.endTime, true)}
    </View>
  );
}

function ContactRow({ phone, internalIp }: { phone?: TemplateField; internalIp?: TemplateField }) {
  const { colors } = useTheme();
  const { lang, t } = useLanguage();
  const { form, updateForm } = useServices();

  return (
    <View className="flex-row gap-3 mb-3">
      {phone && (
        <View className="flex-1">
          <FieldLabel>{labelOf(phone, lang)}</FieldLabel>
          <TextInput
            className="w-full h-10 border rounded-lg px-3 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("svc.phonePlaceholder")}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => updateForm("phone", v)}
          />
        </View>
      )}
      {internalIp && (
        <View className="flex-1">
          <FieldLabel>{labelOf(internalIp, lang)}</FieldLabel>
          <TextInput
            className="w-full h-10 border rounded-lg px-3 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            value={form.internalIp}
            onChangeText={(v) => updateForm("internalIp", v)}
          />
        </View>
      )}
    </View>
  );
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
    return <FeeTechnicianRow field={field} />;
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
    setCustomerSelectModal(false);
    setNewCustomerModal(true);
  };

  const groups = templateConfig.chipGroups.filter((g) => g.enabled && g.options.length > 0).sort((a, b) => a.order - b.order);
  const fields = templateConfig.fields.filter((f) => f.enabled).sort((a, b) => a.order - b.order);

  const addressField = fields.find((f) => f.key === "serviceAddress");
  const startTimeField = fields.find((f) => f.key === "startTime");
  const endTimeField = fields.find((f) => f.key === "endTime");
  const phoneField = fields.find((f) => f.key === "phone");
  const internalIpField = fields.find((f) => f.key === "internalIp");
  const feeEnabled = fields.some((f) => f.key === "fee");

  const usedKeys = new Set(["serviceAddress", "startTime", "endTime", "phone", "internalIp"]);
  const soloFields = fields.filter((f) => !usedKeys.has(f.key));
  const orderedItems = [
    ...soloFields.map((f) => ({ kind: "field" as const, field: f })),
    ...groups.map((g) => ({ kind: "group" as const, group: g })),
  ].sort((a, b) =>
    (a.kind === "field" ? a.field.order : a.group.order) -
    (b.kind === "field" ? b.field.order : b.group.order)
  );

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
                keyboardType="numeric"
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

        <CustomerRow address={addressField} />

        {(startTimeField || endTimeField) && (
          <TimeRow start={startTimeField} end={endTimeField} />
        )}

        {(phoneField || internalIpField) && (
          <ContactRow phone={phoneField} internalIp={internalIpField} />
        )}

        {orderedItems.map((item) =>
          item.kind === "group" ? (
            <ChipGroupSection key={item.group.key} group={item.group} />
          ) : (
            <SingleField key={item.field.key} field={item.field} />
          )
        )}

        {!feeEnabled && <TechnicianField key="technician-only" />}

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
