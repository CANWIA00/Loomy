import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { usePayments } from "./PaymentsContext";
import { TIME_FILTERS, type TimeFilter } from "./types";
import StatusDropdownModal from "./modals/StatusDropdownModal";

export default function PaymentsListSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    statusDropdownOpen,
    setStatusDropdownOpen,
    searchQuery,
    setSearchQuery,
    statusOptions,
    filteredServices,
    listPage,
    setListPage,
    listTotalPages,
    pagedServices,
    fetchData,
    formatAmount,
    setToggleAlert,
  } = usePayments();

  const timeFilterLabel = (f: TimeFilter) =>
    f === "all" ? t("pay.all") : f === "gun" ? t("pay.today") : f === "hafta" ? t("pay.thisWeek") : t("pay.thisMonth");

  return (
    <View style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }} className="rounded-xl border p-3 flex-1 min-h-[500px]">
      <Text style={{ color: colors.text }} className="text-xs font-bold mb-3">{t("pay.list")}</Text>

      <View className="flex-row flex-wrap gap-2 mb-3 items-center">
        <View style={{ backgroundColor: colors.bgCard, borderColor: colors.border }} className="flex-row items-center h-8 rounded-lg px-2">
          <Ionicons name="search-outline" size={14} color={colors.textMuted} />
          <TextInput
            style={{ color: colors.text }}
            className="w-28 text-xs ml-1.5"
            placeholder={t("pay.search")}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {TIME_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            className={`px-3 h-8 rounded-lg items-center justify-center ${
              timeFilter === f ? "" : "border"
            }`}
            style={timeFilter === f ? { backgroundColor: colors.primary } : { backgroundColor: colors.bgCard, borderColor: colors.border }}
            onPress={() => setTimeFilter(f)}
          >
            <Text className="text-xs font-medium" style={{ color: timeFilter === f ? "white" : colors.textSecondary }}>
              {timeFilterLabel(f)}
            </Text>
          </TouchableOpacity>
        ))}

        <View className="relative">
          <TouchableOpacity
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            className="flex-row items-center h-8 px-3 rounded-lg"
            onPress={() => setStatusDropdownOpen(true)}
          >
            <Text style={{ color: colors.text }} className="text-xs mr-2">
              {statusOptions.find((s) => s.value === statusFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          className="h-8 w-8 rounded-lg items-center justify-center"
          onPress={() => {
            setTimeFilter("all");
            setStatusFilter("all");
            setSearchQuery("");
            fetchData();
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ maxHeight: 500 }} indicatorStyle={colors.indicatorBg as any}>
        {filteredServices.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-sm mt-3">{t("pay.noRecords")}</Text>
          </View>
        ) : (
          pagedServices.map((s) => (
            <View
              key={s.id}
              style={{ borderColor: colors.border }}
              className="flex-row items-center justify-between px-1 py-2.5 border-b"
            >
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-sm font-medium">{s.customer}</Text>
                <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">{s.serviceType || t("pay.serviceReport")} · {s.tarih}</Text>
              </View>

              <Text style={{ color: colors.text }} className="text-sm font-semibold mr-3">{formatAmount(s.amount)}</Text>

              <TouchableOpacity
                className="flex-row items-center rounded-lg px-2 py-1"
                style={{ backgroundColor: s.paid ? colors.success + '15' : colors.warning + '15' }}
                onPress={() => setToggleAlert({ visible: true, record: s })}
              >
                <Ionicons name={s.paid ? "checkmark-circle" : "time"} size={12} color={s.paid ? colors.success : colors.warning} />
                <Text className="text-xs font-medium ml-1" style={{ color: s.paid ? colors.success : colors.warning }}>
                  {s.paid ? t("pay.paid") : t("pay.pending")}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {listTotalPages > 1 && (
        <View className="flex-row items-center justify-center gap-3 mt-3 pt-3" style={{ borderColor: colors.border, borderTopWidth: 1 }}>
          <TouchableOpacity
            disabled={listPage === 0}
            onPress={() => setListPage(listPage - 1)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: listPage === 0 ? colors.bgInput : colors.primary, opacity: listPage === 0 ? 0.5 : 1 }}
          >
            <Text className="text-sm" style={{ color: "white" }}>{t("pay.previous")}</Text>
          </TouchableOpacity>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {listPage + 1} / {listTotalPages}
          </Text>
          <TouchableOpacity
            disabled={listPage >= listTotalPages - 1}
            onPress={() => setListPage(listPage + 1)}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: listPage >= listTotalPages - 1 ? colors.bgInput : colors.primary, opacity: listPage >= listTotalPages - 1 ? 0.5 : 1 }}
          >
            <Text className="text-sm" style={{ color: "white" }}>{t("pay.next")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusDropdownModal />
    </View>
  );
}
