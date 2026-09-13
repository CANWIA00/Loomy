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

  const AvatarStack = ({ team }: { team: (typeof teams)[number] }) => {
    const stack = [team.leader, ...team.members];
    const shown = stack.slice(0, 4);
    const extra = stack.length - shown.length;
    return (
      <View className="flex-row items-center">
        {shown.map((person, idx) => (
          <View
            key={`${person}-${idx}`}
            className="w-7 h-7 rounded-full items-center justify-center border-2"
            style={{
              backgroundColor: idx === 0 ? team.color : colors.bgInput,
              borderColor: colors.bgCard,
              marginLeft: idx === 0 ? 0 : -7,
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: idx === 0 ? "#fff" : colors.textSecondary }}
            >
              {person.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
        {extra > 0 && (
          <View
            className="w-7 h-7 rounded-full items-center justify-center border-2"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.bgCard, marginLeft: -7 }}
          >
            <Text className="text-[9px] font-semibold" style={{ color: colors.textMuted }}>
              +{extra}
            </Text>
          </View>
        )}
      </View>
    );
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
            const personnelCount = team.members.length + 1;
            return (
              <View
                key={team.id}
                className="w-full md:w-[48%] lg:w-[32%] rounded-2xl overflow-hidden mb-4"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}
              >
                <View style={{ height: 3, backgroundColor: team.color }} />

                <TouchableOpacity
                  onPress={() => toggle(team.id)}
                  activeOpacity={0.7}
                  className="p-3 flex-row items-center"
                >
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: `${team.color}20` }}
                  >
                    <Ionicons name="people" size={20} color={team.color} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-sm" style={{ color: colors.text }} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Ionicons name="shield-checkmark-outline" size={12} color={colors.warning} />
                      <Text className="text-xs ml-1" style={{ color: colors.textMuted }} numberOfLines={1}>
                        {team.leader}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>

                {!isExpanded ? (
                  <View className="px-3 pb-3">
                    <View className="flex-row items-center justify-between">
                      <AvatarStack team={team} />
                      {isAdmin && (
                        <TouchableOpacity
                          onPress={() => openTeamDetail(team.id)}
                          activeOpacity={0.6}
                          hitSlop={8}
                          style={{ padding: 4 }}
                        >
                          <Ionicons name="settings-outline" size={15} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View className="flex-row flex-wrap gap-2 mt-2.5">
                      <View className="flex-row items-center h-6 px-2.5 rounded-lg" style={{ backgroundColor: colors.bg }}>
                        <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
                        <Text className="text-[11px] ml-1" style={{ color: colors.textSecondary }}>
                          {t("sch.personnelCount")} {personnelCount}
                        </Text>
                      </View>
                      <View className="flex-row items-center h-6 px-2.5 rounded-lg" style={{ backgroundColor: colors.bg }}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <Text className="text-[11px] ml-1" style={{ color: colors.textSecondary }}>
                          {assignmentCount} {t("sch.assignments")}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="px-3 pb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center">
                        <View className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: team.color }} />
                        <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                          {t("sch.personnel")} ({personnelCount})
                        </Text>
                      </View>
                      {isAdmin && (
                        <TouchableOpacity
                          onPress={() => openTeamDetail(team.id)}
                          activeOpacity={0.6}
                          hitSlop={8}
                          style={{ padding: 2 }}
                        >
                          <Ionicons name="settings-outline" size={15} color={colors.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
                      <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled bounces={false} showsVerticalScrollIndicator={true}>
                        <View
                          className="flex-row items-center px-2.5 py-2"
                          style={{ backgroundColor: `${team.color}0F`, borderBottomWidth: 1, borderBottomColor: colors.border }}
                        >
                          <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5" style={{ backgroundColor: team.color }}>
                            <Text className="text-[10px] font-bold" style={{ color: "#fff" }}>
                              {team.leader.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text className="text-xs font-semibold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                            {team.leader}
                          </Text>
                          <Ionicons name="shield-checkmark-outline" size={14} color={team.color} />
                        </View>

                        {team.members.length === 0 ? (
                          <View style={{ height: 52 }} className="items-center justify-center">
                            <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.noMembers")}</Text>
                          </View>
                        ) : (
                          team.members.map((memberName, idx) => (
                            <View
                              key={memberName}
                              className="flex-row items-center px-2.5 py-2"
                              style={idx < team.members.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : null}
                            >
                              <View className="w-7 h-7 rounded-full items-center justify-center mr-2.5" style={{ backgroundColor: `${team.color}22` }}>
                                <Text className="text-[10px] font-semibold" style={{ color: team.color }}>
                                  {memberName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <Text className="text-xs flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
                                {memberName}
                              </Text>
                            </View>
                          ))
                        )}
                      </ScrollView>
                    </View>

                    <View className="flex-row items-center justify-between pt-2.5">
                      <View className="flex-row items-center">
                        <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                        <Text className="text-xs ml-1.5" style={{ color: colors.textMuted }}>
                          {t("sch.personnelCount")} {personnelCount}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                        <Text className="text-xs ml-1.5" style={{ color: colors.textMuted }}>
                          {assignmentCount} {t("sch.assignments")}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}