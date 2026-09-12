import { useState } from "react";
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
  const { teams, appointments, openTeamModal, openTeamDetail } = useSchedule();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggle = (teamId: number) => {
    setExpanded((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

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
          {teams.map((team) => {
            const isExpanded = !!expanded[team.id];
            const assignmentCount = appointments.filter((a) => a.ekipId === team.id).length;
            return (
              <View
                key={team.id}
                className="w-full md:w-[48%] lg:w-[32%] rounded-2xl overflow-hidden mb-4"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}
              >
                <TouchableOpacity
                  onPress={() => toggle(team.id)}
                  activeOpacity={0.7}
                  className="p-3 flex-row items-center gap-3"
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${team.color}20` }}
                  >
                    <Ionicons name="people" size={18} color={team.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: colors.text }} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="shield-checkmark-outline" size={13} color={colors.warning} />
                      <Text className="text-xs ml-1" style={{ color: colors.textMuted }} numberOfLines={1}>
                        {team.leader}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View className="px-3 pb-1.5">
                    <View className="border rounded-xl overflow-hidden" style={{ borderColor: colors.border }}>
                      <ScrollView
                        style={{ maxHeight: 132 }}
                        nestedScrollEnabled
                        bounces={false}
                        showsVerticalScrollIndicator={true}
                      >
                        {team.members.length === 0 ? (
                          <View style={{ height: 48 }} className="items-center justify-center">
                            <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.noMembers")}</Text>
                          </View>
                        ) : (
                          team.members.map((memberName) => (
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
                      </ScrollView>
                    </View>

                    <View className="flex-row items-center justify-between py-2">
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {assignmentCount} {t("sch.assignments")}
                      </Text>
                      <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
                        {t("sch.personnelCount")} ({team.members.length + 1})
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => openTeamDetail(team.id)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-center py-2.5 border-t mt-1"
                  style={{ borderTopColor: colors.border, backgroundColor: colors.bg }}
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text className="text-xs font-medium ml-1.5" style={{ color: colors.primary }}>
                    {t("sch.teamDetail")}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}