import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCustomers } from "./CustomersContext";

const AVATAR_COLORS = ["#7A6CFD", "#6080FF", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#8B5CF6", "#EF4444"];

function avatarColorOf(name: string, fallback: string) {
  if (!name) return fallback;
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function CustomerListSection() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const twoCols = width >= 900;
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
  } = useCustomers();

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("cst.allCustomers")}</Text>
        <Text className="text-sm" style={{ color: colors.textMuted }}>{totalElements} {t("cst.records")}</Text>
      </View>

      <View className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row items-center">
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            className="flex-1 ml-3 text-sm"
            style={{ color: colors.text }}
            placeholder={t("cst.search")}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading && customers.length === 0 ? (
        <View className="items-center py-14">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm mt-3" style={{ color: colors.textMuted }}>{t("cst.loading")}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {customers.map((c) => {
              const color = avatarColorOf(c.companyName, colors.primary);
              return (
                <TouchableOpacity
                  key={c.id}
                  className="rounded-2xl p-4"
                  style={{
                    width: twoCols ? "48.5%" : "100%",
                    backgroundColor: colors.bgCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                    ...(width > 600 ? { boxShadow: "0 2px 10px rgba(0,0,0,0.08)" } : {}),
                  }}
                  onPress={() => router.push(`/customer-detail?id=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.companyName)}` as any)}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: color + "22" }}
                    >
                      <Text className="text-2xl font-bold" style={{ color }}>
                        {c.companyName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold" style={{ color: colors.text }} numberOfLines={1}>
                        {c.companyName}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                        <Text className="text-sm ml-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
                          {c.contactPerson || "-"}
                        </Text>
                      </View>
                      <View className="flex-row items-center mt-0.5">
                        <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                        <Text className="text-xs ml-1" style={{ color: colors.textMuted }} numberOfLines={1}>
                          {c.phone || "-"}
                        </Text>
                      </View>
                    </View>
                    <View className="items-center gap-2">
                      <TouchableOpacity
                        onPress={() => handleEdit(c.id)}
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{ backgroundColor: colors.primary + "18" }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="create-outline" size={17} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(c.id)}
                        className="w-9 h-9 rounded-xl items-center justify-center"
                        style={{ backgroundColor: colors.danger + "18" }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="trash-outline" size={17} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8, alignSelf: "center" }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {customers.length === 0 && (
            <View className="items-center py-14">
              <Ionicons name="people-outline" size={44} color={colors.textMuted} />
              <Text className="text-sm mt-3" style={{ color: colors.textMuted }}>{t("cst.noCustomers")}</Text>
            </View>
          )}

          {totalPages > 1 && (
            <View className="flex-row items-center justify-center gap-3 mt-5">
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
