import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ALL_UNITS, filterUnitGroups, normalizeForSearch } from "../utils/units";

interface Props {
  visible: boolean;
  value?: string | null;
  title?: string;
  onSelect: (unit: string) => void;
  onClose: () => void;
}

/** Aramali, kategorili birim secici. Listede olmayan birim ozel olarak girilebilir. */
export default function UnitPickerModal({ visible, value, title, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t, lang } = useLanguage();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const groups = useMemo(() => filterUnitGroups(query, lang), [query, lang]);
  const custom = query.trim();
  // "m2" ~ "m²", "kg" ~ "Kg" gibi zaten listede olan birimler icin ozel secenek gosterilmez.
  const canUseCustom =
    custom.length > 0 && custom.length <= 20 && !ALL_UNITS.some((u) => normalizeForSearch(u) === normalizeForSearch(custom));

  const choose = (unit: string) => {
    onSelect(unit);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View className="rounded-2xl w-full p-4" style={{ backgroundColor: colors.bgCard, maxWidth: 380, maxHeight: height * 0.8 }}>
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

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
            {canUseCustom && (
              <TouchableOpacity
                className="flex-row items-center px-3 py-3 rounded-lg mb-1"
                style={{ backgroundColor: colors.primary + "14" }}
                onPress={() => choose(custom)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text className="text-sm font-medium ml-2 flex-1" style={{ color: colors.primary }} numberOfLines={1}>
                  {t("unit.useCustom", { unit: custom })}
                </Text>
              </TouchableOpacity>
            )}

            {groups.map((group) => (
              <View key={group.key} className="mb-1">
                <Text className="text-[11px] font-semibold uppercase px-1 pt-2 pb-1" style={{ color: colors.textMuted }}>
                  {t(`unit.group.${group.key}`)}
                </Text>
                {group.units.map((u) => {
                  const selected = value === u.value;
                  return (
                    <TouchableOpacity
                      key={u.value}
                      className="flex-row items-center px-3 py-2.5 rounded-lg"
                      style={selected ? { backgroundColor: colors.primary + "14" } : undefined}
                      onPress={() => choose(u.value)}
                    >
                      <Text className="text-sm font-semibold" style={{ color: colors.text, minWidth: 64 }}>{u.value}</Text>
                      {u.hint ? (
                        <Text className="text-xs flex-1" style={{ color: colors.textMuted }} numberOfLines={1}>{u.hint[lang]}</Text>
                      ) : (
                        <View className="flex-1" />
                      )}
                      {selected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {groups.length === 0 && !canUseCustom && (
              <Text className="text-sm text-center py-4" style={{ color: colors.textMuted }}>{t("unit.empty")}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
