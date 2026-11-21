import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";
import type { CustomerOption } from "../types";

/** Teklifsiz is (ornegin telefonla gelen ariza) icin atama bekleyen is ekler. */
export default function ManualJobModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { manualJobVisible, closeManualJob, saveManualJob, customers } = useSchedule();
  const [customerName, setCustomerName] = useState("");
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [tur, setTur] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!manualJobVisible) return;
    setCustomerName(""); setCustomer(null); setTur(""); setNotes(""); setSaving(false);
  }, [manualJobVisible]);

  const q = customerName.trim().toLocaleLowerCase("tr-TR");
  const suggestions = !customer && q.length >= 1
    ? customers.filter((c) => c.companyName.toLocaleLowerCase("tr-TR").includes(q)).slice(0, 5)
    : [];

  const inputStyle = { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text };

  const save = async () => {
    setSaving(true);
    await saveManualJob({ customerName: customer?.companyName || customerName.trim(), customerId: customer?.id, tur: tur.trim(), notes: notes.trim() });
    setSaving(false);
  };

  return (
    <ModalShell visible={manualJobVisible} onRequestClose={closeManualJob}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.addJobTitle")}</Text>
        <TouchableOpacity onPress={closeManualJob} accessibilityLabel={t("common.cancel")}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text className="text-xs mb-4" style={{ color: colors.textSecondary }}>{t("sch.addJobHint")}</Text>

      <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.customer")}<Text style={{ color: colors.danger }}> *</Text></Text>
      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm"
        style={inputStyle}
        placeholder={t("sch.customerSearchPlaceholder")}
        placeholderTextColor={colors.textMuted}
        value={customer ? customer.companyName : customerName}
        onChangeText={(v) => { setCustomer(null); setCustomerName(v); }}
      />
      {suggestions.length > 0 && (
        <View className="rounded-lg border mt-1 overflow-hidden" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
          {suggestions.map((c) => (
            <TouchableOpacity key={c.id} className="px-3 py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} onPress={() => setCustomer(c)}>
              <Text className="text-sm" style={{ color: colors.text }}>{c.companyName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text className="text-xs font-medium mb-1 mt-3" style={{ color: colors.textSecondary }}>{t("sch.jobDescription")}<Text style={{ color: colors.danger }}> *</Text></Text>
      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm"
        style={inputStyle}
        placeholder={t("sch.jobDescriptionPlaceholder")}
        placeholderTextColor={colors.textMuted}
        value={tur}
        onChangeText={setTur}
      />

      <Text className="text-xs font-medium mb-1 mt-3" style={{ color: colors.textSecondary }}>{t("sch.notes")}</Text>
      <TextInput
        className="w-full min-h-[64px] border rounded-lg px-3 py-2 text-sm"
        style={inputStyle}
        multiline
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
      />

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity className="flex-1 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: colors.bgInput }} onPress={closeManualJob}>
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("common.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary }} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="font-semibold" style={{ color: "white" }}>{t("sch.addJobSave")}</Text>}
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
