import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function ServiceSelectModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { serviceSelectVisible, closeServiceSelect, serviceTypes, selectedService, setSelectedService } = useSchedule();

  return (
    <ModalShell visible={serviceSelectVisible} onRequestClose={closeServiceSelect}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.serviceType")}</Text>
        <TouchableOpacity onPress={closeServiceSelect}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {serviceTypes.map((h, index) => (
          <TouchableOpacity
            key={index}
            className="px-3 py-3 border-b"
            style={{ borderColor: colors.border, backgroundColor: selectedService === h ? colors.primary + '15' : 'transparent' }}
            onPress={() => {
              setSelectedService(h);
              closeServiceSelect();
            }}
          >
            <Text className="text-sm" style={{ color: selectedService === h ? colors.primary : colors.text, fontWeight: selectedService === h ? '600' : '400' }}>
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ModalShell>
  );
}
