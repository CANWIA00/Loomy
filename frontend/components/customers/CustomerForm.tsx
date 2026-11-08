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
    newFax,
    setNewFax,
    newWebsite,
    setNewWebsite,
    handleSave,
    loading,
    setMapSelectorVisible,
  } = useCustomers();

  const inputStyle = {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    minHeight: 40,
  } as const;

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (formOpen) resetForm();
          setFormOpen(!formOpen);
        }}
        className="flex-row items-center justify-between rounded-xl px-3 py-2.5 mb-3"
        style={{ backgroundColor: colors.bgCard }}
      >
        <Text className="text-[15px] font-semibold" style={{ color: colors.text }}>
          {editingCustomer ? t("cst.editCustomer") : t("cst.newCustomer")}
        </Text>
        <Ionicons name={formOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
      </TouchableOpacity>

      {formOpen && (
        <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: colors.bgCard }}>
          {editingCustomer && (
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[13px] font-semibold" style={{ color: colors.text }}>{t("cst.editCustomer")}</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Ionicons name="close" size={14} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.companyName")}
              placeholderTextColor={colors.textMuted}
              value={newCompany}
              onChangeText={setNewCompany}
            />
            <TextInput
              className="w-[38%] rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.subscriberNo")}
              placeholderTextColor={colors.textMuted}
              keyboardType="default"
              value={newSubscriberNo}
              onChangeText={setNewSubscriberNo}
            />
          </View>

          <View className="relative mb-2">
            <TextInput
              className="rounded-lg px-3 text-[13px] pr-9"
              style={inputStyle}
              placeholder={t("cst.address")}
              placeholderTextColor={colors.textMuted}
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TouchableOpacity
              className="absolute right-2 top-0 bottom-0 justify-center"
              onPress={() => setMapSelectorVisible(true)}
            >
              <Ionicons name="locate-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.email")}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TextInput
              className="w-[38%] rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.phone")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={(v) => setNewPhone(v.replace(/[^0-9]/g, ""))}
            />
          </View>

          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.contactPerson")}
              placeholderTextColor={colors.textMuted}
              value={newContact}
              onChangeText={setNewContact}
            />
            <TextInput
              className="w-[38%] rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.contactPhone")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newContactPhone}
              onChangeText={(v) => setNewContactPhone(v.replace(/[^0-9]/g, ""))}
            />
          </View>

          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-1 rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.fax")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newFax}
              onChangeText={(v) => setNewFax(v.replace(/[^0-9]/g, ""))}
            />
            <TextInput
              className="flex-1 rounded-lg px-3 text-[13px]"
              style={inputStyle}
              placeholder={t("cst.website")}
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              value={newWebsite}
              onChangeText={setNewWebsite}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="rounded-lg py-2.5 items-center"
            style={{ backgroundColor: colors.primary, minHeight: 40 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-[13px] font-bold" style={{ color: "white" }}>
                {editingCustomer ? t("svc.update") : t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
