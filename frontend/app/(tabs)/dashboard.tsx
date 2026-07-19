import { View, Text, TouchableOpacity, ScrollView, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { customerApi, Customer } from "../../api/customers";
import { paymentApi, PaymentSummary, PaymentRecord } from "../../api/payments";
import { appointmentApi, Appointment } from "../../api/appointments";
import { teamApi, Team } from "../../api/teams";
import CustomAlert from "../../components/CustomAlert";

export default function DashboardScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [toggleAlert, setToggleAlert] = useState<{ visible: boolean; record: PaymentRecord | null }>({ visible: false, record: null });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [planFilter, setPlanFilter] = useState<"today" | "tomorrow" | "week">("today");

  const dateToStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getWeekDates = (): string[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(dateToStr(d));
    }
    return dates;
  };

  const filteredAppointments = todayAppointments.filter((a) => {
    const today = dateToStr(new Date());
    const tomorrow = dateToStr(new Date(Date.now() + 86400000));
    if (planFilter === "today") return a.tarih === today;
    if (planFilter === "tomorrow") return a.tarih === tomorrow;
    if (planFilter === "week") return getWeekDates().includes(a.tarih);
    return true;
  });

  const fetchPayments = useCallback(async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        paymentApi.getSummary(),
        paymentApi.getAll(0, 5),
      ]);
      setPaymentSummary(summaryRes.data);
      setRecentPayments(recentRes.data.content);
    } catch {}
  }, []);

  const togglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecentPayments((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      setPaymentSummary((prev) => {
        if (!prev) return prev;
        const fee = record.amount;
        if (record.paid) {
          return { ...prev, paidTotal: prev.paidTotal - fee, pendingTotal: prev.pendingTotal + fee, paidCount: prev.paidCount - 1, pendingCount: prev.pendingCount + 1 };
        } else {
          return { ...prev, paidTotal: prev.paidTotal + fee, pendingTotal: prev.pendingTotal - fee, paidCount: prev.paidCount + 1, pendingCount: prev.pendingCount - 1 };
        }
      });
    } catch {}
  };

  useEffect(() => {
    customerApi.getAllSimple().then((res) => setCustomers(res.data)).catch(() => {});
    fetchPayments();
    Promise.all([
      appointmentApi.getAll().catch(() => ({ data: [] })),
      teamApi.getAll().catch(() => ({ data: [] })),
    ]).then(([aptRes, teamRes]) => {
      setTodayAppointments(aptRes.data);
      setTeams(teamRes.data);
    });
  }, [fetchPayments]);

  return (
    <>
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-2xl font-bold text-white tracking-tight">
            Hoş Geldiniz
          </Text>
          <TouchableOpacity onPress={() => router.push("/profil" as any)}>
            <Ionicons name="person-circle-outline" size={40} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mb-6">
          Size nasıl yardımcı olabiliriz?
        </Text>

        <View className="flex-col gap-4">
          {/* SATIR 1: SERVISLER */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/services" as any)}
          >
            <View className="bg-[#1A1A1A] rounded-2xl p-4">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-[#3B82F6]/10 rounded-xl items-center justify-center">
                  <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white text-lg font-bold">Servisler</Text>
                  <Text className="text-gray-400 text-sm">
                    Aktif servislerinizi görüntüleyin ve yönetin
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="h-8 px-3 bg-[#3B82F6] rounded-lg items-center justify-center flex-row"
                    onPress={() => router.push("/services" as any)}
                  >
                    <Ionicons name="person-add-outline" size={14} color="white" />
                    <Text className="text-white text-xs font-medium ml-1">Yeni Servis</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-8 px-3 bg-[#3B82F6] rounded-lg items-center justify-center"
                    onPress={() => router.push("/services" as any)}
                  >
                    <Text className="text-white text-xs font-medium">Yönet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* SATIR 2: MUSTERILER + PLAN */}
          <View className="flex-col md:flex-row gap-4">
            <View className="flex-1">
              <Pressable onPress={() => router.push("/customers" as any)}>
                <View className="bg-[#1A1A1A] rounded-2xl p-4 h-80">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 bg-[#10B981]/10 rounded-xl items-center justify-center">
                      <Ionicons name="people" size={20} color="#10B981" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white text-lg font-bold">Müşteriler</Text>
                      <Text className="text-gray-400 text-sm">
                        Tüm müşterilerinizi görüntüleyin ve yönetin
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="w-9 h-9 bg-[#3B82F6] rounded-full items-center justify-center"
                      onPress={() => router.push("/customers" as any)}
                    >
                      <Ionicons name="person-add-outline" size={18} color="white" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="flex-1" nestedScrollEnabled indicatorStyle="white">
                    {customers.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        className="flex-row items-center py-3 border-b border-[#2A2A2A]/50"
                        onPress={() => router.push(`/customers` as any)}
                      >
                        <Image
                          source={{
                            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.companyName)}&background=1A1A1A&color=888&size=40`,
                          }}
                          className="w-10 h-10 rounded-full bg-[#2A2A2A]"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-white text-sm font-medium">{m.companyName}</Text>
                          <Text className="text-gray-500 text-xs">{m.contactPerson} · {m.phone}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </View>

            <View className="flex-1">
              <View className="bg-[#1A1A1A] rounded-2xl p-4 h-80">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-[#8B5CF6]/10 rounded-xl items-center justify-center">
                      <Ionicons name="calendar" size={20} color="#8B5CF6" />
                    </View>
                    <Text className="text-white text-lg font-bold ml-3">Plan Yap</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push("/schedule" as any)}>
                    <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2 mb-3">
                  {([
                    { key: "today" as const, label: "Bugün" },
                    { key: "tomorrow" as const, label: "Yarın" },
                    { key: "week" as const, label: "Bu Hafta" },
                  ]).map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      className={`h-7 px-3 rounded-lg items-center justify-center ${planFilter === f.key ? "bg-[#8B5CF6]" : "bg-[#2A2A2A]"}`}
                      onPress={() => setPlanFilter(f.key)}
                    >
                      <Text className={`text-xs font-medium ${planFilter === f.key ? "text-white" : "text-gray-400"}`}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ScrollView className="flex-1" indicatorStyle="white">
                  {filteredAppointments.length === 0 ? (
                    <View className="items-center py-8">
                      <Ionicons name="calendar-outline" size={32} color="#3B3B3B" />
                      <Text className="text-gray-500 text-xs mt-2">Bu dönem için plan yok</Text>
                    </View>
                  ) : (
                    filteredAppointments.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((r) => {
                      const team = teams.find((t) => t.id === r.ekipId);
                      const renk = team?.color || "#8B5CF6";
                      return (
                        <TouchableOpacity
                          key={r.id}
                          className="rounded-xl border p-3 mb-2"
                          style={{ backgroundColor: `${renk}10`, borderColor: `${renk}30` }}
                          activeOpacity={0.7}
                          onPress={() => router.push("/schedule" as any)}
                        >
                          <View className="flex-row items-center mb-1">
                            <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: `${renk}30` }}>
                              <Text className="text-xs font-semibold" style={{ color: renk }}>{r.startTime}</Text>
                            </View>
                            <Text className="text-white text-sm font-medium ml-2" numberOfLines={1}>{r.customerName}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <View style={{ backgroundColor: renk, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text className="text-white font-bold" style={{ fontSize: 8 }}>{r.ekip}</Text>
                            </View>
                            <Text className="text-gray-500 text-xs">{r.tur}</Text>
                          </View>
                        </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
            </View>
          </View>

          {/* SATIR 3: ÖDEME DURUMU */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/payments" as any)}
          >
            <View className="bg-[#1A1A1A] rounded-2xl p-4">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl items-center justify-center">
                  <Ionicons name="card" size={20} color="#F59E0B" />
                </View>
                <Text className="text-white text-lg font-bold ml-3">ÖDEME DURUMU</Text>
              </View>

              <View className="flex-col md:flex-row gap-6">
                <View className="flex-1">
                  {(() => {
                    const total = paymentSummary?.total || 0;
                    const paid = paymentSummary?.paidTotal || 0;
                    const pending = paymentSummary?.pendingTotal || 0;
                    const paidPct = total > 0 ? (paid / total) * 100 : 0;
                    const pendingPct = total > 0 ? (pending / total) * 100 : 0;
                    const formatAmount = (v: number) => `₺${v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

                    return (
                      <>
                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-gray-400 text-xs font-medium">Alınan Ödeme</Text>
                            <Text className="text-white text-xs font-bold">{formatAmount(paid)}</Text>
                          </View>
                          <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                            <View className="bg-[#3B82F6] rounded-full h-full" style={{ width: `${paidPct}%` }} />
                          </View>
                        </View>

                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-gray-400 text-xs font-medium">Bekleyen Ödeme</Text>
                            <Text className="text-[#F59E0B] text-xs font-bold">{formatAmount(pending)}</Text>
                          </View>
                          <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                            <View className="bg-[#F59E0B] rounded-full h-full" style={{ width: `${pendingPct}%` }} />
                          </View>
                        </View>

                        <View className="mb-3">
                          <View className="flex-row items-center justify-between mb-1.5">
                            <Text className="text-gray-400 text-xs font-medium">Tahmini Toplam Ödeme</Text>
                            <Text className="text-[#22C55E] text-xs font-bold">{formatAmount(total)}</Text>
                          </View>
                          <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                            <View className="bg-[#22C55E] rounded-full h-full" style={{ width: "100%" }} />
                          </View>
                        </View>

                        <View className="mt-3 gap-2">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-300 text-sm">Alınan Toplam ({paymentSummary?.paidCount || 0})</Text>
                            <Text className="text-white text-lg font-bold">{formatAmount(paid)}</Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Text className="text-gray-300 text-sm">Bekleyen Toplam ({paymentSummary?.pendingCount || 0})</Text>
                            <Text className="text-[#F59E0B] text-lg font-bold">{formatAmount(pending)}</Text>
                          </View>
                          <View className="flex-row items-center justify-between pt-1 border-t border-[#2A2A2A]">
                            <Text className="text-gray-300 text-sm">Tahmini Kasa</Text>
                            <Text className="text-[#22C55E] text-xl font-bold">{formatAmount(total)}</Text>
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>

                <View className="flex-1">
                  <Text className="text-white text-xs font-bold mb-3">SON SERVİSLER</Text>
                  <ScrollView className="max-h-64" nestedScrollEnabled indicatorStyle="white">
                    <View className="bg-[#111] rounded-xl border border-[#2A2A2A]">
                      {recentPayments.length === 0 ? (
                        <View className="items-center py-6">
                          <Ionicons name="wallet-outline" size={32} color="#3B3B3B" />
                          <Text className="text-gray-500 text-xs mt-2">Henüz servis kaydı yok</Text>
                        </View>
                      ) : (
                        recentPayments.map((s) => (
                          <View
                            key={s.id}
                            className="flex-row items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]"
                          >
                            <TouchableOpacity className="flex-1" onPress={() => router.push("/payments" as any)}>
                              <Text className="text-white text-sm font-medium">{s.customer}</Text>
                              <Text className="text-gray-500 text-xs mt-0.5">{s.serviceType || "Servis"} · {s.tarih}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="flex-row items-center rounded-lg px-2 py-1"
                              style={{ backgroundColor: s.paid ? "#22C55E15" : "#F59E0B15" }}
                              onPress={() => setToggleAlert({ visible: true, record: s })}
                            >
                              <Ionicons name={s.paid ? "checkmark-circle" : "time"} size={12} color={s.paid ? "#22C55E" : "#F59E0B"} />
                              <Text className="text-xs font-medium ml-1" style={{ color: s.paid ? "#22C55E" : "#F59E0B" }}>
                                {s.paid ? "Ödendi" : "Bekliyor"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* SATIR 4: AYARLAR */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/settings" as any)}
          >
            <View className="bg-[#1A1A1A] rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#EF4444]/10 rounded-xl items-center justify-center">
                  <Ionicons name="settings" size={20} color="#EF4444" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white text-lg font-bold">Ayarlar</Text>
                  <Text className="text-gray-400 text-sm">
                    Profil ve uygulama ayarlarınızı yapılandırın
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="h-8 px-3 bg-[#3B82F6] rounded-lg items-center justify-center"
                    onPress={() => router.push("/settings" as any)}
                  >
                    <Text className="text-white text-xs font-medium">Profili Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-8 px-3 bg-[#3B82F6] rounded-lg items-center justify-center"
                    onPress={() => router.push("/settings" as any)}
                  >
                    <Text className="text-white text-xs font-medium">Ayarlar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>

    <CustomAlert
      visible={toggleAlert.visible}
      type="confirm"
      title={toggleAlert.record?.paid ? "Ödemeyi Geri Al" : "Ödendi Olarak İşaretle"}
      message={toggleAlert.record?.paid
        ? `"${toggleAlert.record?.customer}" ödemesini bekliyor olarak işaretlemek istediğinize emin misiniz?`
        : `"${toggleAlert.record?.customer}" servisini ödendi olarak işaretlemek istediğinize emin misiniz?`
      }
      onClose={() => setToggleAlert({ visible: false, record: null })}
      onConfirm={() => {
        if (toggleAlert.record) togglePaid(toggleAlert.record);
      }}
      confirmText="Onayla"
    />
    </>
  );
}
