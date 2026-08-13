import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useServices } from "./ServicesContext";
import type { RecordFilter } from "./types";

const FILTERS: RecordFilter[] = ["all", "gun", "ay", "yil"];

export default function RecordsSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    filteredRecords,
    filter,
    setFilter,
    filterDate,
    setFilterDate,
    filterDocument,
    setFilterDocument,
    filterCustomer,
    setFilterCustomer,
    filterTemplate,
    setFilterTemplate,
    resetFilters,
    handleShare,
    handleViewService,
    openServicePDF,
    handleEdit,
    setDeleteAlert,
    templates,
  } = useServices();

  const [templateFilterOpen, setTemplateFilterOpen] = useState(false);

  const filterLabel = (f: RecordFilter) =>
    f === "all" ? t("svc.filterAll") : f === "gun" ? t("svc.filterDay") : f === "ay" ? t("svc.filterMonth") : t("svc.filterYear");

  const columns = [t("svc.colDate"), t("svc.colDocName"), t("svc.colCustomer"), t("svc.colService"), t("svc.colTemplate"), ""];
  const colClass = (col: string) =>
    col === t("svc.colDate")
      ? "w-24"
      : col === t("svc.colDocName")
        ? "flex-1"
        : col === t("svc.colCustomer")
          ? "flex-1"
          : col === t("svc.colService")
            ? "flex-1"
            : col === t("svc.colTemplate")
              ? "w-32"
              : "text-right";

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("svc.allRecords")}</Text>
        <Text className="text-xs" style={{ color: colors.textMuted }}>{filteredRecords.length} {t("svc.showing")}</Text>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4 items-center">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            className={`px-4 h-8 rounded-lg items-center justify-center ${filter === f ? "" : "border"}`}
            style={{
              backgroundColor: filter === f ? colors.primary : colors.bgCard,
              borderColor: colors.border,
            }}
            onPress={() => setFilter(filter === f ? "all" : f)}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: filter === f ? "white" : colors.textSecondary }}
            >
              {filterLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          className="h-8 rounded-lg px-3 flex-row items-center"
          style={{
            backgroundColor: filterTemplate ? colors.primary + "1A" : colors.bgCard,
            borderColor: filterTemplate ? colors.primary : colors.border,
            borderWidth: 1,
          }}
          onPress={() => setTemplateFilterOpen(true)}
        >
          <Text className="text-xs font-medium mr-1 max-w-[120px]" numberOfLines={1} style={{ color: filterTemplate ? colors.primary : colors.textSecondary }}>
            {filterTemplate || t("svc.allTemplates")}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs w-28"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterDate")}
          placeholderTextColor={colors.textMuted}
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterDocName")}
          placeholderTextColor={colors.textMuted}
          value={filterDocument}
          onChangeText={setFilterDocument}
        />
        <TextInput
          className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
          style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
          placeholder={t("svc.filterCustomer")}
          placeholderTextColor={colors.textMuted}
          value={filterCustomer}
          onChangeText={setFilterCustomer}
        />
        <TouchableOpacity onPress={resetFilters}>
          <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={templateFilterOpen} transparent animationType="fade" onRequestClose={() => setTemplateFilterOpen(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.colTemplate")}</Text>
              <TouchableOpacity onPress={() => setTemplateFilterOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView nestedScrollEnabled className="max-h-80" indicatorStyle={colors.indicatorBg as any}>
              <TouchableOpacity
                className="flex-row items-center px-3 py-3"
                onPress={() => {
                  setFilterTemplate("");
                  setTemplateFilterOpen(false);
                }}
              >
                <Ionicons name={!filterTemplate ? "radio-button-on" : "radio-button-off"} size={18} color={!filterTemplate ? colors.primary : colors.textMuted} />
                <Text className="text-sm ml-3" style={{ color: colors.text }}>{t("svc.allTemplates")}</Text>
              </TouchableOpacity>
              {templates.map((tpl, i) => {
                const active = filterTemplate === tpl.name;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    className="flex-row items-center px-3 py-3"
                    style={i < templates.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                    onPress={() => {
                      setFilterTemplate(tpl.name);
                      setTemplateFilterOpen(false);
                    }}
                  >
                    <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? colors.primary : colors.textMuted} />
                    <Text className="text-sm ml-3 flex-1" style={{ color: colors.text }} numberOfLines={1}>{tpl.name}</Text>
                    {tpl.isDefault && <Ionicons name="star" size={14} color={colors.warning} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
        <View className="flex-row px-3 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          {columns.map((col) => (
            <Text
              key={col}
              className={`text-xs font-semibold ${colClass(col)}`}
              style={{ color: colors.textSecondary }}
            >
              {col}
            </Text>
          ))}
        </View>

        <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle={colors.indicatorBg as any}>
          {filteredRecords.map((k) => (
            <View
              key={k.id}
              className="flex-row items-center px-3 py-3 border-b"
              style={{ borderColor: colors.borderAlt }}
            >
              <Text className="w-24 text-xs" style={{ color: colors.textSecondary }}>{k.tarih}</Text>
              <Text className="flex-1 text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>
                {k.customer} - {k.tarih}
              </Text>
              <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {k.customer}
              </Text>
              <Text className="flex-1 text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {k.service}
              </Text>
              <View className="w-32 pr-2">
                <View
                  className="self-start px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: k.templateName ? colors.purple + "1A" : colors.bgInput }}
                >
                  <Text className="text-[10px] font-medium" numberOfLines={1} style={{ color: k.templateName ? colors.purple : colors.textMuted }}>
                    {k.templateName || t("svc.noTemplate")}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-end gap-2.5">
                <TouchableOpacity onPress={() => handleShare(k)}>
                  <Ionicons name="share-social-outline" size={20} color={colors.purple} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setDeleteAlert({ visible: true, record: k })}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleViewService(k)}>
                  <Ionicons name="eye-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEdit(k)}>
                  <Ionicons name="create-outline" size={20} color={colors.teal} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openServicePDF(k)}>
                  <Ionicons name="download-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}
