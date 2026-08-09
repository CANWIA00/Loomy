import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function RemoveMembersModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { removeMembersVisible, removeTeamId, teams, removeMembers, closeRemoveMembers, removeLoading } = useSchedule();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (removeMembersVisible) setSelectedMembers([]);
  }, [removeMembersVisible]);

  const team = teams.find((t) => t.id === removeTeamId);

  const toggleMember = (personel: string) => {
    setSelectedMembers((prev) =>
      prev.includes(personel) ? prev.filter((p) => p !== personel) : [...prev, personel]
    );
  };

  const handleRemove = async () => {
    if (removeTeamId === null) return;
    await removeMembers(removeTeamId, selectedMembers);
  };

  return (
    <ModalShell visible={removeMembersVisible} onRequestClose={closeRemoveMembers} maxWidth="max-w-sm">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.removePersonnel")}</Text>
        <TouchableOpacity onPress={closeRemoveMembers}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {team?.leader ? (
        <View className="border rounded-lg p-2.5 mb-3" style={{ backgroundColor: colors.warning + '15', borderColor: colors.warning + '33' }}>
          <Text className="text-xs" style={{ color: colors.warning }}>
            {t("sch.leaderWarning", { leader: team.leader })}
          </Text>
        </View>
      ) : null}

      <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>{t("sch.removePersonnelMsg")}</Text>

      <ScrollView className="max-h-60">
        {team?.members.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>{t("sch.noPersonnelToRemove")}</Text>
          </View>
        ) : (
          team?.members.map((p) => {
            const isSelected = selectedMembers.includes(p);
            return (
              <TouchableOpacity
                key={p}
                className={`flex-row items-center justify-between py-3 px-3 border rounded-lg mb-1`}
                style={{
                  borderColor: isSelected ? colors.danger + '4D' : colors.border,
                  backgroundColor: isSelected ? colors.danger + '1A' : 'transparent',
                }}
                onPress={() => toggleMember(p)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-2">
                  <View className={`w-5 h-5 rounded border items-center justify-center`} style={{ backgroundColor: isSelected ? colors.danger : 'transparent', borderColor: isSelected ? colors.danger : colors.textMuted }}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                    <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{p.charAt(0)}</Text>
                  </View>
                  <Text className="text-sm" style={{ color: colors.text }}>{p}</Text>
                </View>
                <Ionicons name="remove-circle-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={closeRemoveMembers}
          activeOpacity={0.7}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: removeLoading || selectedMembers.length === 0 ? colors.danger + '4D' : colors.danger }}
          onPress={handleRemove}
          disabled={removeLoading || selectedMembers.length === 0}
          activeOpacity={0.7}
        >
          {removeLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="font-medium" style={{ color: "white" }}>
              {selectedMembers.length > 0 ? `${selectedMembers.length} ${t("sch.removeSelected")}` : t("sch.removeDefault")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
