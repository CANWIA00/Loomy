import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { templateApi, ServiceTemplate } from "../../apiclient/templates";
import { serviceApi } from "../../apiclient/services";
import { translateLabel } from "../../apiclient/translate";
import { type TemplateChipGroup, type TemplateField, type ServiceTemplateConfig, defaultTemplateConfig, isGeneralField } from "./types";
import CustomAlert from "../CustomAlert";

const sortGroups = (a: TemplateChipGroup, b: TemplateChipGroup) => a.order - b.order;

const GROUP_INPUT_TYPES = ["multi", "radio", "select", "text"] as const;

const normalizeFields = (fields: TemplateField[]): TemplateField[] => {
  const defaults = defaultTemplateConfig().fields;
  const byKey = new Map<string, TemplateField>();
  fields.forEach((f) => byKey.set(f.key, f));
  defaults.forEach((d) => { if (!byKey.has(d.key)) byKey.set(d.key, d); });
  return [...byKey.values()].sort((a, b) => a.order - b.order);
};

export default function TemplateEditor() {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draft, setDraft] = useState<TemplateChipGroup[] | null>(null);
  const [draftFields, setDraftFields] = useState<TemplateField[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editNameModal, setEditNameModal] = useState<{ kind: "group" | "option" | "customField"; groupKey: string; optionKey?: string; value: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [applyAlert, setApplyAlert] = useState<{
    oldName: string;
    newName: string;
    config: ServiceTemplateConfig;
    oldState: { name: string; groups: TemplateChipGroup[]; fields: TemplateField[] } | null;
    count: number;
  } | null>(null);

  const AlertNew = (title: string, message: string) => setAlert({ title, message });

  const loadTemplates = useCallback(async () => {
    try {
      const res = await templateApi.getAll();
      setTemplates(res.data);
      setSelectedId((prev) => {
        if (prev && res.data.some((t) => t.id === prev)) return prev;
        return res.data.find((t) => t.isDefault)?.id || res.data[0]?.id || null;
      });
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const selected = templates.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDraftName(selected.name);
      setDraft(JSON.parse(JSON.stringify(selected.chipGroups)) as TemplateChipGroup[]);
      setDraftFields(normalizeFields(JSON.parse(JSON.stringify(selected.fields)) as TemplateField[]));
    } else {
      setDraftName("");
      setDraft(null);
      setDraftFields(null);
    }
  }, [selected]);

  const isAdmin = user?.role === "ADMIN";

  const handleCreate = async () => {
    if (!newTemplateName.trim()) return;
    setSaving(true);
    try {
      const created = await templateApi.create({
        name: newTemplateName.trim(),
        fields: normalizeFields([]),
        chipGroups: [],
      });
      setTemplates((prev) => [...prev, created.data]);
      setSelectedId(created.data.id);
      setCreateModal(false);
      setNewTemplateName("");
      AlertNew(t("tpl.created"), t("tpl.createdMsg"));
    } catch {
      AlertNew(t("common.error"), t("tpl.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!draftName.trim() || !draft || !draftFields || !selectedId) return;
    const oldName = selected?.name || draftName.trim();
    const oldState = selected
      ? { name: selected.name, groups: JSON.parse(JSON.stringify(selected.chipGroups)) as TemplateChipGroup[], fields: JSON.parse(JSON.stringify(selected.fields)) as TemplateField[] }
      : null;
    setSaving(true);
    try {
      await templateApi.update(selectedId, { name: draftName.trim(), fields: draftFields, chipGroups: draft });
      await loadTemplates();
      let count = 0;
      try {
        const c = await serviceApi.countByTemplate(oldName);
        count = c.data.count || 0;
      } catch {}
      if (count > 0) {
        setApplyAlert({ oldName, newName: draftName.trim(), config: { fields: draftFields, chipGroups: draft }, oldState, count });
      } else {
        AlertNew(t("common.success"), t("tpl.saved"));
      }
    } catch {
      AlertNew(t("common.error"), t("tpl.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToRecords = async () => {
    if (!applyAlert) return;
    setSaving(true);
    try {
      const res = await serviceApi.applyTemplateConfig(applyAlert.oldName, applyAlert.newName, applyAlert.config);
      setApplyAlert(null);
      AlertNew(t("common.success"), t("tpl.recordsUpdated", { count: String(res.data.updated) }));
    } catch {
      setApplyAlert(null);
      AlertNew(t("common.error"), t("tpl.errorApply"));
    } finally {
      setSaving(false);
    }
  };

  const handleCancelApply = async () => {
    if (!applyAlert || !applyAlert.oldState || !selectedId) return;
    const oldState = applyAlert.oldState;
    setApplyAlert(null);
    setSaving(true);
    try {
      await templateApi.update(selectedId, { name: oldState.name, fields: oldState.fields, chipGroups: oldState.groups });
      await loadTemplates();
      setDraftName(oldState.name);
      setDraft(JSON.parse(JSON.stringify(oldState.groups)) as TemplateChipGroup[]);
      setDraftFields(normalizeFields(JSON.parse(JSON.stringify(oldState.fields)) as TemplateField[]));
      AlertNew(t("common.info"), t("tpl.operationCancelled"));
    } catch {
      AlertNew(t("common.error"), t("tpl.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await templateApi.setDefault(selectedId);
      await loadTemplates();
    } catch {
      AlertNew(t("common.error"), t("tpl.errorDefault"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteAlert(false);
    if (!selectedId) return;
    setSaving(true);
    try {
      await templateApi.delete(selectedId);
      setSelectedId(null);
      await loadTemplates();
    } catch (e: any) {
      AlertNew(t("common.error"), e?.response?.data?.message || t("tpl.errorDelete"));
    } finally {
      setSaving(false);
    }
  };

  const addGroup = () => {
    if (!draft) return;
    const key = `group_${Date.now()}`;
    const maxOrder = draft.reduce((max, g) => Math.max(max, g.order), 0);
    setDraft([
      ...draft,
      {
        key,
        labelTr: t("tpl.newGroupTr"),
        labelEn: t("tpl.newGroupEn"),
        enabled: true,
        order: maxOrder + 1,
        inputType: "multi",
        options: [],
      },
    ]);
    setExpandedGroup(key);
  };

  const deleteGroup = (key: string) => {
    if (!draft) return;
    setDraft(draft.filter((g) => g.key !== key));
    if (expandedGroup === key) setExpandedGroup(null);
  };

  const toggleGroup = (key: string) => {
    if (!draft) return;
    setDraft(draft.map((g) => (g.key === key ? { ...g, enabled: !g.enabled } : g)));
  };

  const moveGroup = (key: string, dir: -1 | 1) => {
    if (!draft) return;
    const sorted = [...draft].sort(sortGroups);
    const idx = sorted.findIndex((g) => g.key === key);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[target];
    setDraft(draft.map((g) => (g.key === a.key ? { ...g, order: b.order } : g.key === b.key ? { ...g, order: a.order } : g)));
  };

  const setGroupInputType = (key: string, inputType: TemplateChipGroup["inputType"]) => {
    if (!draft) return;
    setDraft(draft.map((g) => (g.key === key ? { ...g, inputType } : g)));
  };

  const addOption = (groupKey: string) => {
    if (!draft) return;
    const key = `opt_${Date.now()}`;
    setDraft(draft.map((g) =>
      g.key === groupKey
        ? { ...g, options: [...g.options, { key, labelTr: t("tpl.newOptionTr"), labelEn: t("tpl.newOptionEn") }] }
        : g
    ));
  };

  const deleteOption = (groupKey: string, optKey: string) => {
    if (!draft) return;
    setDraft(draft.map((g) =>
      g.key === groupKey ? { ...g, options: g.options.filter((o) => o.key !== optKey) } : g
    ));
  };

  const saveNameEdit = async () => {
    if (!editNameModal) return;
    const val = editNameModal.value.trim();
    if (!val) { setEditNameModal(null); return; }
    setTranslating(true);
    try {
      const { tr, en } = await translateLabel(val);
      const finalTr = lang === "tr" ? val : tr || val;
      const finalEn = lang === "en" ? val : en || val;
      if (editNameModal.kind === "customField" && draftFields) {
        setDraftFields(draftFields.map((f) =>
          f.key === editNameModal.groupKey ? { ...f, labelTr: finalTr, labelEn: finalEn } : f
        ));
      } else if (editNameModal.kind === "group" && draft) {
        setDraft(draft.map((g) => (g.key === editNameModal.groupKey ? { ...g, labelTr: finalTr, labelEn: finalEn } : g)));
      } else if (editNameModal.kind === "option" && editNameModal.optionKey && draft) {
        setDraft(draft.map((g) =>
          g.key === editNameModal.groupKey
            ? { ...g, options: g.options.map((o) => (o.key === editNameModal.optionKey ? { ...o, labelTr: finalTr, labelEn: finalEn } : o)) }
            : g
        ));
      }
    } finally {
      setTranslating(false);
      setEditNameModal(null);
    }
  };

  const setFieldRequired = (key: string, required: boolean) => {
    if (!draftFields) return;
    setDraftFields(draftFields.map((f) =>
      f.key === key ? { ...f, required, enabled: required ? true : f.enabled } : f
    ));
  };

  const toggleFieldVisibility = (key: string) => {
    if (!draftFields) return;
    setDraftFields(draftFields.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  };

  const addCustomField = () => {
    if (!draftFields) return;
    const key = `custom_${Date.now()}`;
    const maxOrder = draftFields.reduce((max, f) => Math.max(max, f.order || 0), 0);
    setDraftFields([
      ...draftFields,
      { key, labelTr: t("tpl.newFieldTr"), labelEn: t("tpl.newFieldEn"), enabled: true, required: false, order: maxOrder + 1 },
    ]);
  };

  const deleteCustomField = (key: string) => {
    if (!draftFields) return;
    setDraftFields(draftFields.filter((f) => f.key !== key));
  };

  const renderFieldRow = (f: TemplateField) => {
    const fLabel = labelOf(f.labelTr, f.labelEn);
    const isCustom = f.key.startsWith("custom_");
    return (
      <View key={f.key} className="flex-row items-center px-3 py-2.5 rounded-xl border mb-2" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
        <Ionicons name={f.required ? "lock-closed" : "lock-open-outline"} size={14} color={f.required ? colors.primary : colors.textMuted} />
        <Text className="flex-1 text-sm ml-2" style={{ color: (f.required || f.enabled) ? colors.text : colors.textMuted }}>{fLabel}</Text>
        <View className="flex-row rounded-lg overflow-hidden border mr-1" style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={() => setFieldRequired(f.key, true)} className="px-2 h-7 items-center justify-center" style={{ backgroundColor: f.required ? colors.primary : colors.bgInput }}>
            <Text className="text-[10px] font-medium" style={{ color: f.required ? "white" : colors.textSecondary }}>{t("tpl.required")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFieldRequired(f.key, false)} className="px-2 h-7 items-center justify-center" style={{ backgroundColor: f.required ? colors.bgInput : colors.primary }}>
            <Text className="text-[10px]" style={{ color: f.required ? colors.textSecondary : "white" }}>{t("tpl.optional")}</Text>
          </TouchableOpacity>
        </View>
        {!f.required && (
          <Switch
            value={f.enabled}
            onValueChange={() => toggleFieldVisibility(f.key)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        )}
        <TouchableOpacity className="px-1.5 ml-1" onPress={() => setEditNameModal({ kind: "customField", groupKey: f.key, value: fLabel })}>
          <Ionicons name="create-outline" size={16} color={colors.teal} />
        </TouchableOpacity>
        {isCustom && (
          <TouchableOpacity className="px-1.5" onPress={() => deleteCustomField(f.key)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!isAdmin) {
    return (
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <Text style={{ color: colors.text }}>{t("tpl.noAccess")}</Text>
        </View>
      </ScrollView>
    );
  }

  const labelOf = (lTr: string, lEn: string) => (lang === "tr" ? lTr : lEn);

  return (
    <>
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
                {t("tpl.title")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
              <Ionicons name="home-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.textMuted }} className="text-sm mt-1 mb-4">
            {t("tpl.subtitle")}
          </Text>

          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap gap-2 mb-4 items-center">
                {templates.map((tpl) => {
                  const active = tpl.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      className="flex-row items-center px-3 h-9 rounded-lg border"
                      style={{
                        backgroundColor: active ? colors.primary : colors.bgCard2,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                      onPress={() => setSelectedId(tpl.id)}
                    >
                      <Text className="text-sm font-medium" style={{ color: active ? "white" : colors.textSecondary }}>
                        {tpl.name}
                      </Text>
                      {tpl.isDefault && (
                        <Ionicons name="star" size={12} color={active ? "white" : colors.warning} style={{ marginLeft: 5 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  className="flex-row items-center px-3 h-9 rounded-lg border border-dashed"
                  style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                  onPress={() => { setNewTemplateName(""); setCreateModal(true); }}
                  disabled={saving}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.create")}</Text>
                </TouchableOpacity>
              </View>

              {selected && draft && draftFields && (
                <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{t("tpl.name")}</Text>
                    <TextInput
                      className="flex-1 h-9 border rounded-lg px-3 text-sm"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                      value={draftName}
                      onChangeText={setDraftName}
                      placeholder={t("tpl.namePlaceholder")}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <TouchableOpacity
                      className="flex-1 h-9 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="font-semibold text-sm" style={{ color: "white" }}>{t("common.save")}</Text>}
                    </TouchableOpacity>
                    {!selected.isDefault && (
                      <TouchableOpacity
                        className="h-9 px-4 rounded-lg items-center justify-center"
                        style={{ backgroundColor: colors.success + "22" }}
                        onPress={handleSetDefault}
                        disabled={saving}
                      >
                        <Text className="text-xs font-semibold" style={{ color: colors.success }}>{t("tpl.setDefault")}</Text>
                      </TouchableOpacity>
                    )}
                    {templates.length > 1 && (
                      <TouchableOpacity
                        className="h-9 px-4 rounded-lg items-center justify-center"
                        style={{ backgroundColor: colors.danger + "22" }}
                        onPress={() => setDeleteAlert(true)}
                        disabled={saving}
                      >
                        <Text className="text-xs font-semibold" style={{ color: colors.danger }}>{t("common.delete")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{t("tpl.customFieldsSection")}</Text>
                  <Text className="text-xs mb-3" style={{ color: colors.textMuted }}>{t("tpl.customFieldsHint")}</Text>
                  {draftFields && draftFields.filter((f) => !isGeneralField(f.key)).map((f) => renderFieldRow(f))}
                  <TouchableOpacity
                    className="flex-row items-center justify-center h-10 rounded-lg border border-dashed mb-5"
                    style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                    onPress={addCustomField}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.addCustomField")}</Text>
                  </TouchableOpacity>

                  <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{t("tpl.generalFieldsSection")}</Text>
                  <Text className="text-xs mb-3" style={{ color: colors.textMuted }}>{t("tpl.generalFieldsHint")}</Text>
                  {draftFields && draftFields.filter((f) => isGeneralField(f.key)).map((f) => renderFieldRow(f))}

                  <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>{t("tpl.groupsSection")}</Text>
                  <Text className="text-xs mb-3" style={{ color: colors.textMuted }}>{t("tpl.groupsHint")}</Text>

                  {[...draft].sort(sortGroups).map((g) => {
                    const gLabel = labelOf(g.labelTr, g.labelEn);
                    const isExpanded = expandedGroup === g.key;
                    const inputTypeLabel = g.inputType === "text" ? t("tpl.typeText") : g.inputType === "radio" ? t("tpl.typeRadio") : g.inputType === "select" ? t("tpl.typeSelect") : t("tpl.typeMulti");
                    return (
                      <View key={g.key} className="rounded-xl border mb-3 overflow-hidden" style={{ borderColor: colors.border }}>
                        <View className="flex-row items-center px-3 py-2.5" style={{ backgroundColor: colors.bg }}>
                          <TouchableOpacity className="flex-1" onPress={() => setExpandedGroup(isExpanded ? null : g.key)}>
                            <Text className="text-sm font-medium" style={{ color: g.enabled ? colors.text : colors.textMuted }}>
                              {gLabel}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-0.5">
                              <Text className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.primary + "15", color: colors.primary }}>
                                {inputTypeLabel}
                              </Text>
                              <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                                {g.options.length} {t("tpl.itemsLabel")}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => moveGroup(g.key, -1)}>
                            <Ionicons name="chevron-up" size={18} color={colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => moveGroup(g.key, 1)}>
                            <Ionicons name="chevron-down" size={18} color={colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="px-1.5"
                            onPress={() => setEditNameModal({ kind: "group", groupKey: g.key, value: gLabel })}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.teal} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => deleteGroup(g.key)}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                          </TouchableOpacity>
                          <Switch
                            value={g.enabled}
                            onValueChange={() => toggleGroup(g.key)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                          />
                        </View>

                        {isExpanded && (
                          <View style={{ backgroundColor: colors.bgCard2 }} className="px-3 py-2">
                            <Text className="text-[10px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("tpl.inputType")}</Text>
                            <View className="flex-row flex-wrap gap-1.5 mb-3">
                              {GROUP_INPUT_TYPES.map((type) => {
                                const active = g.inputType === type;
                                return (
                                  <TouchableOpacity
                                    key={type}
                                    className="px-2.5 h-7 rounded-lg border"
                                    style={{
                                      backgroundColor: active ? colors.primary + "1A" : colors.bg,
                                      borderColor: active ? colors.primary : colors.border,
                                    }}
                                    onPress={() => setGroupInputType(g.key, type)}
                                  >
                                    <Text className="text-[11px]" style={{ color: active ? colors.primary : colors.textSecondary }}>
                                      {t(`tpl.type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>

                            {g.options.map((o) => {
                              const oLabel = labelOf(o.labelTr, o.labelEn);
                              return (
                                <View key={o.key} className="flex-row items-center py-1.5">
                                  {g.inputType === "radio" ? (
                                    <Ionicons name="radio-button-off" size={14} color={colors.textMuted} />
                                  ) : g.inputType === "text" ? (
                                    <Ionicons name="text-outline" size={14} color={colors.textMuted} />
                                  ) : (
                                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.textMuted} />
                                  )}
                                  <Text className="flex-1 text-sm ml-2" style={{ color: colors.text }}>{oLabel}</Text>
                                  <TouchableOpacity
                                    className="px-1.5"
                                    onPress={() => setEditNameModal({ kind: "option", groupKey: g.key, optionKey: o.key, value: oLabel })}
                                  >
                                    <Ionicons name="create-outline" size={16} color={colors.teal} />
                                  </TouchableOpacity>
                                  <TouchableOpacity className="px-1.5" onPress={() => deleteOption(g.key, o.key)}>
                                    <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}

                            <TouchableOpacity
                              className="flex-row items-center justify-center h-8 rounded-lg mt-1"
                              style={{ backgroundColor: colors.primary + "15" }}
                              onPress={() => addOption(g.key)}
                            >
                              <Ionicons name="add" size={16} color={colors.primary} />
                              <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.addOption")}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    className="flex-row items-center justify-center h-10 rounded-lg border border-dashed"
                    style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                    onPress={addGroup}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.addGroup")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={createModal} transparent animationType="fade" onRequestClose={() => setCreateModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("tpl.createTitle")}</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.name")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-4"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholder={t("tpl.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={() => setCreateModal(false)}
              >
                <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                onPress={handleCreate}
                disabled={saving || !newTemplateName.trim()}
              >
                {saving ? <ActivityIndicator size="small" color="white" /> : <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editNameModal} transparent animationType="fade" onRequestClose={() => setEditNameModal(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {editNameModal?.kind === "group" ? t("tpl.editGroupName") : editNameModal?.kind === "customField" ? t("tpl.editCustomFieldName") : t("tpl.editOptionName")}
              </Text>
              <TouchableOpacity onPress={() => setEditNameModal(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.label")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-1"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              value={editNameModal?.value || ""}
              onChangeText={(v) => editNameModal && setEditNameModal({ ...editNameModal, value: v })}
              placeholder={lang === "tr" ? "Türkçe" : "English"}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <Text className="text-[10px] mb-4" style={{ color: colors.textMuted }}>{t("tpl.autoTranslateHint")}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={() => setEditNameModal(null)}
              >
                <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                onPress={saveNameEdit}
                disabled={translating}
              >
                {translating ? <ActivityIndicator size="small" color="white" /> : <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={deleteAlert}
        type="confirm"
        title={t("common.delete")}
        message={t("tpl.confirmDelete")}
        onClose={() => setDeleteAlert(false)}
        onConfirm={handleDelete}
        confirmText={t("common.delete")}
        confirmColor={colors.danger}
      />

      <CustomAlert
        visible={!!applyAlert}
        type="confirm"
        title={t("tpl.applyTitle")}
        message={t("tpl.applyMessage", { count: String(applyAlert?.count ?? 0) })}
        onClose={() => { setApplyAlert(null); AlertNew(t("common.success"), t("tpl.saved")); }}
        onConfirm={handleApplyToRecords}
        confirmText={t("tpl.applyYes")}
        confirmColor={colors.primary}
        cancelText={t("tpl.applyNo")}
        thirdButton={{ text: t("tpl.applyCancel"), color: colors.danger, onPress: handleCancelApply }}
      />

      <CustomAlert
        visible={!!alert}
        type="success"
        title={alert?.title || ""}
        message={alert?.message || ""}
        onClose={() => setAlert(null)}
      />
    </>
  );
}
