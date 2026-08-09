import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

const formatDateInput = (text: string, setText: (v: string) => void, setDate: (d: Date) => void) => {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  let formatted = digits;
  if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
  if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  setText(formatted);
  const parts = formatted.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      if (d.getDate() === day && d.getMonth() === month) {
        setDate(d);
      }
    }
  }
};

export default function AppointmentModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    appointmentModalVisible,
    closeAppointmentModal,
    saveAppointment,
    requestDeleteEditing,
    editingAppointmentId,
    dateInputText,
    setDateInputText,
    setSelectedDate,
    selectedCustomer,
    timeInput,
    setTimeInput,
    selectedDuration,
    setSelectedDuration,
    selectedTeamId,
    setSelectedTeamId,
    selectedService,
    notlar,
    setNotlar,
    appointmentSaving,
    openCustomerSelect,
    openServiceSelect,
    teams,
    durationOptions,
  } = useSchedule();

  const formatTimeInput = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2);
    setTimeInput(formatted);
  };

  const setToday = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    setDateInputText(`${dd}/${mm}/${yyyy}`);
    setSelectedDate(now);
  };

  return (
    <ModalShell visible={appointmentModalVisible} onRequestClose={closeAppointmentModal}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{editingAppointmentId ? t("sch.updateAppointment") : t("sch.newAppointment")}</Text>
        <TouchableOpacity onPress={closeAppointmentModal}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View className="mb-3">
        <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.customer")}</Text>
        <TouchableOpacity
          className="h-10 border rounded-lg px-3 flex-row items-center justify-between"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          onPress={openCustomerSelect}
        >
          <Text className="text-sm" style={{ color: colors.text }}>
            {selectedCustomer ? selectedCustomer.companyName : t("sch.selectCustomer")}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView className="max-h-[400px]" nestedScrollEnabled indicatorStyle={colors.indicatorBg as any}>
        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.date")}</Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 h-10 border rounded-lg px-3 text-sm"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              placeholder="GG/AA/YYYY"
              placeholderTextColor={colors.textMuted}
              value={dateInputText}
              onChangeText={(text) => formatDateInput(text, setDateInputText, setSelectedDate)}
              keyboardType="number-pad"
              maxLength={10}
            />
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center"
              onPress={setToday}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.time")}</Text>
          <TextInput
            className="w-full h-10 border rounded-lg px-3 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder="HH:MM"
            placeholderTextColor={colors.textMuted}
            value={timeInput}
            onChangeText={formatTimeInput}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.duration")}</Text>
          <View className="flex-row gap-1.5 flex-wrap">
            {durationOptions.map((s) => (
              <TouchableOpacity
                key={s.value}
                className={`px-3 h-8 rounded-lg items-center justify-center border`}
                style={{
                  backgroundColor: selectedDuration === s.value ? colors.primary + '33' : colors.bg,
                  borderColor: selectedDuration === s.value ? colors.primary : colors.border,
                }}
                onPress={() => setSelectedDuration(s.value)}
              >
                <Text className="text-xs" style={{ color: selectedDuration === s.value ? colors.primary : colors.textSecondary }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.selectTeam")}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {teams.map((tm) => (
              <TouchableOpacity
                key={tm.id}
                className={`flex-row items-center px-3 h-8 rounded-lg border`}
                style={{
                  backgroundColor: selectedTeamId === tm.id ? colors.primary + '33' : colors.bg,
                  borderColor: selectedTeamId === tm.id ? colors.primary : colors.border,
                }}
                onPress={() => setSelectedTeamId(tm.id)}
              >
                <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tm.color }} />
                <Text className="text-xs" style={{ color: selectedTeamId === tm.id ? colors.primary : colors.textSecondary }}>
                  {tm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.serviceType")}</Text>
          <TouchableOpacity
            className="h-10 border rounded-lg px-3 flex-row items-center justify-between"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
            onPress={openServiceSelect}
          >
            <Text className="text-sm" style={{ color: colors.text }}>{selectedService}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View className="mb-3">
          <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.notes")}</Text>
          <TextInput
            className="w-full h-20 border rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("sch.notesPlaceholder")}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={notlar}
            onChangeText={setNotlar}
          />
        </View>
      </ScrollView>

      <View className="flex-row gap-3 mt-4">
        {editingAppointmentId ? (
          <TouchableOpacity onPress={requestDeleteEditing}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
        <View className="flex-1" />
        <TouchableOpacity
          className="h-10 px-4 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={closeAppointmentModal}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="h-10 px-4 rounded-lg items-center justify-center"
          style={{ backgroundColor: appointmentSaving ? colors.primary + '80' : colors.primary }}
          onPress={saveAppointment}
          disabled={appointmentSaving}
        >
          {appointmentSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="font-medium" style={{ color: "white" }}>{editingAppointmentId ? t("sch.update") : t("sch.assign")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
