import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCustomers } from "./CustomersContext";

export default function CustomerListSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    customers,
    loading,
    search,
    setSearch,
    page,
    totalElements,
    totalPages,
    fetchCustomers,
    handleEdit,
    handleDelete,
    setSelectedCustomer,
  } = useCustomers();

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("cst.allCustomers")}</Text>
        <Text className="text-sm" style={{ color: colors.textMuted }}>{totalElements} {t("cst.records")}</Text>
      </View>

      <TextInput
        className="rounded-lg px-4 py-3 text-sm mb-4"
        style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, color: colors.text }}
        placeholder={t("cst.search")}
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {loading && customers.length === 0 ? (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm mt-3" style={{ color: colors.textMuted }}>{t("cst.loading")}</Text>
        </View>
      ) : (
        <>
          {customers.map((c) => (
            <TouchableOpacity
              key={c.id}
              className="rounded-2xl p-4 mb-3"
              style={{ backgroundColor: colors.bgCard }}
              onPress={() => setSelectedCustomer(c)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                  <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                    {c.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>{c.companyName}</Text>
                  <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{c.contactPerson}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{c.phone}</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleEdit(c.id)}
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.primary + '15' }}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(c.id)}
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.danger + '15' }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {customers.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noCustomers")}</Text>
            </View>
          )}

          {totalPages > 1 && (
            <View className="flex-row items-center justify-center gap-3 mt-4">
              <TouchableOpacity
                disabled={page === 0}
                onPress={() => fetchCustomers(page - 1, search.trim() || undefined)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: page === 0 ? colors.bgCard : colors.primary, opacity: page === 0 ? 0.5 : 1 }}
              >
                <Text className="text-sm" style={{ color: "white" }}>{t("cst.previous")}</Text>
              </TouchableOpacity>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {page + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                disabled={page >= totalPages - 1}
                onPress={() => fetchCustomers(page + 1, search.trim() || undefined)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: page >= totalPages - 1 ? colors.bgCard : colors.primary, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
              >
                <Text className="text-sm" style={{ color: "white" }}>{t("cst.next")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </>
  );
}
