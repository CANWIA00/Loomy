import { View, Text, TouchableOpacity, Modal, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useCustomers } from "../CustomersContext";
import { formatAmount, formatDate } from "../types";

export default function CustomerDetailModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { selectedCustomer, setSelectedCustomer, handleEdit, setTogglePayment } = useCustomers();

  return (
    <Modal visible={!!selectedCustomer} transparent animationType="fade" onRequestClose={() => setSelectedCustomer(null)}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-11/12 max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("cst.customerInfo")}</Text>
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <View className="gap-4">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                  <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                    {selectedCustomer.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>{selectedCustomer.companyName}</Text>
              </View>

              <View className="gap-3">
                <View className="flex-row">
                  <Ionicons name="person-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                  <View className="flex-1 ml-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.contactPerson")}</Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedCustomer.contactPerson || "-"}</Text>
                  </View>
                </View>

                <TouchableOpacity className="flex-row" onPress={() => selectedCustomer.phone && Linking.openURL(`tel:${selectedCustomer.phone}`)}>
                  <Ionicons name="call-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                  <View className="flex-1 ml-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.phone")}</Text>
                    <Text className="text-sm font-medium" style={{ color: selectedCustomer.phone ? colors.primary : colors.text }}>{selectedCustomer.phone || "-"}</Text>
                  </View>
                  {selectedCustomer.phone && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                </TouchableOpacity>

                <TouchableOpacity className="flex-row" onPress={() => selectedCustomer.contactPhone && Linking.openURL(`tel:${selectedCustomer.contactPhone}`)}>
                  <Ionicons name="call-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                  <View className="flex-1 ml-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.contactPhone")}</Text>
                    <Text className="text-sm font-medium" style={{ color: selectedCustomer.contactPhone ? colors.primary : colors.text }}>{selectedCustomer.contactPhone || "-"}</Text>
                  </View>
                  {selectedCustomer.contactPhone && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                </TouchableOpacity>

                <TouchableOpacity className="flex-row" onPress={() => {
                  if (selectedCustomer.email) {
                    Linking.openURL(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedCustomer.email}`);
                  }
                }}>
                  <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                  <View className="flex-1 ml-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.email")}</Text>
                    <Text className="text-sm font-medium" style={{ color: selectedCustomer.email ? colors.primary : colors.text }}>{selectedCustomer.email || "-"}</Text>
                  </View>
                  {selectedCustomer.email && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                </TouchableOpacity>

                <View className="flex-row">
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                  <View className="flex-1 ml-1">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.address")}</Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedCustomer.address || "-"}</Text>
                  </View>
                </View>

                <View className="rounded-xl p-4 mt-1" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("cst.paymentTitle")}</Text>
                    <View
                      className="flex-row items-center rounded-lg px-2 py-1"
                      style={{ backgroundColor: selectedCustomer.hasPaidMonthly ? colors.success + '15' : colors.warning + '15' }}
                    >
                      <Ionicons name={selectedCustomer.hasPaidMonthly ? "checkmark-circle" : "time"} size={14} color={selectedCustomer.hasPaidMonthly ? colors.success : colors.warning} />
                      <Text className="text-xs font-medium ml-1" style={{ color: selectedCustomer.hasPaidMonthly ? colors.success : colors.warning }}>
                        {selectedCustomer.hasPaidMonthly ? t("cst.paid") : t("cst.pending")}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.monthlyFee")}</Text>
                    <Text className="text-sm font-bold" style={{ color: colors.text }}>{formatAmount(selectedCustomer.monthlyFee)}</Text>
                  </View>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.lastPaidAt")}</Text>
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>{formatDate(selectedCustomer.lastPaidAt)}</Text>
                  </View>

                  <TouchableOpacity
                    className="flex-row items-center justify-center h-10 rounded-lg gap-2"
                    style={{ backgroundColor: selectedCustomer.hasPaidMonthly ? colors.warning + '15' : colors.success + '15' }}
                    onPress={() => setTogglePayment({ visible: true, customer: selectedCustomer })}
                  >
                    <Ionicons
                      name={selectedCustomer.hasPaidMonthly ? "refresh-outline" : "checkmark-circle-outline"}
                      size={16}
                      color={selectedCustomer.hasPaidMonthly ? colors.warning : colors.success}
                    />
                    <Text className="text-sm font-semibold" style={{ color: selectedCustomer.hasPaidMonthly ? colors.warning : colors.success }}>
                      {selectedCustomer.hasPaidMonthly ? t("cst.markPending") : t("cst.markPaid")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-lg items-center justify-center flex-row gap-2"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => {
                    setSelectedCustomer(null);
                    handleEdit(selectedCustomer.id);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="white" />
                  <Text className="text-sm font-semibold" style={{ color: "white" }}>{t("cst.edit")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-11 rounded-lg items-center justify-center flex-row gap-2"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => setSelectedCustomer(null)}
                >
                  <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{t("cst.close")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
