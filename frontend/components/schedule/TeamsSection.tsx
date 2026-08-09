import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSchedule } from "./ScheduleContext";

export default function TeamsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { teams, appointments, openTeamModal, requestDeleteTeam, openAddMember, openRemoveMembers } = useSchedule();

  return (
    <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("sch.teams")}</Text>
        {isAdmin && (
          <TouchableOpacity
            className="flex-row items-center h-8 px-3 rounded-lg"
            style={{ backgroundColor: colors.primary + '15' }}
            onPress={openTeamModal}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("sch.newTeam")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row flex-wrap gap-3">
        {teams.map((team) => (
          <View
            key={team.id}
            className="w-[48%] md:w-[32%] lg:w-[24%] rounded-2xl p-4 h-64"
            style={{ backgroundColor: colors.bgCard }}
          >
            <View className="flex-row items-center gap-3 mb-3">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${team.color}20` }}
              >
                <Ionicons name="people" size={20} color={team.color} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm" style={{ color: colors.text }}>{team.name}</Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.leader")} {team.leader}</Text>
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => requestDeleteTeam(team.id)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView className="flex-1 mb-2" indicatorStyle={colors.indicatorBg as any} nestedScrollEnabled>
              <View className="mb-3">
                <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>{t("sch.personnelCount")} ({team.members.length + 1})</Text>
                <View className="flex-row items-center py-1 border-b" style={{ borderColor: colors.border + '4D' }}>
                  <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: team.color }}>
                    <Text className="text-white text-[10px] font-bold">{team.leader.charAt(0)}</Text>
                  </View>
                  <Text className="text-xs font-medium mr-1" style={{ color: colors.warning }}>{team.leader}</Text>
                  <Text className="text-xs" style={{ color: colors.warning }}>👑</Text>
                </View>
                {team.members.map((personel, idx) => (
                  <View key={idx} className="flex-row items-center py-1 border-b" style={{ borderColor: colors.border + '4D' }}>
                    <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                      <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>
                        {personel.charAt(0)}
                      </Text>
                    </View>
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>{personel}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {appointments.filter((a) => a.ekipId === team.id).length} {t("sch.assignments")}
              </Text>
              {isAdmin && (
                <View className="flex-row gap-1">
                  <TouchableOpacity
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: colors.warning + '15' }}
                    onPress={() => openRemoveMembers(team.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person-remove-outline" size={16} color={colors.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: colors.primary + '15' }}
                    onPress={() => openAddMember(team.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
