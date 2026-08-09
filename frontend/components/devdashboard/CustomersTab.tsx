import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";
import { formatDate, paymentInfo } from "./types";

export default function CustomersTab() {
  const { colors } = useTheme();
  const {
    filteredCompanies,
    companySearch,
    setCompanySearch,
    openCompany,
    handleMarkPaid,
    handleToggleCompanyFrozen,
  } = useDevDashboard();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.textMuted }} className="text-sm">
          {filteredCompanies.length} müşteri
        </Text>
      </View>

      <View className="mb-4">
        <TextInput
          className="h-11 rounded-lg px-4 text-base"
          style={{
            backgroundColor: colors.bgCard,
            color: colors.text,
            borderColor: colors.border,
            borderWidth: 1,
          }}
          placeholder="Müşteri adı veya e-posta ara..."
          placeholderTextColor={colors.textMuted}
          value={companySearch}
          onChangeText={setCompanySearch}
        />
      </View>

      <View className="flex-row flex-wrap gap-3">
        {filteredCompanies.length === 0 ? (
          <View className="w-full items-center py-10">
            <Ionicons name="business-outline" size={36} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-sm mt-3">
              Müşteri bulunamadı
            </Text>
          </View>
        ) : (
          filteredCompanies.map((c) => {
            const payInfo = paymentInfo(c.paidUntil);
            return (
            <TouchableOpacity
              key={c.id}
              className="rounded-2xl p-4 flex-1 min-w-[260px]"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => openCompany(c.id)}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
                  <Ionicons name="business" size={20} color={colors.primary} />
                </View>
                <View className="flex-row gap-1.5 flex-wrap justify-end">
                  {c.isFrozen && (
                    <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.danger + "18" }}>
                      <Text style={{ color: colors.danger, fontSize: 10, fontWeight: "700" }}>DONDURULMUŞ</Text>
                    </View>
                  )}
                  {!c.profileCompleted && (
                    <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.warning + "18" }}>
                      <Text style={{ color: colors.warning, fontSize: 10, fontWeight: "700" }}>PROFİL EKSİK</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={{ color: colors.text }} className="font-bold">
                {c.name}
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                {c.email || "E-posta yok"} · {c.phone || "Telefon yok"}
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
                Davet: {c.invitationCode} · {formatDate(c.createdAt)}
              </Text>
              <View
                className="rounded-lg px-2 py-1.5 mt-3 flex-row items-center gap-1.5 self-start"
                style={{ backgroundColor: (payInfo.paid ? colors.success : colors.danger) + "15", borderColor: (payInfo.paid ? colors.success : colors.danger) + "40", borderWidth: 1 }}
              >
                <Ionicons
                  name={payInfo.paid ? "checkmark-circle" : "alert-circle"}
                  size={14}
                  color={payInfo.paid ? colors.success : colors.danger}
                />
                <Text style={{ color: payInfo.paid ? colors.success : colors.danger, fontSize: 11, fontWeight: "700" }}>
                  {payInfo.label}
                </Text>
                {c.paidUntil ? (
                  <Text style={{ color: payInfo.paid ? colors.success : colors.danger, fontSize: 11, opacity: 0.8 }}>
                    · {formatDate(c.paidUntil)}
                  </Text>
                ) : null}
              </View>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  className="h-9 px-3 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.success + "18" }}
                  onPress={() => handleMarkPaid(c)}
                >
                  <Ionicons name="cash-outline" size={16} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-9 rounded-lg items-center justify-center flex-row gap-1.5"
                  style={{ backgroundColor: c.isFrozen ? colors.success + "18" : colors.danger + "15" }}
                  onPress={() => handleToggleCompanyFrozen(c)}
                >
                  <Ionicons
                    name={c.isFrozen ? "play" : "snow"}
                    size={15}
                    color={c.isFrozen ? colors.success : colors.danger}
                  />
                  <Text
                    className="font-semibold text-xs"
                    style={{ color: c.isFrozen ? colors.success : colors.danger }}
                  >
                    {c.isFrozen ? "Kullanımı Aç" : "Kullanımı Dondur"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-9 px-3 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgCard2 }}
                  onPress={() => openCompany(c.id)}
                >
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}
