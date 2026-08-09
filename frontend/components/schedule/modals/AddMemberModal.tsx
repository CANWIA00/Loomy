import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function AddMemberModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { addMemberVisible, addMemberTeamId, companyUsers, teams, addMember, closeAddMember } = useSchedule();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (addMemberVisible) setSearch("");
  }, [addMemberVisible]);

  const team = teams.find((t) => t.id === addMemberTeamId);
  const candidates = companyUsers.filter((u) => {
    const alreadyMember = team?.members.includes(u.name) || team?.leader === u.name;
    return !alreadyMember && (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAdd = async (userName: string) => {
    if (addMemberTeamId === null) return;
    const ok = await addMember(addMemberTeamId, userName);
    if (ok) setSearch("");
  };

  return (
    <ModalShell visible={addMemberVisible} onRequestClose={closeAddMember} maxWidth="max-w-sm">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.addPersonnel")}</Text>
        <TouchableOpacity onPress={closeAddMember}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
        placeholder={t("sch.searchPersonnel")}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoFocus
      />

      <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {candidates.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>
              {search ? t("sch.noResults") : t("sch.noPersonnelLeft")}
            </Text>
          </View>
        ) : (
          candidates.map((user) => (
            <TouchableOpacity
              key={user.id}
              className="px-3 py-2.5 border-b flex-row items-center"
              style={{ borderColor: colors.border }}
              onPress={() => handleAdd(user.name)}
              activeOpacity={0.7}
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                <Text className="text-white text-xs font-bold">{user.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm" style={{ color: colors.text }}>{user.name}</Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View className="mt-3">
        <TouchableOpacity
          className="w-full h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={closeAddMember}
          activeOpacity={0.7}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("common.close")}</Text>
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
