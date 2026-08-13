import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCustomers } from "./CustomersContext";

export default function CustomerForm() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    formOpen,
    setFormOpen,
    editingCustomer,
    resetForm,
    newCompany,
    setNewCompany,
    newSubscriberNo,
    setNewSubscriberNo,
    newAddress,
    setNewAddress,
    newEmail,
    setNewEmail,
    newPhone,
    setNewPhone,
    newContact,
    setNewContact,
    newContactPhone,
    setNewContactPhone,
    handleSave,
    loading,
    setMapSelectorVisible,
  } = useCustomers();

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (formOpen) {
            resetForm();
          }
          setFormOpen(!formOpen);
        }}
        className="flex-row items-center justify-between rounded-2xl p-4 mb-4"
        style={{ backgroundColor: colors.bgCard }}
      >
        <Text className="text-lg font-bold" style={{ color: colors.text }}>
          {editingCustomer ? t("cst.editCustomer") : t("cst.newCustomer")}
        </Text>
        <Ionicons name={formOpen ? "chevron-up" : "chevron-down"} size={22} color={colors.primary} />
      </TouchableOpacity>

      {formOpen && (
        <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.bgCard }}>
          {editingCustomer && (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold" style={{ color: colors.text }}>{t("cst.editCustomer")}</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Ionicons name="close" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-3"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.companyName")}
            placeholderTextColor={colors.textMuted}
            value={newCompany}
            onChangeText={setNewCompany}
          />
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-3"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.subscriberNo")}
            placeholderTextColor={colors.textMuted}
            keyboardType="default"
            value={newSubscriberNo}
            onChangeText={setNewSubscriberNo}
          />
          <View className="relative mb-3">
            <TextInput
              className="rounded-lg px-4 py-3 text-sm pr-10"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.address")}
              placeholderTextColor={colors.textMuted}
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TouchableOpacity
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onPress={() => setMapSelectorVisible(true)}
            >
              <Ionicons name="locate-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-3"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.email")}
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            value={newEmail}
            onChangeText={setNewEmail}
          />
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-3"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.phone")}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={newPhone}
            onChangeText={(v) => setNewPhone(v.replace(/[^0-9]/g, ""))}
          />
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-3"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.contactPerson")}
            placeholderTextColor={colors.textMuted}
            value={newContact}
            onChangeText={setNewContact}
          />
          <TextInput
            className="rounded-lg px-4 py-3 text-sm mb-4"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            placeholder={t("cst.contactPhone")}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={newContactPhone}
            onChangeText={(v) => setNewContactPhone(v.replace(/[^0-9]/g, ""))}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="rounded-lg py-3 items-center"
            style={{ backgroundColor: colors.primary }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-sm font-bold" style={{ color: "white" }}>
                {editingCustomer ? t("svc.update") : t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
