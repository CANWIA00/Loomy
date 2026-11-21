import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { ALL_UNITS, filterUnitGroups, normalizeForSearch } from "../utils/units";
import { unitApi, type CustomUnit } from "../apiclient/units";

interface Props {
  visible: boolean;
  value?: string | null;
  title?: string;
  onSelect: (unit: string) => void;
  onClose: () => void;
}

const MAX_UNIT_LENGTH = 20;

/**
 * Birim secici: sirketin ekledigi birimler + genel gecer birimler. Kullanicilar
 * "Yeni birim ekle" ile sirkete kalici birim ekleyebilir; yonetici silebilir.
 */
export default function UnitPickerModal({ visible, value, title, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { height } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const loadCustomUnits = useCallback(async () => {
    try {
      const res = await unitApi.list();
      setCustomUnits(res.data);
    } catch {
      // Liste yuklenemezse genel birimler yine de kullanilabilir.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setAdding(false);
    setNewUnit("");
    setError(null);
    setConfirmDeleteId(null);
    loadCustomUnits();
  }, [visible, loadCustomUnits]);

  const groups = useMemo(() => filterUnitGroups(query, lang), [query, lang]);
  const q = normalizeForSearch(query);
  const filteredCustom = useMemo(
    () => (q ? customUnits.filter((u) => normalizeForSearch(u.name).includes(q)) : customUnits),
    [customUnits, q]
  );

  const existsAlready = (name: string) => {
    const n = normalizeForSearch(name);
    return ALL_UNITS.some((u) => normalizeForSearch(u) === n) || customUnits.some((u) => normalizeForSearch(u.name) === n);
  };

  const searchText = query.trim();
  const canAddFromSearch = searchText.length > 0 && searchText.length <= MAX_UNIT_LENGTH && !existsAlready(searchText);

  const choose = (unit: string) => {
    onSelect(unit);
    onClose();
  };

  const addUnit = async (raw: string) => {
    const name = raw.trim().slice(0, MAX_UNIT_LENGTH);
    if (!name || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await unitApi.create(name);
      setCustomUnits((prev) => (prev.some((u) => u.id === res.data.id) ? prev : [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name, "tr"))));
      choose(res.data.name);
    } catch {
      setError(t("unit.addError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteUnit = async (unit: CustomUnit) => {
    setError(null);
    try {
      await unitApi.remove(unit.id);
      setCustomUnits((prev) => prev.filter((u) => u.id !== unit.id));
      setConfirmDeleteId(null);
    } catch {
      setError(t("unit.deleteError"));
    }
  };

  const unitRow = (key: string, label: string, hint: string | undefined, trailing?: React.ReactNode) => {
    const selected = value === label;
    return (
      <TouchableOpacity
        key={key}
        className="flex-row items-center px-3 py-2.5 rounded-lg"
        style={selected ? { backgroundColor: colors.primary + "14" } : undefined}
        onPress={() => choose(label)}
      >
        <Text className="text-sm font-semibold" style={{ color: colors.text, minWidth: 64 }} numberOfLines={1}>{label}</Text>
        {hint ? (
          <Text className="text-xs flex-1" style={{ color: colors.textMuted }} numberOfLines={1}>{hint}</Text>
        ) : (
          <View className="flex-1" />
        )}
        {selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
        {trailing}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View className="rounded-2xl w-full p-4" style={{ backgroundColor: colors.bgCard, maxWidth: 380, maxHeight: height * 0.85 }}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{title || t("unit.title")}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel={t("common.cancel")}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center h-10 border rounded-lg px-3 mb-2" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              className="flex-1 ml-2 text-sm"
              style={{ color: colors.text, minWidth: 0 }}
              placeholder={t("unit.search")}
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 1 }}>
            {canAddFromSearch && (
              <TouchableOpacity
                className="flex-row items-center px-3 py-3 rounded-lg mb-1"
                style={{ backgroundColor: colors.primary + "14" }}
                onPress={() => addUnit(searchText)}
                disabled={saving}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2 flex-1" style={{ color: colors.primary }} numberOfLines={1}>
                  {t("unit.addFromSearch", { unit: searchText })}
                </Text>
                {saving && <ActivityIndicator size="small" color={colors.primary} />}
              </TouchableOpacity>
            )}

            {filteredCustom.length > 0 && (
              <View className="mb-1">
                <Text className="text-[11px] font-semibold uppercase px-1 pt-2 pb-1" style={{ color: colors.textMuted }}>
                  {t("unit.group.custom")}
                </Text>
                {filteredCustom.map((u) =>
                  confirmDeleteId === u.id ? (
                    <View key={`c-${u.id}`} className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: colors.danger + "14" }}>
                      <Text className="text-xs mb-2" style={{ color: colors.text }}>{t("unit.deleteConfirm", { unit: u.name })}</Text>
                      <View className="flex-row justify-end gap-2">
                        <TouchableOpacity className="h-8 px-3 rounded-lg items-center justify-center border" style={{ borderColor: colors.border }} onPress={() => setConfirmDeleteId(null)}>
                          <Text className="text-xs font-medium" style={{ color: colors.text }}>{t("common.cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="h-8 px-3 rounded-lg items-center justify-center" style={{ backgroundColor: colors.danger }} onPress={() => deleteUnit(u)}>
                          <Text className="text-xs font-semibold" style={{ color: "#fff" }}>{t("common.delete")}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    unitRow(
                      `c-${u.id}`,
                      u.name,
                      undefined,
                      isAdmin ? (
                        <TouchableOpacity
                          onPress={() => setConfirmDeleteId(u.id)}
                          hitSlop={8}
                          className="ml-2 h-7 w-7 items-center justify-center"
                          accessibilityLabel={t("common.delete")}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      ) : null
                    )
                  )
                )}
              </View>
            )}

            {groups.map((group) => (
              <View key={group.key} className="mb-1">
                <Text className="text-[11px] font-semibold uppercase px-1 pt-2 pb-1" style={{ color: colors.textMuted }}>
                  {t(`unit.group.${group.key}`)}
                </Text>
                {group.units.map((u) => unitRow(u.value, u.value, u.hint?.[lang]))}
              </View>
            ))}

            {groups.length === 0 && filteredCustom.length === 0 && !canAddFromSearch && (
              <Text className="text-sm text-center py-4" style={{ color: colors.textMuted }}>{t("unit.empty")}</Text>
            )}
          </ScrollView>

          {error && (
            <Text className="text-xs mt-2" style={{ color: colors.danger }}>{error}</Text>
          )}

          {/* Yeni birim ekleme: her zaman listenin altinda */}
          <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            {adding ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  className="flex-1 h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, color: colors.text, minWidth: 0 }}
                  placeholder={t("unit.addPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={newUnit}
                  onChangeText={(v) => setNewUnit(v.slice(0, MAX_UNIT_LENGTH))}
                  onSubmitEditing={() => addUnit(newUnit)}
                  autoFocus
                  returnKeyType="done"
                />
                <TouchableOpacity
                  className="h-10 px-4 rounded-lg items-center justify-center"
                  style={{ backgroundColor: newUnit.trim() ? colors.primary : colors.primary + "55" }}
                  onPress={() => addUnit(newUnit)}
                  disabled={!newUnit.trim() || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-sm font-semibold" style={{ color: "#fff" }}>{t("unit.addSave")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="h-10 rounded-lg items-center justify-center flex-row gap-1.5 border border-dashed"
                style={{ borderColor: colors.primary, backgroundColor: colors.primary + "0A" }}
                onPress={() => { setAdding(true); setNewUnit(searchText.slice(0, MAX_UNIT_LENGTH)); }}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text className="text-sm font-medium" style={{ color: colors.primary }}>{t("unit.add")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
