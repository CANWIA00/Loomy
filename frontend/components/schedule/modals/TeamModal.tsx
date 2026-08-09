import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

export default function TeamModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { teamModalVisible, companyUsers, closeTeamModal, addTeam, addLoading } = useSchedule();

  const [name, setName] = useState("");
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  useEffect(() => {
    if (teamModalVisible) {
      setName("");
      setLeader("");
      setMembers([]);
      setLeaderOpen(false);
      setMemberOpen(false);
    }
  }, [teamModalVisible]);

  const toggleMember = (userName: string) => {
    setMembers((prev) =>
      prev.includes(userName) ? prev.filter((n) => n !== userName) : [...prev, userName]
    );
  };

  return (
    <ModalShell visible={teamModalVisible} onRequestClose={closeTeamModal}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.newTeam")}</Text>
        <TouchableOpacity onPress={closeTeamModal}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.teamName")}</Text>
      <TextInput
        className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
        style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
        placeholder={t("sch.teamName")}
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.teamLeader")}</Text>
      <TouchableOpacity
        className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between mb-3"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        onPress={() => setLeaderOpen(!leaderOpen)}
      >
        <Text className="text-sm" style={{ color: leader ? colors.text : colors.textMuted }}>
          {leader || t("sch.selectLeader")}
        </Text>
        <Ionicons name={leaderOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {leaderOpen && (
        <View className="border rounded-lg mb-3 max-h-40 overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
          <ScrollView nestedScrollEnabled bounces={false}>
            {companyUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                className="px-3 py-2.5 border-b flex-row items-center"
                style={{ borderColor: colors.border, backgroundColor: leader === user.name ? colors.primary + '15' : 'transparent' }}
                onPress={() => {
                  setLeader(user.name);
                  setLeaderOpen(false);
                }}
              >
                <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary }}>
                  <Text className="text-white text-[10px] font-bold">{user.name.charAt(0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm" style={{ color: leader === user.name ? colors.primary : colors.text, fontWeight: leader === user.name ? '600' : '400' }}>
                    {user.name}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
                </View>
                {leader === user.name && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.personnel")}</Text>
      <TouchableOpacity
        className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between mb-1"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
        onPress={() => setMemberOpen(!memberOpen)}
      >
        <Text className="text-sm flex-1" style={{ color: members.length > 0 ? colors.text : colors.textMuted }}>
          {members.length > 0
            ? `${members.length} ${t("sch.personnelSelected")}`
            : t("sch.selectPersonnel")}
        </Text>
        <Ionicons name={memberOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {members.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-2">
          {members.map((name) => (
            <View key={name} className="flex-row items-center border rounded-lg px-2 py-1" style={{ backgroundColor: colors.primary + '33', borderColor: colors.primary + '66' }}>
              <Text className="text-xs mr-1" style={{ color: colors.primary }}>{name}</Text>
              <TouchableOpacity onPress={() => toggleMember(name)}>
                <Ionicons name="close" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {memberOpen && (
        <View className="border rounded-lg mb-3 max-h-40 overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
          <ScrollView nestedScrollEnabled bounces={false}>
            {companyUsers
              .filter((u) => u.name !== leader)
              .map((user) => {
                const isSelected = members.includes(user.name);
                return (
                  <TouchableOpacity
                    key={user.id}
                    className="px-3 py-2.5 border-b flex-row items-center"
                    style={{ borderColor: colors.border, backgroundColor: isSelected ? colors.primary + '15' : 'transparent' }}
                    onPress={() => toggleMember(user.name)}
                  >
                    <View className={`w-5 h-5 rounded border items-center justify-center mr-2`} style={{ backgroundColor: isSelected ? colors.primary : 'transparent', borderColor: isSelected ? colors.primary : colors.textMuted }}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                      <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{user.name.charAt(0)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm" style={{ color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '600' : '400' }}>
                        {user.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      )}
      {!memberOpen && <View className="mb-3" />}

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={closeTeamModal}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => addTeam(name, leader, members)}
          disabled={addLoading}
        >
          {addLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="font-medium" style={{ color: "white" }}>{t("sch.add")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ModalShell>
  );
}
