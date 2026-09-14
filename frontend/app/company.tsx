import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { companyApi, type CompanyManagement, type PanelKey } from "../apiclient/company";

const PANELS: { key: PanelKey; titleKey: string }[] = [
  { key: "services", titleKey: "tab.services" },
  { key: "customers", titleKey: "tab.customers" },
  { key: "schedule", titleKey: "tab.schedule" },
  { key: "stock", titleKey: "tab.stock" },
  { key: "quotes", titleKey: "tab.quotes" },
  { key: "finans", titleKey: "tab.finans" },
];

export default function CompanyScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [data, setData] = useState<CompanyManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [bulkPanels, setBulkPanels] = useState<PanelKey[]>([]);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    const map: Record<string, string[]> = {};
    for (const u of data?.users ?? []) map[u.id] = u.panelAccess;
    return map;
  }, [data]);

  const draftOf = (userId: string): string[] => {
    if (drafts[userId] !== undefined) return drafts[userId];
    return originalAccess[userId] ?? [];
  };

  const togglePanel = (userId: string, panel: string) => {
    setDrafts((prev) => {
      const current = prev[userId] !== undefined ? prev[userId] : originalAccess[userId] ?? [];
      const next = current.includes(panel) ? current.filter((p) => p !== panel) : [...current, panel];
      return { ...prev, [userId]: next };
    });
  };

  const applyToAll = async () => {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      await companyApi.applyToAll(bulkPanels.map((p) => p as string));
      setData((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) => (u.role === "USER" ? { ...u, panelAccess: [...bulkPanels] } : u)),
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
    if (saving) return;
    setSaving(true);
    setNotice(null);
    const changed = (data?.users ?? [])
      .filter((u) => u.role === "USER")
      .filter((u) => {
        const before = [...(originalAccess[u.id] ?? [])].sort();
        const after = [...draftOf(u.id)].sort();
        return before.join(",") !== after.join(",");
      });
    if (changed.length === 0) {
      setNotice({ type: "success", text: t("cmp.noChanges") });
      setSaving(false);
      return;
    }
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
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <View className="flex-row items-center gap-3 mb-1">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
              {t("cmp.title")}
            </Text>
          </View>
          <Text style={{ color: colors.textMuted }} className="text-sm mt-4">
            {t("cmp.noAccess")}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const employees = data?.users ?? [];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
              {t("cmp.title")}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.textMuted }} className="text-sm mt-1 mb-4">
          {t("cmp.subtitle")}
        </Text>

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
          <View className="items-center py-16">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View className="items-center py-16">
            <Text style={{ color: colors.textMuted }}>{error}</Text>
          </View>
        ) : !data ? (
          <View className="items-center py-16">
            <Text style={{ color: colors.textMuted }}>{t("cmp.noCompany")}</Text>
          </View>
        ) : (
          <>
            <View
              className="flex-row items-center gap-3 p-4 rounded-2xl mb-4"
              style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
            >
              <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: colors.bgCard }}>
                <Ionicons name="business" size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-base font-semibold">
                  {data.company.name}
                </Text>
                <Text style={{ color: colors.textMuted }} className="text-sm">
                  {t("cmp.employeeCount", { count: String(data.company.userCount) })}
                </Text>
              </View>
            </View>

            <Text style={{ color: colors.text }} className="text-lg font-bold mb-2">
              {t("cmp.employees")}
            </Text>

            {employees.length === 0 && (
              <Text style={{ color: colors.textMuted }} className="text-sm mb-4">
                {t("cmp.empty")}
              </Text>
            )}

            {employees.map((member) => {
              const isSelf = member.id === user?.id;
              const isEmployee = member.role === "USER";
              const current = draftOf(member.id);
              const changed =
                isEmployee && [...(originalAccess[member.id] ?? [])].sort().join(",") !== [...current].sort().join(",");

              return (
                <View
                  key={member.id}
                  className="p-4 rounded-2xl mb-3"
                  style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: member.role === "ADMIN" ? "#f59e0b33" : colors.bgCard }}
                    >
                      <Text style={{ color: member.role === "ADMIN" ? "#f59e0b" : colors.textMuted }} className="font-bold">
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
                      className="px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: member.role === "ADMIN" ? "#f59e0b22" : colors.bgCard }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: member.role === "ADMIN" ? "#f59e0b" : colors.textSecondary }}
                      >
                        {member.role === "ADMIN" ? t("cmp.role.admin") : t("cmp.role.user")}
                      </Text>
                    </View>
                  </View>

                  {isEmployee ? (
                    <>
                      <View className="flex-row flex-wrap gap-2">
                        {PANELS.map((panel) => {
                          const active = current.includes(panel.key);
                          return (
                            <TouchableOpacity
                              key={panel.key}
                              className="flex-row items-center gap-1.5 px-3 h-9 rounded-lg border"
                              style={{
                                backgroundColor: active ? colors.primary : colors.bgCard,
                                borderColor: active ? colors.primary : colors.border,
                              }}
                              onPress={() => togglePanel(member.id, panel.key)}
                              disabled={saving}
                            >
                              <Ionicons
                                name={active ? "checkbox" : "square-outline"}
                                size={14}
                                color={active ? "white" : colors.textMuted}
                              />
                              <Text className="text-sm font-medium" style={{ color: active ? "white" : colors.textSecondary }}>
                                {t(panel.titleKey)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
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
              );
            })}

            <View className="h-4" />

            <View
              className="p-4 rounded-2xl mb-4"
              style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt, borderWidth: 1 }}
            >
              <View className="flex-row items-center mb-1">
                <Text style={{ color: colors.text }} className="flex-1 text-lg font-bold">
                  {t("cmp.allUsers")}
                </Text>
                <TouchableOpacity
                  onPress={applyToAll}
                  disabled={saving}
                  className="px-3 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-sm font-semibold text-white">{t("cmp.applyAll")}</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textMuted }} className="text-sm mb-3">
                {t("cmp.accessHint")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PANELS.map((panel) => {
                  const active = bulkPanels.includes(panel.key);
                  return (
                    <TouchableOpacity
                      key={panel.key}
                      className="flex-row items-center gap-1.5 px-3 h-9 rounded-lg border"
                      style={{
                        backgroundColor: active ? colors.primary : colors.bgCard,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                      onPress={() =>
                        setBulkPanels((prev) =>
                          active ? prev.filter((p) => p !== panel.key) : [...prev, panel.key]
                        )
                      }
                      disabled={saving}
                    >
                      <Ionicons
                        name={active ? "checkbox" : "square-outline"}
                        size={14}
                        color={active ? "white" : colors.textMuted}
                      />
                      <Text className="text-sm font-medium" style={{ color: active ? "white" : colors.textSecondary }}>
                        {t(panel.titleKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-3">
                {t("cmp.adminNote")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={saveAll}
              disabled={saving}
              className="h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">{t("cmp.saveAll")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}