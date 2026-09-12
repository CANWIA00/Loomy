import { View, Text, TouchableOpacity } from "react-native";
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
  const { teams, appointments, openTeamModal, openTeamDetail } = useSchedule();

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

      {teams.length === 0 ? (
        <View className="rounded-2xl border border-dashed p-6 items-center justify-center" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
          <Ionicons name="people-outline" size={36} color={colors.textMuted} />
          <Text className="text-sm text-center mt-3 leading-5" style={{ color: colors.textSecondary }}>
            {t("sch.noTeams")}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center h-9 px-4 rounded-lg mt-4"
              style={{ backgroundColor: colors.primary }}
              onPress={openTeamModal}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-xs font-semibold ml-1" style={{ color: "white" }}>{t("sch.newTeam")}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-4">
          {teams.map((team) => (
            <View
              key={team.id}
              className="w-full md:w-[48%] lg:w-[32%] rounded-2xl p-3 mb-4"
              style={{ backgroundColor: colors.bgCard }}
            >
              <TouchableOpacity onPress={() => openTeamDetail(team.id)} activeOpacity={0.7}>
                <View className="flex-row items-center gap-2 mb-2">
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${team.color}20` }}
                  >
                    <Ionicons name="people" size={16} color={team.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: colors.text }}>{team.name}</Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.leader")} {team.leader}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
                <Text className="text-xs mb-1" style={{ color: colors.textMuted }}>{t("sch.personnelCount")} ({team.members.length + 1})</Text>
              </TouchableOpacity>
              <View className="border rounded-lg overflow-hidden mb-2" style={{ borderColor: colors.border }}>
                {team.members.length === 0 ? (
                  <Text className="text-xs px-3 py-2.5" style={{ color: colors.textMuted }}>{t("sch.noMembers")}</Text>
                ) : (
                  team.members.slice(0, 4).map((memberName) => (
                    <View key={memberName} className="flex-row items-center px-3 py-1.5" style={{ backgroundColor: colors.bg }}>
                      <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                        <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{memberName.charAt(0)}</Text>
                      </View>
                      <Text className="text-xs flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {memberName}
                      </Text>
                    </View>
                  ))
                )}
                {team.members.length > 4 && (
                  <View className="px-3 py-1.5" style={{ backgroundColor: colors.bg }}>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      +{team.members.length - 4} {t("sch.more")}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  {appointments.filter((a) => a.ekipId === team.id).length} {t("sch.assignments")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}