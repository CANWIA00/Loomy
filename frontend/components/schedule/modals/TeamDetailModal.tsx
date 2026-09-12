import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useSchedule } from "../ScheduleContext";
import type { CompanyUser } from "../../../apiclient/teams";
import ModalShell from "../ModalShell";

export default function TeamDetailModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const {
    teamDetailVisible,
    teamDetailId,
    teams,
    companyUsers,
    closeTeamDetail,
    saveTeam,
    deleteTeamById,
  } = useSchedule();

  const team = useMemo(
    () => teams.find((t) => t.id === teamDetailId),
    [teams, teamDetailId]
  );

  const [nameDraft, setNameDraft] = useState("");
  const [leaderDraft, setLeaderDraft] = useState("");
  const [membersDraft, setMembersDraft] = useState<string[]>([]);
  const [leaderOpen, setLeaderOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);

  useEffect(() => {
    if (teamDetailVisible && team) {
      setNameDraft(team.name);
      setLeaderDraft(team.leader);
      setMembersDraft(team.members);
      setLeaderOpen(false);
      setMemberOpen(false);
      setSearch("");
      setConfirmSave(false);
      setConfirmDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamDetailVisible, teamDetailId]);

  useEffect(() => {
    if (needsSync && teamDetailVisible && team) {
      setNameDraft(team.name);
      setLeaderDraft(team.leader);
      setMembersDraft(team.members);
      setNeedsSync(false);
    }
  }, [needsSync, teamDetailVisible, team]);

  const emails = useMemo(() => {
    const map: Record<string, string> = {};
    companyUsers.forEach((u) => {
      map[u.name] = u.email;
    });
    return map;
  }, [companyUsers]);

  if (!team) return null;

  const isDirty =
    nameDraft.trim() !== team.name ||
    leaderDraft !== team.leader ||
    JSON.stringify(membersDraft) !== JSON.stringify(team.members);

  const leaderCandidates = companyUsers.filter((u) => u.name !== leaderDraft);

  const addCandidates = companyUsers.filter(
    (u) =>
      u.name !== leaderDraft &&
      !membersDraft.includes(u.name) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleChangeLeader = (u: CompanyUser) => {
    if (u.name === leaderDraft) return;
    setLeaderDraft(u.name);
    setMembersDraft((prev) => prev.filter((m) => m !== u.name));
    setLeaderOpen(false);
    setSearch("");
  };

  const handleAddMember = (userName: string) => {
    setMembersDraft((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
    setSearch("");
  };

  const handleRemoveMember = (userName: string) => {
    setMembersDraft((prev) => prev.filter((m) => m !== userName));
  };

  const handleSave = async () => {
    if (!isDirty || saving || !nameDraft.trim()) return;
    setSaving(true);
    const ok = await saveTeam(team.id, {
      name: nameDraft.trim(),
      leader: leaderDraft,
      members: membersDraft,
    });
    setSaving(false);
    if (ok) {
      setConfirmSave(false);
      setNeedsSync(true);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    await deleteTeamById(team.id);
    setDeleteBusy(false);
    closeTeamDetail();
  };

  return (
    <ModalShell visible={teamDetailVisible} onRequestClose={closeTeamDetail} maxWidth="max-w-md">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.teamDetail")}</Text>
        <TouchableOpacity onPress={closeTeamDetail}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="max-h-[45vh]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3 mb-3">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: `${team.color}20` }}
          >
            <Ionicons name="people" size={22} color={team.color} />
          </View>
          {isAdmin ? (
            <View className="flex-1">
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder={t("sch.teamName")}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ) : (
            <View className="flex-1">
              <Text className="font-semibold text-base" style={{ color: colors.text }}>{team.name}</Text>
            </View>
          )}
        </View>

        <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.teamLeader")}</Text>
        <View className="border rounded-xl px-3 py-2.5 mb-2 flex-row items-center"
          style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.purple }}>
            <Text className="text-white text-xs font-bold">{leaderDraft.charAt(0)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm" style={{ color: colors.text }}>{leaderDraft}</Text>
            {emails[leaderDraft] ? (
              <Text className="text-xs" style={{ color: colors.textMuted }}>{emails[leaderDraft]}</Text>
            ) : null}
          </View>
          <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: colors.purple + '22' }}>
            <Text className="text-[10px] font-semibold" style={{ color: colors.purple }}>{t("sch.teamLeader")}</Text>
          </View>
        </View>

        {isAdmin && (
          <>
            <TouchableOpacity
              className="flex-row items-center justify-between h-10 rounded-lg px-3 mb-1"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={() => setLeaderOpen(!leaderOpen)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} />
                <Text className="text-xs font-medium ml-2" style={{ color: colors.primary }}>{t("sch.changeLeader")}</Text>
              </View>
              <Ionicons name={leaderOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>
            {leaderOpen && (
              <View className="border rounded-lg mb-2 max-h-32 overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                <ScrollView nestedScrollEnabled bounces={false} keyboardShouldPersistTaps="handled">
                  {leaderCandidates.length === 0 ? (
                    <Text className="text-sm text-center py-3" style={{ color: colors.textMuted }}>{t("sch.noPersonnelLeft")}</Text>
                  ) : (
                    leaderCandidates.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        className="px-3 py-2 border-b flex-row items-center"
                        style={{ borderColor: colors.border }}
                        onPress={() => handleChangeLeader(u)}
                        activeOpacity={0.7}
                      >
                        <View className="w-7 h-7 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                          <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{u.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm" style={{ color: colors.text }}>{u.name}</Text>
                          <Text className="text-xs" style={{ color: colors.textMuted }}>{u.email}</Text>
                        </View>
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View className="flex-row items-center justify-between mt-3 mb-1">
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {t("sch.personnel")} ({membersDraft.length})
          </Text>
          {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center h-8 px-3 rounded-lg"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={() => setMemberOpen(!memberOpen)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={14} color={colors.primary} />
              <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("sch.addPersonnel")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {isAdmin && memberOpen && (
          <View className="border rounded-lg mb-2" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
            <TextInput
              className="w-full h-10 border-b px-3 text-sm"
              style={{ borderColor: colors.border, color: colors.text }}
              placeholder={t("sch.searchPersonnel")}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            <ScrollView className="max-h-28" nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {addCandidates.length === 0 ? (
                <Text className="text-sm text-center py-3" style={{ color: colors.textMuted }}>
                  {search ? t("sch.noResults") : t("sch.noPersonnelLeft")}
                </Text>
              ) : (
                addCandidates.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    className="px-3 py-1.5 border-b flex-row items-center"
                    style={{ borderColor: colors.border }}
                    onPress={() => handleAddMember(u.name)}
                    activeOpacity={0.7}
                  >
                    <View className="w-7 h-7 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary }}>
                      <Text className="text-white text-[10px] font-bold">{u.name.charAt(0)}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm" style={{ color: colors.text }}>{u.name}</Text>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{u.email}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        <View className="mt-1 mb-2">
          {membersDraft.length === 0 ? (
            <Text className="text-sm text-center py-4" style={{ color: colors.textMuted }}>{t("sch.noMembers")}</Text>
          ) : membersDraft.map((memberName) => (
            <View key={memberName} className="border rounded-xl px-3 py-2.5 mb-1 flex-row items-center"
              style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
              <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.bgInput }}>
                <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{memberName.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm" style={{ color: colors.text }}>{memberName}</Text>
                {emails[memberName] ? (
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{emails[memberName]}</Text>
                ) : null}
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => handleRemoveMember(memberName)} activeOpacity={0.7}>
                  <Ionicons name="remove-circle-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {isAdmin && (
        <View className="mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
          {isDirty ? (
            !confirmSave ? (
              <TouchableOpacity
                className="flex-row items-center justify-center h-11 rounded-xl"
                style={{ backgroundColor: nameDraft.trim() ? colors.primary : colors.primary + '40' }}
                onPress={() => setConfirmSave(true)}
                disabled={!nameDraft.trim()}
                activeOpacity={0.7}
              >
                <Ionicons name="save-outline" size={18} color="white" />
                <Text className="text-sm font-semibold ml-2" style={{ color: "white" }}>{t("sch.saveChanges")}</Text>
              </TouchableOpacity>
            ) : (
              <View className="rounded-xl p-3" style={{ borderColor: colors.primary + '66', backgroundColor: colors.primary + '0D' }}>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>{t("sch.confirmSaveMsg")}</Text>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.bgInput }}
                    onPress={() => setConfirmSave(false)}
                    disabled={saving}
                  >
                    <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: saving ? colors.primary + '80' : colors.primary }}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="font-medium" style={{ color: "white" }}>{t("sch.yesSave")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : (
            !confirmDelete ? (
              <TouchableOpacity
                className="flex-row items-center justify-center h-10 rounded-lg"
                style={{ backgroundColor: colors.danger + '15' }}
                onPress={() => setConfirmDelete(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.danger }}>{t("sch.teamDelete")}</Text>
              </TouchableOpacity>
            ) : (
              <View className="rounded-xl p-3" style={{ borderColor: colors.danger + '4D', backgroundColor: colors.danger + '0D' }}>
                <Text className="text-sm mb-3" style={{ color: colors.text }}>{t("sch.teamDeleteMsg")}</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.bgInput }}
                    onPress={() => setConfirmDelete(false)}
                    disabled={deleteBusy}
                  >
                    <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 h-10 rounded-lg items-center justify-center"
                    style={{ backgroundColor: deleteBusy ? colors.danger + '80' : colors.danger }}
                    onPress={handleDelete}
                    disabled={deleteBusy}
                  >
                    {deleteBusy ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="font-medium" style={{ color: "white" }}>{t("sch.yesDelete")}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>
      )}
    </ModalShell>
  );
}