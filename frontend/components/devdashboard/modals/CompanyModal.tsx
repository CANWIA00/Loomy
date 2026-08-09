import { View, Text, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useDevDashboard } from "../DevDashboardContext";
import { formatDate, paymentInfo } from "../types";
import type { CompanySummary } from "../../../api/dev";

export default function CompanyModal() {
  const { colors } = useTheme();
  const {
    companyModal,
    setCompanyModal,
    companyLoading,
    companyDetail,
    handleMarkPaid,
    handleToggleCompanyFrozen,
  } = useDevDashboard();

  return (
    <Modal visible={companyModal} animationType="slide" onRequestClose={() => setCompanyModal(false)}>
      <View style={{ backgroundColor: colors.bg }} className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setCompanyModal(false)}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Müşteri Detayı
            </Text>
          </View>
        </View>
        {companyLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : companyDetail ? (
          <ScrollView className="flex-1" indicatorStyle={colors.indicatorBg as any}>
            <View className="px-4 pt-5 pb-8 w-full max-w-6xl mx-auto">
              <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.primary + "20" }}>
                    <Ionicons name="business" size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>{companyDetail.name}</Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>Davet: {companyDetail.invitationCode}</Text>
                  </View>
                  <View className="flex-row gap-1.5 flex-wrap justify-end">
                    {companyDetail.isFrozen && (
                      <View className="rounded-md px-2 py-1" style={{ backgroundColor: colors.danger + "18" }}>
                        <Text style={{ color: colors.danger, fontSize: 11, fontWeight: "700" }}>DONDURULMUŞ</Text>
                      </View>
                    )}
                    {!companyDetail.profileCompleted && (
                      <View className="rounded-md px-2 py-1" style={{ backgroundColor: colors.warning + "18" }}>
                        <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>PROFİL EKSİK</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                  {companyDetail.address || "Adres yok"}
                </Text>
                <Text className="text-xs leading-5 mt-1" style={{ color: colors.textSecondary }}>
                  {companyDetail.phone || "Telefon yok"} · {companyDetail.email || "E-posta yok"} · VKN: {companyDetail.taxNumber || "-"}
                </Text>
                <Text className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Kayıt: {formatDate(companyDetail.createdAt)}
                </Text>
                {(() => {
                  const payInfo = paymentInfo(companyDetail.paidUntil);
                  return (
                    <View
                      className="rounded-lg px-2.5 py-1.5 mt-3 flex-row items-center gap-1.5 self-start"
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
                      {companyDetail.paidUntil ? (
                        <Text style={{ color: payInfo.paid ? colors.success : colors.danger, fontSize: 11, opacity: 0.8 }}>
                          · {formatDate(companyDetail.paidUntil)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })()}
                <TouchableOpacity
                  className="h-10 rounded-lg items-center justify-center flex-row gap-2 mt-3"
                  style={{ backgroundColor: colors.success + "18" }}
                  onPress={() => handleMarkPaid(companyDetail)}
                >
                  <Ionicons name="cash-outline" size={16} color={colors.success} />
                  <Text style={{ color: colors.success }} className="font-semibold">
                    Ödeme Alındı
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-10 rounded-lg items-center justify-center flex-row gap-2 mt-3"
                  style={{ backgroundColor: companyDetail.isFrozen ? colors.success : colors.danger }}
                  onPress={() => {
                    setCompanyModal(false);
                    const summary: CompanySummary = {
                      id: companyDetail.id,
                      name: companyDetail.name,
                      email: companyDetail.email,
                      phone: companyDetail.phone,
                      invitationCode: companyDetail.invitationCode,
                      profileCompleted: companyDetail.profileCompleted,
                      isFrozen: companyDetail.isFrozen,
                      paidUntil: companyDetail.paidUntil,
                      createdAt: companyDetail.createdAt,
                    };
                    handleToggleCompanyFrozen(summary);
                  }}
                >
                  <Ionicons
                    name={companyDetail.isFrozen ? "play" : "snow"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={{ color: "white" }} className="font-semibold">
                    {companyDetail.isFrozen ? "Kullanımı Aç" : "Kullanımı Dondur"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>
                Kayıtlı Kullanıcılar ({companyDetail.users.length})
              </Text>
              <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                {companyDetail.users.length === 0 ? (
                  <View className="items-center py-6">
                    <Text style={{ color: colors.textMuted }} className="text-sm">Kullanıcı yok</Text>
                  </View>
                ) : (
                  companyDetail.users.map((u, idx) => (
                    <View
                      key={u.id}
                      className="px-4 py-3"
                      style={idx < companyDetail.users.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center gap-2">
                            <Text style={{ color: colors.text }} className="font-semibold">{u.name}</Text>
                            <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: (u.role === "ADMIN" ? colors.primary : colors.teal) + "18" }}>
                              <Text style={{ color: u.role === "ADMIN" ? colors.primary : colors.teal, fontSize: 10, fontWeight: "700" }}>
                                {u.role === "ADMIN" ? "ADMIN" : "KULLANICI"}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">{u.email}</Text>
                          {u.phone ? <Text style={{ color: colors.textMuted }} className="text-xs">{u.phone}</Text> : null}
                          <Text style={{ color: colors.textMuted }} className="text-xs">Katılım: {formatDate(u.createdAt)}</Text>
                        </View>
                        <View className="flex-col items-end gap-1">
                          <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: (u.isActive ? colors.success : colors.danger) + "18" }}>
                            <Text style={{ color: u.isActive ? colors.success : colors.danger, fontSize: 10, fontWeight: "700" }}>
                              {u.isActive ? "AKTİF" : "PASİF"}
                            </Text>
                          </View>
                          <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: (u.emailVerified ? colors.success : colors.warning) + "18" }}>
                            <Text style={{ color: u.emailVerified ? colors.success : colors.warning, fontSize: 10, fontWeight: "700" }}>
                              {u.emailVerified ? "E-POSTA ONAYLI" : "ONAYLANMADI"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <Text className="text-sm font-bold mb-2" style={{ color: colors.text }}>
                Kullanılan Admin Anahtarları ({companyDetail.adminKeys.length})
              </Text>
              <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                {companyDetail.adminKeys.length === 0 ? (
                  <View className="items-center py-6">
                    <Text style={{ color: colors.textMuted }} className="text-sm">Anahtar yok</Text>
                  </View>
                ) : (
                  companyDetail.adminKeys.map((k, idx) => (
                    <View
                      key={k.id}
                      className="flex-row items-center px-4 py-3"
                      style={idx < companyDetail.adminKeys.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
                    >
                      <Text style={{ color: colors.text }} className="font-mono font-semibold flex-1">{k.keyValue}</Text>
                      <View className="flex-row items-center gap-2">
                        {!k.isActive && (
                          <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.danger + "18" }}>
                            <Text style={{ color: colors.danger, fontSize: 10, fontWeight: "700" }}>PASİF</Text>
                          </View>
                        )}
                        <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: (k.isUsed ? colors.success : colors.textMuted) + "18" }}>
                          <Text style={{ color: k.isUsed ? colors.success : colors.textMuted, fontSize: 10, fontWeight: "700" }}>
                            {k.isUsed ? `KULLANILDI ${formatDate(k.usedAt)}` : "KULLANILMADI"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}
