import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { templateApi, ServiceTemplate } from "../../api/templates";
import { serviceApi } from "../../api/services";
import { translateLabel } from "../../api/translate";
import { defaultTemplateConfig, isCustomField, FIELD_INPUT_TYPES, fieldNeedsOptions, type TemplateField, type TemplateChipGroup, type TemplateFieldInputType } from "./types";
import CustomAlert from "../CustomAlert";

type FieldModalState = { kind: "field"; key: string; labelTr: string; labelEn: string; inputType: TemplateFieldInputType };

type LabelModalState =
  | FieldModalState
  | { kind: "group"; key: string; labelTr: string; labelEn: string; inputType: "radio" | "select" | "multi" }
  | { kind: "option"; groupKey: string; key: string; labelTr: string; labelEn: string }
  | { kind: "fieldOption"; fieldKey: string; key: string; labelTr: string; labelEn: string }
  | null;

const sortFields = (a: TemplateField, b: TemplateField) => a.order - b.order;
const sortGroups = (a: TemplateChipGroup, b: TemplateChipGroup) => a.order - b.order;

export default function TemplateEditor() {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draft, setDraft] = useState<{ fields: TemplateField[]; chipGroups: TemplateChipGroup[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [labelModal, setLabelModal] = useState<LabelModalState>(null);
  const [labelValue, setLabelValue] = useState("");
  const [translating, setTranslating] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [createFromSelected, setCreateFromSelected] = useState(true);
  const [pendingFieldModal, setPendingFieldModal] = useState<FieldModalState | null>(null);
  const [applyAlert, setApplyAlert] = useState<{
    oldName: string;
    newName: string;
    config: any;
    oldState: { name: string; fields: TemplateField[]; chipGroups: TemplateChipGroup[] } | null;
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

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const selected = templates.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setDraftName(selected.name);
      setDraft({
        fields: JSON.parse(JSON.stringify(selected.fields)) as TemplateField[],
        chipGroups: JSON.parse(JSON.stringify(selected.chipGroups)) as TemplateChipGroup[],
      });
    } else {
      setDraftName("");
      setDraft(null);
    }
  }, [selected]);

  const isAdmin = user?.role === "ADMIN";

  const openLabelModal = (state: LabelModalState) => {
    setLabelModal(state);
    setLabelValue(state ? (lang === "tr" ? state.labelTr : state.labelEn) || state.labelTr || "" : "");
  };

  const saveLabelModal = async () => {
    if (!draft || !labelModal) return;
    const entered = labelValue.trim();
    if (!entered) return;
    setTranslating(true);
    try {
      const { tr, en } = await translateLabel(entered);
      const finalTr = lang === "tr" ? entered : tr || entered;
      const finalEn = lang === "en" ? entered : en || entered;
      if (labelModal.kind === "field") {
        setDraft({
          ...draft,
          fields: draft.fields.map((f) =>
            f.key === labelModal.key
              ? { ...f, labelTr: finalTr, labelEn: finalEn, inputType: labelModal.inputType }
              : f
          ),
        });
      } else if (labelModal.kind === "group") {
        setDraft({
          ...draft,
          chipGroups: draft.chipGroups.map((g) =>
            g.key === labelModal.key ? { ...g, labelTr: finalTr, labelEn: finalEn, inputType: labelModal.inputType } : g
          ),
        });
      } else if (labelModal.kind === "option") {
        setDraft({
          ...draft,
          chipGroups: draft.chipGroups.map((g) =>
            g.key === labelModal.groupKey
              ? {
                  ...g,
                  options: g.options.map((o) => (o.key === labelModal.key ? { ...o, labelTr: finalTr, labelEn: finalEn } : o)),
                }
              : g
          ),
        });
      } else {
        setDraft({
          ...draft,
          fields: draft.fields.map((f) =>
            f.key === labelModal.fieldKey
              ? { ...f, options: (f.options || []).map((o) => (o.key === labelModal.key ? { ...o, labelTr: finalTr, labelEn: finalEn } : o)) }
              : f
          ),
        });
        if (pendingFieldModal) {
          setLabelModal(pendingFieldModal);
          setLabelValue((lang === "tr" ? pendingFieldModal.labelTr : pendingFieldModal.labelEn) || pendingFieldModal.labelTr || "");
          setPendingFieldModal(null);
          return;
        }
      }
      setLabelModal(null);
    } finally {
      setTranslating(false);
    }
  };

  const setFieldInputType = (type: TemplateFieldInputType) => {
    if (!labelModal || labelModal.kind !== "field") return;
    setLabelModal({ ...labelModal, inputType: type });
  };

  const setGroupInputType = (type: "radio" | "select" | "multi") => {
    if (!labelModal || labelModal.kind !== "group") return;
    setLabelModal({ ...labelModal, inputType: type });
  };

  const addFieldOption = (fieldKey: string) => {
    if (!draft) return;
    const key = `opt_${Date.now()}`;
    setDraft({
      ...draft,
      fields: draft.fields.map((f) =>
        f.key === fieldKey
          ? { ...f, options: [...(f.options || []), { key, labelTr: t("tpl.newOptionTr"), labelEn: t("tpl.newOptionEn") }] }
          : f
      ),
    });
  };

  const deleteFieldOption = (fieldKey: string, key: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      fields: draft.fields.map((f) =>
        f.key === fieldKey ? { ...f, options: (f.options || []).filter((o) => o.key !== key) } : f
      ),
    });
  };

  const toggleField = (key: string) => {
    if (!draft) return;
    setDraft({ ...draft, fields: draft.fields.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)) });
  };

  const moveField = (key: string, dir: -1 | 1) => {
    if (!draft) return;
    const sorted = [...draft.fields].sort(sortFields);
    const idx = sorted.findIndex((f) => f.key === key);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[target];
    setDraft({
      ...draft,
      fields: draft.fields.map((f) =>
        f.key === a.key ? { ...f, order: b.order } : f.key === b.key ? { ...f, order: a.order } : f
      ),
    });
  };

  const toggleGroup = (key: string) => {
    if (!draft) return;
    setDraft({ ...draft, chipGroups: draft.chipGroups.map((g) => (g.key === key ? { ...g, enabled: !g.enabled } : g)) });
  };

  const moveGroup = (key: string, dir: -1 | 1) => {
    if (!draft) return;
    const sorted = [...draft.chipGroups].sort(sortGroups);
    const idx = sorted.findIndex((g) => g.key === key);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[target];
    setDraft({
      ...draft,
      chipGroups: draft.chipGroups.map((g) =>
        g.key === a.key ? { ...g, order: b.order } : g.key === b.key ? { ...g, order: a.order } : g
      ),
    });
  };

  const deleteGroup = (key: string) => {
    if (!draft) return;
    setDraft({ ...draft, chipGroups: draft.chipGroups.filter((g) => g.key !== key) });
  };

  const addField = () => {
    if (!draft) return;
    const key = `custom_${Date.now()}`;
    const maxOrder = draft.fields.reduce((max, f) => Math.max(max, f.order), 0);
    setDraft({
      ...draft,
      fields: [
        ...draft.fields,
        { key, labelTr: t("tpl.newFieldTr"), labelEn: t("tpl.newFieldEn"), enabled: true, order: maxOrder + 1 },
      ],
    });
  };

  const deleteField = (key: string) => {
    if (!draft || !isCustomField(key)) return;
    setDraft({ ...draft, fields: draft.fields.filter((f) => f.key !== key) });
  };

  const addGroup = () => {
    if (!draft) return;
    const key = `group_${Date.now()}`;
    const maxOrder = draft.chipGroups.reduce((max, g) => Math.max(max, g.order), 0);
    const optKey = `opt_${Date.now()}`;
    setDraft({
      ...draft,
      chipGroups: [
        ...draft.chipGroups,
        {
          key,
          labelTr: t("tpl.newGroupTr"),
          labelEn: t("tpl.newGroupEn"),
          enabled: true,
          order: maxOrder + 1,
          inputType: "multi",
          options: [{ key: optKey, labelTr: t("tpl.newOptionTr"), labelEn: t("tpl.newOptionEn") }],
        },
      ],
    });
  };

  const addOption = (groupKey: string) => {
    if (!draft) return;
    const key = `opt_${Date.now()}`;
    setDraft({
      ...draft,
      chipGroups: draft.chipGroups.map((g) =>
        g.key === groupKey
          ? { ...g, options: [...g.options, { key, labelTr: t("tpl.newOptionTr"), labelEn: t("tpl.newOptionEn") }] }
          : g
      ),
    });
  };

  const deleteOption = (groupKey: string, key: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      chipGroups: draft.chipGroups.map((g) =>
        g.key === groupKey ? { ...g, options: g.options.filter((o) => o.key !== key) } : g
      ),
    });
  };

  const handleCreate = async () => {
    if (!newTemplateName.trim()) return;
    setSaving(true);
    try {
      let fields = defaultTemplateConfig().fields;
      let chipGroups = defaultTemplateConfig().chipGroups;
      if (createFromSelected && selected && draft) {
        fields = JSON.parse(JSON.stringify(draft.fields));
        chipGroups = JSON.parse(JSON.stringify(draft.chipGroups));
      }
      const created = await templateApi.create({
        name: newTemplateName.trim(),
        fields,
        chipGroups,
      });
      setTemplates((prev) => [...prev, created.data]);
      setSelectedId(created.data.id);
      setCreateModal(false);
      AlertNew(t("tpl.created"), t("tpl.createdMsg"));
    } catch {
      AlertNew(t("common.error"), t("tpl.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!draftName.trim() || !draft || !selectedId) return;
    const oldName = selected?.name || draftName.trim();
    const oldState = selected
      ? {
          name: selected.name,
          fields: JSON.parse(JSON.stringify(selected.fields)) as TemplateField[],
          chipGroups: JSON.parse(JSON.stringify(selected.chipGroups)) as TemplateChipGroup[],
        }
      : null;
    setSaving(true);
    try {
      await templateApi.update(selectedId, { name: draftName.trim(), fields: draft.fields, chipGroups: draft.chipGroups });
      await loadTemplates();
      let count = 0;
      try {
        const c = await serviceApi.countByTemplate(oldName);
        count = c.data.count || 0;
      } catch {}
      if (count > 0) {
        setApplyAlert({
          oldName,
          newName: draftName.trim(),
          config: { fields: draft.fields, chipGroups: draft.chipGroups },
          oldState,
          count,
        });
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
      await templateApi.update(selectedId, {
        name: oldState.name,
        fields: oldState.fields,
        chipGroups: oldState.chipGroups,
      });
      await loadTemplates();
      setDraftName(oldState.name);
      setDraft({
        fields: JSON.parse(JSON.stringify(oldState.fields)) as TemplateField[],
        chipGroups: JSON.parse(JSON.stringify(oldState.chipGroups)) as TemplateChipGroup[],
      });
      AlertNew(t("common.info"), t("tpl.operationCancelled"));
    } catch {
      AlertNew(t("common.error"), t("tpl.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!selected) return;
    setDraftName(selected.name);
    setDraft({
      fields: JSON.parse(JSON.stringify(selected.fields)) as TemplateField[],
      chipGroups: JSON.parse(JSON.stringify(selected.chipGroups)) as TemplateChipGroup[],
    });
    setAlert(null);
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

  const fieldOptions =
    draft && labelModal?.kind === "field" ? draft.fields.find((f) => f.key === labelModal.key)?.options || [] : [];

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
                      <Text
                        className="text-sm font-medium"
                        style={{ color: active ? "white" : colors.textSecondary }}
                      >
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
                  onPress={() => {
                    setNewTemplateName("");
                    setCreateFromSelected(!!selected);
                    setCreateModal(true);
                  }}
                  disabled={saving}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.create")}</Text>
                </TouchableOpacity>
              </View>

              {selected && draft && (
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
                      className="h-9 px-4 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
                      onPress={handleDiscard}
                      disabled={saving}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="close-outline" size={14} color={colors.danger} />
                        <Text className="text-xs font-semibold ml-1" style={{ color: colors.danger }}>{t("tpl.discard")}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 h-9 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="font-semibold text-sm" style={{ color: "white" }}>{t("common.save")}</Text>
                      )}
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

                  <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>{t("tpl.fieldsSection")}</Text>
                  <Text className="text-xs mb-3" style={{ color: colors.textMuted }}>{t("tpl.fieldsHint")}</Text>
                  <View className="rounded-xl border overflow-hidden mb-5" style={{ borderColor: colors.border }}>
                    {[...draft.fields].sort(sortFields).map((f, idx, arr) => {
                      const localized = labelOf(f.labelTr, f.labelEn);
                      return (
                        <View
                          key={f.key}
                          className="flex-row items-center px-3 py-2.5"
                          style={{ borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border, backgroundColor: colors.bg }}
                        >
                          <View className="flex-1">
                            <Text className="text-sm" style={{ color: f.enabled ? colors.text : colors.textMuted }}>
                              {localized}
                            </Text>
                            {f.inputType && f.inputType !== "text" && (
                              <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                                {t(`tpl.type${f.inputType.charAt(0).toUpperCase() + f.inputType.slice(1)}`)}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity className="px-1.5" onPress={() => moveField(f.key, -1)} disabled={idx === 0}>
                            <Ionicons name="chevron-up" size={18} color={idx === 0 ? colors.textMuted : colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => moveField(f.key, 1)} disabled={idx === arr.length - 1}>
                            <Ionicons name="chevron-down" size={18} color={idx === arr.length - 1 ? colors.textMuted : colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => openLabelModal({ kind: "field", key: f.key, labelTr: f.labelTr, labelEn: f.labelEn, inputType: f.inputType || "text" })}>
                            <Ionicons name="create-outline" size={18} color={colors.teal} />
                          </TouchableOpacity>
                          {isCustomField(f.key) && (
                            <TouchableOpacity className="px-1.5" onPress={() => deleteField(f.key)}>
                              <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            </TouchableOpacity>
                          )}
                          <Switch
                            value={f.enabled}
                            onValueChange={() => toggleField(f.key)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor="#fff"
                          />
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    className="flex-row items-center justify-center h-9 rounded-lg border border-dashed mb-5"
                    style={{ borderColor: colors.border, backgroundColor: colors.bg }}
                    onPress={addField}
                  >
                    <Ionicons name="add" size={16} color={colors.primary} />
                    <Text className="text-sm font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.addField")}</Text>
                  </TouchableOpacity>

                  <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>{t("tpl.groupsSection")}</Text>
                  <Text className="text-xs mb-3" style={{ color: colors.textMuted }}>{t("tpl.groupsHint")}</Text>
                  {[...draft.chipGroups].sort(sortGroups).map((g, idx, arr) => {
                    const gLabel = labelOf(g.labelTr, g.labelEn);
                    return (
                      <View key={g.key} className="rounded-xl border mb-3 overflow-hidden" style={{ borderColor: colors.border }}>
                        <View
                          className="flex-row items-center px-3 py-2.5"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <View className="flex-1">
                            <Text className="text-sm" style={{ color: g.enabled ? colors.text : colors.textMuted }}>
                              {gLabel}
                            </Text>
                            {g.inputType && g.inputType !== "multi" && (
                              <Text className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                                {t(`tpl.type${g.inputType.charAt(0).toUpperCase() + g.inputType.slice(1)}`)}
                              </Text>
                            )}
                          </View>
                          <TouchableOpacity className="px-1.5" onPress={() => moveGroup(g.key, -1)} disabled={idx === 0}>
                            <Ionicons name="chevron-up" size={18} color={idx === 0 ? colors.textMuted : colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => moveGroup(g.key, 1)} disabled={idx === arr.length - 1}>
                            <Ionicons name="chevron-down" size={18} color={idx === arr.length - 1 ? colors.textMuted : colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity className="px-1.5" onPress={() => openLabelModal({ kind: "group", key: g.key, labelTr: g.labelTr, labelEn: g.labelEn, inputType: g.inputType || "multi" })}>
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
                        <View style={{ backgroundColor: colors.bgCard2 }} className="px-3 py-2">
                          {g.options.map((o) => {
                            const oLabel = labelOf(o.labelTr, o.labelEn);
                            return (
                              <View key={o.key} className="flex-row items-center py-1.5">
                                <Ionicons name="remove" size={16} color={colors.textMuted} />
                                <Text className="flex-1 text-sm" style={{ color: colors.text }}>{oLabel}</Text>
                                <TouchableOpacity className="px-1.5" onPress={() => openLabelModal({ kind: "option", groupKey: g.key, key: o.key, labelTr: o.labelTr, labelEn: o.labelEn })}>
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
              className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              value={newTemplateName}
              onChangeText={setNewTemplateName}
              placeholder={t("tpl.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.createSource")}</Text>
            {selected && (
              <TouchableOpacity
                className="flex-row items-center px-3 h-10 rounded-lg mb-2"
                style={{ backgroundColor: createFromSelected ? colors.primary + '1A' : colors.bg, borderColor: colors.border, borderWidth: 1 }}
                onPress={() => setCreateFromSelected(true)}
              >
                <Ionicons name={createFromSelected ? "radio-button-on" : "radio-button-off"} size={18} color={createFromSelected ? colors.primary : colors.textMuted} />
                <Text className="text-sm ml-2 flex-1" style={{ color: colors.text }}>{t("tpl.createCopy")}</Text>
                {selected && <Text className="text-xs" style={{ color: colors.textMuted }}>{selected.name}</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-row items-center px-3 h-10 rounded-lg mb-4"
              style={{ backgroundColor: !createFromSelected ? colors.primary + '1A' : colors.bg, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => setCreateFromSelected(false)}
            >
              <Ionicons name={!createFromSelected ? "radio-button-on" : "radio-button-off"} size={18} color={!createFromSelected ? colors.primary : colors.textMuted} />
              <Text className="text-sm ml-2 flex-1" style={{ color: colors.text }}>{t("tpl.createBlank")}</Text>
            </TouchableOpacity>
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
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!labelModal} transparent animationType="fade" onRequestClose={() => setLabelModal(null)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("tpl.editLabel")}</Text>
              <TouchableOpacity onPress={() => setLabelModal(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" className="max-h-[65%]">
            <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.label")}</Text>
            <TextInput
              className="w-full h-10 border rounded-lg px-3 text-sm mb-1"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
              value={labelValue}
              onChangeText={setLabelValue}
              placeholder={lang === "tr" ? "Türkçe" : "English"}
              placeholderTextColor={colors.textMuted}
            />
            <Text className="text-[10px] mb-3" style={{ color: colors.textMuted }}>{t("tpl.autoTranslateHint")}</Text>
            {labelModal?.kind === "group" && (
              <>
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.inputType")}</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {(["radio", "select", "multi"] as const).map((type) => {
                    const active = labelModal.inputType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        className="px-2.5 h-7 rounded-lg border"
                        style={{
                          backgroundColor: active ? colors.primary + '1A' : colors.bg,
                          borderColor: active ? colors.primary : colors.border,
                        }}
                        onPress={() => setGroupInputType(type)}
                      >
                        <Text className="text-[11px]" style={{ color: active ? colors.primary : colors.textSecondary }}>
                          {t(`tpl.type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
            {labelModal?.kind === "field" && (
              <>
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.inputType")}</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {FIELD_INPUT_TYPES.map((type) => {
                    const active = labelModal.inputType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        className="px-2.5 h-7 rounded-lg border"
                        style={{
                          backgroundColor: active ? colors.primary + '1A' : colors.bg,
                          borderColor: active ? colors.primary : colors.border,
                        }}
                        onPress={() => setFieldInputType(type)}
                      >
                        <Text className="text-[11px]" style={{ color: active ? colors.primary : colors.textSecondary }}>
                          {t(`tpl.type${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {fieldNeedsOptions(labelModal.inputType) && (
                  <View className="rounded-xl border mb-3" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
                    <View className="px-3 py-2">
                      <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("tpl.fieldOptions")}</Text>
                      {(fieldOptions || []).map((o) => {
                        const oLabel = labelOf(o.labelTr, o.labelEn);
                        return (
                          <View key={o.key} className="flex-row items-center py-1.5">
                            <Ionicons name="remove" size={16} color={colors.textMuted} />
                            <Text className="flex-1 text-sm" style={{ color: colors.text }}>{oLabel}</Text>
                            <TouchableOpacity
                              className="px-1.5"
                              onPress={() => {
                                setPendingFieldModal(labelModal);
                                setLabelModal({ kind: "fieldOption", fieldKey: labelModal.key, key: o.key, labelTr: o.labelTr, labelEn: o.labelEn });
                              }}
                            >
                              <Ionicons name="create-outline" size={16} color={colors.teal} />
                            </TouchableOpacity>
                            <TouchableOpacity className="px-1.5" onPress={() => deleteFieldOption(labelModal.key, o.key)}>
                              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      <TouchableOpacity
                        className="flex-row items-center justify-center h-8 rounded-lg mt-1"
                        style={{ backgroundColor: colors.primary + "15" }}
                        onPress={() => addFieldOption(labelModal.key)}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                        <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("tpl.addOption")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}
            </ScrollView>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.bgInput }}
                onPress={() => setLabelModal(null)}
              >
                <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                onPress={saveLabelModal}
                disabled={translating}
              >
                {translating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>
                )}
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
        onClose={() => {
          setApplyAlert(null);
          AlertNew(t("common.success"), t("tpl.saved"));
        }}
        onConfirm={handleApplyToRecords}
        confirmText={t("tpl.applyYes")}
        confirmColor={colors.primary}
        cancelText={t("tpl.applyNo")}
        thirdButton={{
          text: t("tpl.applyCancel"),
          color: colors.danger,
          onPress: handleCancelApply,
        }}
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
