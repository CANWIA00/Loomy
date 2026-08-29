import { useRef, useState, type ReactNode } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuotes } from "./QuoteContext";
import type { Customer } from "../../api/customers";
import { formatMoney, round2, KDV_RATE } from "./types";

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

function FieldLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{children}</Text>;
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
        {quickOptions.length > 0 && (
          <View className="flex-row items-center pr-1">
            <Text className="mx-1" style={{ color: colors.textMuted }}>/</Text>
            {quickOptions.map((opt, i) => (
              <TouchableOpacity
                key={opt.label}
                onPress={() => onChange(computeValidUntil(base, opt.days, opt.months))}
                style={{ paddingVertical: 8 }}
              >
                <View className="flex-row items-center">
                  {i > 0 && <Text className="mx-1" style={{ color: colors.textMuted }}>/</Text>}
                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>{opt.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function QuoteForm() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    form,
    updateForm,
    updateLine,
    addLine,
    removeLine,
    isEditing,
    handleCancelEditing,
    handleClear,
    handleSave,
    scrollRef,
    customerList,
    selectedCustomerId,
    clearCustomerSelection,
    selectCustomer,
    customerSelectModal,
    setCustomerSelectModal,
    customerSearch,
    setCustomerSearch,
  } = useQuotes();

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const addBtnRef = useRef<View>(null);

  const handleAddLine = () => {
    addLine();
    setTimeout(() => {
      addBtnRef.current?.measureLayout(
        scrollRef.current as any,
        (x, y) => { scrollRef.current?.scrollTo({ y: y - 80, animated: true }); },
        () => {}
      );
    }, 150);
  };

  const validLines = form.lines.filter((l) => l.name || l.details);
  const subTotal = round2(validLines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0));
  const kdv = round2(subTotal * KDV_RATE);
  const grandTotal = round2(subTotal + kdv);

  const selectFromList = (m: Customer) => selectCustomer(m);

  const openCustomerModal = () => {
    setCustomerSearch("");
    setCustomerModalOpen(true);
  };

  return (
    <>
      <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
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

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
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
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <FieldLabel>{t("qot.customerName")}</FieldLabel>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("qot.customerNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.customerName}
              onChangeText={(v) => updateForm("customerName", v)}
            />
          </View>
          <View className="flex-1">
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
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
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
          <View className="flex-1">
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
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
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
          <View className="flex-1">
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
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
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
          <View className="flex-1">
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

        <View className="flex-row gap-3">
          <DateField label={t("qot.documentDate")} value={form.documentDate} onChange={(v) => updateForm("documentDate", v)} placeholder={t("qot.datePlaceholder")} />
          <DateField
            label={t("qot.validUntil")}
            value={form.validUntil}
            onChange={(v) => updateForm("validUntil", v)}
            placeholder={t("qot.datePlaceholder")}
            base={form.documentDate}
            quickOptions={[
              { label: t("qot.valid1Day"), days: 1, months: 0 },
              { label: t("qot.valid1Week"), days: 7, months: 0 },
              { label: t("qot.valid2Week"), days: 14, months: 0 },
              { label: t("qot.valid1Month"), days: 0, months: 1 },
            ]}
          />
        </View>

        <View className="mt-3 mb-2">
          <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.text }}>{t("qot.items")}</Text>

          {form.lines.map((line, idx) => {
            const lineTotal = round2((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0));
            return (
              <View key={idx} className="rounded-xl border p-2.5 mb-2" style={{ backgroundColor: colors.bg, borderColor: colors.borderAlt }}>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.productName")}</Text>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      placeholder={t("qot.productNamePlaceholder")}
                      placeholderTextColor={colors.textMuted}
                      value={line.name}
                      onChangeText={(v) => updateLine(idx, "name", v)}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLine(idx)}
                    disabled={form.lines.length <= 1}
                    style={{ opacity: form.lines.length <= 1 ? 0.3 : 1 }}
                    className="h-9 w-9 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
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
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.quantity")}</Text>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={String(line.quantity)}
                      onChangeText={(v) => updateLine(idx, "quantity", v)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-medium mb-1" style={{ color: colors.textMuted }}>{t("qot.unitPrice")}</Text>
                    <TextInput
                      className="w-full h-9 border rounded-lg px-2.5 text-sm"
                      style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text }}
                      keyboardType="decimal-pad"
                      value={String(line.unitPrice)}
                      onChangeText={(v) => updateLine(idx, "unitPrice", v)}
                    />
                  </View>
                  <View className="flex-1 items-end justify-end pb-1.5">
                    <Text className="text-sm font-semibold" style={{ color: colors.text }}>{formatMoney(lineTotal)} ₺</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            ref={addBtnRef}
            className="flex-row items-center justify-center h-10 rounded-xl border border-dashed mt-1"
            style={{ borderColor: colors.primary, backgroundColor: colors.primary + "0A" }}
            onPress={handleAddLine}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("qot.addItem")}</Text>
          </TouchableOpacity>
        </View>

        <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: colors.bg }}>
          <View className="flex-row justify-between py-0.5">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("qot.subtotal")}</Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>{formatMoney(subTotal)} ₺</Text>
          </View>
          <View className="flex-row justify-between py-0.5">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>{t("qot.kdv")} %{Math.round(KDV_RATE * 100)}</Text>
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>{formatMoney(kdv)} ₺</Text>
          </View>
          <View className="flex-row justify-between py-1 mt-1 border-t" style={{ borderColor: colors.border }}>
            <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("qot.grandTotal")}</Text>
            <Text className="text-sm font-bold" style={{ color: colors.primary }}>{formatMoney(grandTotal)} ₺</Text>
          </View>
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
          </View>
        </View>
      </Modal>
    </>
  );
}
