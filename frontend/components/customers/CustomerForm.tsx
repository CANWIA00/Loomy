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
    newMonthlyFee,
    setNewMonthlyFee,
    newHasPaidMonthly,
    setNewHasPaidMonthly,
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

          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
            <Text className="text-sm font-bold mb-3" style={{ color: colors.text }}>{t("cst.paymentTitle")}</Text>
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.monthlyFee")}
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={newMonthlyFee}
              onChangeText={(v) => setNewMonthlyFee(v.replace(/[^0-9.,]/g, ""))}
            />
            <TouchableOpacity
              onPress={() => setNewHasPaidMonthly(!newHasPaidMonthly)}
              className="flex-row items-center justify-between rounded-lg px-3 py-3"
              style={{ backgroundColor: colors.bgCard }}
            >
              <View className="flex-row items-center gap-2 flex-1">
                <Ionicons
                  name={newHasPaidMonthly ? "checkmark-circle" : "time"}
                  size={18}
                  color={newHasPaidMonthly ? colors.success : colors.warning}
                />
                <Text className="text-sm" style={{ color: colors.textSecondary }}>{t("cst.paidThisMonth")}</Text>
              </View>
              <View
                className="w-11 h-6 rounded-full px-0.5"
                style={{ backgroundColor: newHasPaidMonthly ? colors.success : colors.bgInput, justifyContent: "center", alignItems: newHasPaidMonthly ? "flex-end" : "flex-start" }}
              >
                <View className="w-5 h-5 rounded-full" style={{ backgroundColor: "white" }} />
              </View>
            </TouchableOpacity>
          </View>
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
