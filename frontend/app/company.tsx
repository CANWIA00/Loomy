import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { companyApi, type CompanyManagement, type PanelKey } from "../apiclient/company";
import type { PanelAccessLevel, PanelAccessMap } from "../apiclient/auth";
import ScreenHeader from "../components/ScreenHeader";

const PANEL_META: Record<PanelKey, { titleKey: string; icon: any; color: string }> = {
  services: { titleKey: "tab.services", icon: "construct", color: "#3B82F6" },
  customers: { titleKey: "tab.customers", icon: "people", color: "#10B981" },
  schedule: { titleKey: "tab.schedule", icon: "calendar", color: "#F59E0B" },
  stock: { titleKey: "tab.stock", icon: "cube", color: "#EC4899" },
  quotes: { titleKey: "tab.quotes", icon: "document-text", color: "#8060FF" },
  finans: { titleKey: "tab.finans", icon: "stats-chart", color: "#0EA5E9" },
};

const ORDER: PanelKey[] = ["services", "customers", "schedule", "stock", "quotes", "finans"];

const DEFAULT_USER_PANELS: PanelAccessMap = {
  services: "manage",
  customers: "manage",
  schedule: "manage",
};

export default function CompanyScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState<CompanyManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, PanelAccessMap>>({});
  const [bulkLevels, setBulkLevels] = useState<PanelAccessMap>({});
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await companyApi.get();
        if (cancelled) return;
        setData(res.data);
        setDrafts({});
        setError(null);
        const firstUser = res.data.users.find((u) => u.role === "USER");
        setExpandedId(firstUser?.id ?? null);
      } catch {
        if (cancelled) return;
        setError(t("cmp.errorLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const originalAccess = useMemo(() => {
    const map: Record<string, PanelAccessMap> = {};
    for (const u of data?.users ?? []) map[u.id] = u.panelAccess ?? DEFAULT_USER_PANELS;
    return map;
  }, [data]);

  const draftOf = (userId: string): PanelAccessMap => {
    if (drafts[userId] !== undefined) return drafts[userId];
    return originalAccess[userId] ?? {};
  };

  const setLevel = (userId: string, panel: PanelKey, level: PanelAccessLevel | undefined) => {
    setDrafts((prev) => {
      const base: PanelAccessMap = prev[userId] ?? originalAccess[userId] ?? {};
      const next: PanelAccessMap = { ...base };
      if (level) next[panel] = level;
      else delete next[panel];
      return { ...prev, [userId]: next };
    });
  };

  const setBulkLevel = (panel: PanelKey, level: PanelAccessLevel | undefined) => {
    setBulkLevels((prev) => {
      const next: PanelAccessMap = { ...prev };
      if (level) next[panel] = level;
      else delete next[panel];
      return next;
    });
  };

  const changedCount = useMemo(
    () =>
      (data?.users ?? []).filter(
        (u) =>
          u.role === "USER" &&
          JSON.stringify(originalAccess[u.id] ?? {}) !== JSON.stringify(draftOf(u.id))
      ).length,
    [data, drafts, originalAccess]
  );

  const bulkCount = Object.keys(bulkLevels).length;

  const copyCode = async () => {
    if (!data?.company.invitationCode) return;
    await Clipboard.setStringAsync(data.company.invitationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyToAll = async () => {
    if (saving || bulkCount === 0) return;
    setSaving(true);
    setNotice(null);
    try {
      await companyApi.applyToAll(bulkLevels);
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) =>
                u.role === "USER" ? { ...u, panelAccess: { ...bulkLevels } } : u
              ),
            }
          : prev
      );
      setNotice({ type: "success", text: t("cmp.saved") });
    } catch {
      setNotice({ type: "error", text: t("cmp.errorSave") });
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    if (saving || changedCount === 0) return;
    setSaving(true);
    setNotice(null);
    const changed = (data?.users ?? [])
      .filter((u) => u.role === "USER")
      .filter((u) => JSON.stringify(originalAccess[u.id] ?? {}) !== JSON.stringify(draftOf(u.id)));
    try {
      await Promise.all(changed.map((u) => companyApi.updateUserAccess(u.id, draftOf(u.id))));
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.role === "USER" ? { ...u, panelAccess: draftOf(u.id) } : u
          ),
        };
      });
      setDrafts({});
      setNotice({ type: "success", text: t("cmp.saved") });
    } catch {
      setNotice({ type: "error", text: t("cmp.errorSave") });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
            <ScreenHeader title={t("cmp.title")} />
            <Text style={{ color: colors.textMuted }} className="text-sm mt-4">
              {t("cmp.noAccess")}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const employees = data?.users ?? [];

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg as any} contentContainerStyle={{ paddingBottom: 12 }}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4">
          <ScreenHeader title={t("cmp.title")} />

          {notice && (
            <View
              className="flex-row items-center gap-2 px-4 py-3 rounded-xl mb-4"
              style={{
                backgroundColor: notice.type === "success" ? "#16a34a22" : "#dc262622",
                borderColor: notice.type === "success" ? colors.success : "#dc2626",
                borderWidth: 1,
              }}
            >
              <Ionicons
                name={notice.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={notice.type === "success" ? colors.success : "#dc2626"}
              />
              <Text style={{ color: colors.text }} className="flex-1 text-sm">
                {notice.text}
              </Text>
            </View>
          )}

          {loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View className="items-center py-20">
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted }} className="mt-3">
                {error}
              </Text>
            </View>
          ) : !data ? (
            <View className="items-center py-20">
              <Text style={{ color: colors.textMuted }}>{t("cmp.noCompany")}</Text>
            </View>
          ) : (
            <>
              <HeroCard company={data.company} copied={copied} onCopy={copyCode} />

              <View
                className="flex-row items-start gap-2.5 p-3 rounded-xl mb-4"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
              >
                <View style={{ backgroundColor: colors.bgCard }} className="w-7 h-7 rounded-lg items-center justify-center mt-0.5">
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textMuted }} className="text-xs flex-1 leading-5">
                  {t("cmp.legend")}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ color: colors.text }} className="text-lg font-bold">
                  {t("cmp.employees")}
                </Text>
                <View
                  style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
                  className="px-2.5 py-1 rounded-full"
                >
                  <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                    {t("cmp.employeeCount", { count: String(employees.length) })}
                  </Text>
                </View>
              </View>

              {employees.length === 0 && (
                <View className="items-center py-10 rounded-2xl mb-4" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}>
                  <Ionicons name="people-outline" size={36} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted }} className="text-sm mt-2">
                    {t("cmp.empty")}
                  </Text>
                </View>
              )}

              {employees.map((member) => {
                const isSelf = member.id === user?.id;
                const isEmployee = member.role === "USER";
                const current = draftOf(member.id);
                const changed = isEmployee && JSON.stringify(originalAccess[member.id] ?? {}) !== JSON.stringify(current);
                const expanded = expandedId === member.id;
                const activePanels = ORDER.filter((p) => current[p]);

                return (
                  <View
                    key={member.id}
                    className="p-4 rounded-2xl mb-3"
                    style={{
                      backgroundColor: colors.bgCard2,
                      borderColor: changed ? colors.warning : colors.borderAlt,
                      borderWidth: changed ? 1.5 : 1,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setExpandedId(expanded ? null : member.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center"
                    >
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: member.role === "ADMIN" ? "#f59e0b33" : colors.bgCard }}
                      >
                        <Text style={{ color: member.role === "ADMIN" ? "#f59e0b" : colors.textMuted }} className="font-bold text-base">
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text style={{ color: colors.text }} className="text-base font-semibold">
                            {member.name}
                          </Text>
                          {isSelf && (
                            <Text
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ color: colors.primary, backgroundColor: colors.bgCard }}
                            >
                              {t("cmp.you")}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.textMuted }} className="text-sm">
                          {member.email}
                        </Text>
                      </View>
                      <View
                        className="px-2.5 py-1 rounded-full mr-2"
                        style={{ backgroundColor: member.role === "ADMIN" ? "#f59e0b22" : colors.bgCard }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: member.role === "ADMIN" ? "#f59e0b" : colors.textSecondary }}
                        >
                          {member.role === "ADMIN" ? t("cmp.role.admin") : t("cmp.role.user")}
                        </Text>
                      </View>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>

                    {expanded ? (
                      <View style={{ marginTop: 14 }}>
                        <Text className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: colors.textMuted }}>
                          {t("cmp.accessSummary")}
                        </Text>
                        {isEmployee ? (
                          <>
                            <View className="gap-0.5">
                              {ORDER.map((panel) => (
                                <PanelRow
                                  key={panel}
                                  panel={panel}
                                  value={current[panel]}
                                  onChange={(level) => setLevel(member.id, panel, level)}
                                  disabled={saving}
                                />
                              ))}
                            </View>
                            {changed && (
                              <Text style={{ color: colors.warning }} className="text-xs mt-2">
                                {t("cmp.unsaved")}
                              </Text>
                            )}
                          </>
                        ) : (
                          <Text style={{ color: colors.textMuted }} className="text-sm">
                            {t("cmp.adminNote")}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={{ marginTop: 10 }}>
                        {isEmployee ? (
                          activePanels.length > 0 ? (
                            <View className="flex-row flex-wrap gap-1.5">
                              {activePanels.map((p) => (
                                <AccessChip key={p} panel={p} level={current[p]!} />
                              ))}
                            </View>
                          ) : (
                            <Text style={{ color: colors.warning }} className="text-xs">
                              {t("cmp.noAccessSet")}
                            </Text>
                          )
                        ) : (
                          <Text style={{ color: colors.textMuted }} className="text-sm">
                            {t("cmp.adminNote")}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              <View className="h-2" />

              <View
                className="p-4 rounded-2xl mb-4"
                style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
              >
                <View className="flex-row items-center">
                  <View style={{ backgroundColor: colors.bgCard }} className="w-9 h-9 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="git-merge-outline" size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="text-base font-bold">
                      {t("cmp.allUsers")}
                    </Text>
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                      {t("cmp.accessHint")}
                    </Text>
                  </View>
                </View>

                <View style={{ marginTop: 14 }} className="gap-0.5">
                  {ORDER.map((panel) => (
                    <PanelRow
                      key={panel}
                      panel={panel}
                      value={bulkLevels[panel]}
                      onChange={(level) => setBulkLevel(panel, level)}
                      disabled={saving}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={applyToAll}
                  disabled={saving || bulkCount === 0}
                  className="mt-4 h-11 rounded-xl items-center justify-center flex-row gap-2"
                  style={{
                    backgroundColor: bulkCount > 0 ? colors.primary : colors.bgInput,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={17} color={bulkCount > 0 ? "white" : colors.textMuted} />
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: bulkCount > 0 ? "white" : colors.textMuted }}
                      >
                        {t("cmp.applyAll")}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {changedCount > 0 && (
        <View
          className="px-4 py-3"
          style={{ backgroundColor: colors.bgCard2, borderTopColor: colors.border, borderTopWidth: 1 }}
        >
          <TouchableOpacity
            onPress={saveAll}
            disabled={saving}
            className="h-12 rounded-xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="white" />
                <Text className="text-base font-semibold text-white">
                  {t("cmp.saveBar", { count: String(changedCount) })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function HeroCard({
  company,
  copied,
  onCopy,
}: {
  company: { name: string; invitationCode: string; userCount: number };
  copied: boolean;
  onCopy: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View
      className="p-5 rounded-2xl mb-3"
      style={{
        backgroundColor: colors.bgCard2,
        borderColor: colors.borderAlt,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center mb-4">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: colors.primary + "22" }}
        >
          <Ionicons name="business" size={24} color={colors.primary} />
        </View>
        <View className="flex-1 ml-3">
          <Text style={{ color: colors.text }} className="text-lg font-bold">
            {company.name}
          </Text>
          <Text style={{ color: colors.textMuted }} className="text-sm">
            {t("cmp.employeeCount", { count: String(company.userCount) })}
          </Text>
        </View>
      </View>

      <View
        className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}
      >
        <View className="flex-1">
          <Text className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>
            {t("cmp.inviteCode")}
          </Text>
          <Text style={{ color: colors.text }} className="text-sm font-semibold tracking-widest mt-0.5">
            {company.invitationCode}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onCopy}
          className="h-9 px-3 rounded-lg flex-row items-center gap-1.5"
          style={{
            backgroundColor: copied ? colors.success : colors.primary,
          }}
        >
          <Ionicons name={copied ? "checkmark" : "copy-outline"} size={15} color="white" />
          <Text className="text-xs font-semibold text-white">
            {copied ? t("cmp.copied") : t("cmp.copy")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PanelRow({
  panel,
  value,
  onChange,
  disabled,
}: {
  panel: PanelKey;
  value?: PanelAccessLevel;
  onChange: (level: PanelAccessLevel | undefined) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const meta = PANEL_META[panel];

  return (
    <View className="flex-row items-center py-2.5">
      <View style={{ backgroundColor: colors.bgCard }} className="w-9 h-9 rounded-xl items-center justify-center mr-3">
        <Ionicons name={meta.icon} size={17} color={meta.color} />
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-sm font-medium" style={{ color: colors.text }}>
          {t(meta.titleKey)}
        </Text>
        <Text className="text-[11px]" style={{ color: colors.textMuted }}>
          {value ? t(value === "manage" ? "cmp.level.manage" : "cmp.level.view") : t("cmp.level.none")}
        </Text>
      </View>
      <View style={{ width: 168 }}>
        <SegmentedControl value={value} onChange={onChange} disabled={disabled} />
      </View>
    </View>
  );
}

function SegmentedControl({
  value,
  onChange,
  disabled,
}: {
  value?: PanelAccessLevel;
  onChange: (level: PanelAccessLevel | undefined) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const options: { level: PanelAccessLevel | undefined; key: string; icon: any }[] = [
    { level: undefined, key: "cmp.level.none", icon: "close" },
    { level: "view", key: "cmp.level.view", icon: "eye-outline" },
    { level: "manage", key: "cmp.level.manage", icon: "create-outline" },
  ];

  return (
    <View
      className="flex-row p-0.5"
      style={{ backgroundColor: colors.bgInput, borderRadius: 10 }}
    >
      {options.map((opt) => {
        const active = value === opt.level;
        const bg = active ? (opt.level === "manage" ? colors.primary : "#0EA5E9") : "transparent";
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(active ? undefined : opt.level ?? undefined)}
            disabled={disabled}
            className="flex-1 h-7 rounded-lg flex-row items-center justify-center gap-1"
            style={{ backgroundColor: bg, opacity: disabled ? 0.6 : 1 }}
          >
            <Ionicons name={opt.icon} size={12} color={active ? "white" : colors.textMuted} />
            <Text className="text-[11px] font-semibold" style={{ color: active ? "white" : colors.textSecondary }}>
              {t(opt.key)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AccessChip({ panel, level }: { panel: PanelKey; level: PanelAccessLevel }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const meta = PANEL_META[panel];
  const isManage = level === "manage";
  const color = isManage ? colors.primary : "#0EA5E9";
  const bg = isManage ? colors.primary + "1A" : "#0EA5E91A";
  const borderColor = isManage ? colors.primary + "44" : "#0EA5E944";

  return (
    <View
      className="flex-row items-center gap-1.5 px-2.5 h-7 rounded-lg"
      style={{ backgroundColor: bg, borderColor, borderWidth: 1 }}
    >
      <Ionicons name={meta.icon} size={12} color={color} />
      <Text className="text-xs font-medium" style={{ color }}>
        {t(meta.titleKey)}
      </Text>
      <Ionicons name={isManage ? "create-outline" : "eye-outline"} size={11} color={color} />
    </View>
  );
}