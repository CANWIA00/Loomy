import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useServices } from "./ServicesContext";
import { serviceKeys, technicalKeys } from "./types";

const formatTimeInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2);
  return formatted;
};

const formatDateInput = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  return formatted;
};

export default function ServiceForm() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    form,
    updateForm,
    toggleService,
    toggleTechnical,
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
    setMapSelectorVisible,
  } = useServices();

  const serviceList = serviceKeys.map((k) => t(`svc.list.${k}`));
  const technicalList = technicalKeys.map((k) => t(`svc.tech.${k}`));

  const selectCustomerFromList = (m: { id: string; companyName: string; address?: string; phone?: string }) =>
    selectCustomer(m.id, m.companyName, m.address || "", m.phone || "");

  const openNewCustomerModal = () => {
    setCustomerSelectModal(false);
    setNewCustomerModal(true);
  };

  return (
    <>
      <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-base" style={{ color: colors.text }}>
            {isEditing ? t("svc.editRecord") : t("svc.newRecord")}
          </Text>
          <View className="flex-row items-center gap-2">
            {isEditing && (
              <TouchableOpacity onPress={handleCancelEditing} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                <Ionicons name="close-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClear} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
              <Ionicons name="refresh-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

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
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.address")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.serviceAddressPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.address}
                onChangeText={(v) => updateNewCustomerForm("address", v)}
              />
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

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.customerName")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("svc.customerNamePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.customerName}
              onChangeText={(v) => updateForm("customerName", v)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.serviceAddress")}</Text>
            <View className="relative flex-1">
              <TextInput
                className="w-full h-10 border rounded-lg px-3 pr-10 text-sm"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.serviceAddressPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={form.serviceAddress}
                onChangeText={(v) => updateForm("serviceAddress", v)}
              />
              <TouchableOpacity
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onPress={() => setMapSelectorVisible(true)}
              >
                <Ionicons name="locate-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.startTime")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              value={form.startTime}
              onChangeText={(v) => updateForm("startTime", formatTimeInput(v))}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.endTime")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              value={form.endTime}
              onChangeText={(v) => updateForm("endTime", formatTimeInput(v))}
            />
          </View>
        </View>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.customerPhone")}</Text>
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
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.internalIp")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("svc.internalIpPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.internalIp}
              onChangeText={(v) => updateForm("internalIp", v)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.externalIp")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder={t("svc.externalIpPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={form.externalIp}
              onChangeText={(v) => updateForm("externalIp", v)}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.serviceServices")}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {serviceList.map((h) => (
              <TouchableOpacity
                key={h}
                className="flex-row items-center px-2.5 h-7 rounded-lg border"
                style={{
                  backgroundColor: form.services.includes(h) ? colors.primary + '33' : colors.bg,
                  borderColor: form.services.includes(h) ? colors.primary : colors.border,
                }}
                onPress={() => toggleService(h)}
              >
                {form.services.includes(h) && (
                  <Ionicons name="checkmark" size={12} color={colors.primary} />
                )}
                <Text
                  className="text-[11px] ml-1"
                  style={{ color: form.services.includes(h) ? colors.primary : colors.textSecondary }}
                >
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.technicalServices")}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {technicalList.map((ti) => (
              <TouchableOpacity
                key={ti}
                className="flex-row items-center px-2.5 h-7 rounded-lg border"
                style={{
                  backgroundColor: form.technical.includes(ti) ? colors.primary + '33' : colors.bg,
                  borderColor: form.technical.includes(ti) ? colors.primary : colors.border,
                }}
                onPress={() => toggleTechnical(ti)}
              >
                {form.technical.includes(ti) && (
                  <Ionicons name="checkmark" size={12} color={colors.primary} />
                )}
                <Text
                  className="text-[11px] ml-1"
                  style={{ color: form.technical.includes(ti) ? colors.primary : colors.textSecondary }}
                >
                  {ti}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.details")}</Text>
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

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.serviceFee")}</Text>
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
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.technician")}</Text>
            <View className="w-full h-10 border rounded-lg px-3 items-center justify-center flex-row" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text className="text-sm ml-1.5 flex-1" numberOfLines={1} ellipsizeMode="tail" style={{ color: colors.text }}>{form.technician || "-"}</Text>
            </View>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.documentDate")}</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder="GG/AA/YYYY"
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

        <TouchableOpacity
          className="w-full h-10 rounded-lg items-center justify-center mt-1"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
        >
          <Text className="font-semibold text-sm" style={{ color: "white" }}>{isEditing ? t("svc.update") : t("common.save")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
