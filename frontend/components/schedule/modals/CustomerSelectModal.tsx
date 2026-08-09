import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function CustomerSelectModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    customerSelectVisible,
    closeCustomerSelect,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    customerSearch,
    setCustomerSearch,
  } = useSchedule();
  const [tempCustomerName, setTempCustomerName] = useState("");

  const selectCustomer = (m: (typeof customers)[number]) => {
    setSelectedCustomer(m);
    closeCustomerSelect();
    setCustomerSearch("");
  };

  const addTempCustomer = () => {
    if (tempCustomerName.trim()) {
      const gecici = {
        id: String(Date.now()),
        companyName: tempCustomerName.trim(),
        contactPerson: "-",
      };
      setSelectedCustomer(gecici);
      closeCustomerSelect();
      setTempCustomerName("");
    }
  };

  return (
    <ModalShell visible={customerSelectVisible} onRequestClose={closeCustomerSelect}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.customer")}</Text>
        <TouchableOpacity onPress={closeCustomerSelect}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
        placeholder={t("sch.selectCustomer")}
        placeholderTextColor={colors.textMuted}
        value={customerSearch}
        onChangeText={setCustomerSearch}
        autoFocus
      />

      <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {customers
          .filter((m) =>
            m.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
            m.contactPerson?.toLowerCase().includes(customerSearch.toLowerCase())
          )
          .map((m) => (
            <TouchableOpacity
              key={m.id}
              className="px-3 py-2 border-b"
              style={{ borderColor: colors.border, backgroundColor: selectedCustomer?.id === m.id ? colors.primary + '15' : 'transparent' }}
              onPress={() => selectCustomer(m)}
            >
              <Text className="text-sm" style={{ color: colors.text }}>{m.companyName}</Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>{m.contactPerson}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <View className="flex-row items-center gap-2 mt-3 border-t pt-3" style={{ borderColor: colors.border }}>
        <TextInput
          className="flex-1 h-10 border rounded-lg px-3 text-sm"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("sch.tempCustomer")}
          placeholderTextColor={colors.textMuted}
          value={tempCustomerName}
          onChangeText={setTempCustomerName}
        />
        <TouchableOpacity
          className="h-10 px-4 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={addTempCustomer}
        >
          <Text className="text-sm font-medium" style={{ color: "white" }}>{t("sch.add")}</Text>
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
