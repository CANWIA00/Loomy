import { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { paymentApi, PaymentRecord, PaymentSummary } from "../../api/payments";
import CustomAlert from "../../components/CustomAlert";

function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <View className="bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          backgroundColor: color,
          width: `${Math.min(Math.max(percentage, 0), 100)}%`,
        }}
      />
    </View>
  );
}

export default function PaymentsScreen() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<"all" | "gun" | "hafta" | "ay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "odendi" | "bekliyor">("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toggleAlert, setToggleAlert] = useState<{ visible: boolean; record: PaymentRecord | null }>({ visible: false, record: null });

  const statusOptions = [
    { label: "Tüm Durumlar", value: "all" },
    { label: "Ödendi", value: "odendi" },
    { label: "Bekliyor", value: "bekliyor" },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.all([
        paymentApi.getAll(0, 200),
        paymentApi.getSummary(),
      ]);
      setRecords(paymentsRes.data.content);
      setSummary(summaryRes.data);
    } catch {
      Alert.alert("Hata", "Ödeme verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseDate = (tarih: string): Date => {
    const sep = tarih.includes(".") ? "." : "/";
    const parts = tarih.split(sep);
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(0);
  };

  const filteredServices = records
    .filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = s.customer.toLowerCase().includes(q);
        const matchService = s.serviceType.toLowerCase().includes(q);
        if (!matchCustomer && !matchService) return false;
      }
      if (timeFilter !== "all") {
        const tarih = parseDate(s.tarih);
        const bugun = new Date();
        if (timeFilter === "gun" && tarih.toDateString() !== bugun.toDateString()) return false;
        if (timeFilter === "hafta") {
          const haftaBaslangic = new Date(bugun);
          haftaBaslangic.setDate(bugun.getDate() - bugun.getDay());
          const haftaBitis = new Date(bugun);
          haftaBitis.setDate(bugun.getDate() + (6 - bugun.getDay()));
          if (tarih < haftaBaslangic || tarih > haftaBitis) return false;
        }
        if (timeFilter === "ay" && (tarih.getMonth() !== bugun.getMonth() || tarih.getFullYear() !== bugun.getFullYear())) return false;
      }
      if (statusFilter !== "all") {
        const durum = s.paid ? "odendi" : "bekliyor";
        if (durum !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => parseDate(b.tarih).getTime() - parseDate(a.tarih).getTime());

  const handleTogglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      const summaryRes = await paymentApi.getSummary();
      setSummary(summaryRes.data);
    } catch {
      Alert.alert("Hata", "Ödeme durumu güncellenemedi.");
    }
  };

  const formatAmount = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 text-sm mt-3">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white tracking-tight">
              Ödeme Yönetimi
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mb-5">
          Ödemelerinizi görüntüleyin ve yönetin
        </Text>

        <View className="bg-[#1A1A1A] rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl items-center justify-center">
              <Ionicons name="card" size={20} color="#F59E0B" />
            </View>
            <Text className="text-white text-lg font-bold ml-3">ÖDEME DURUMU</Text>
          </View>

          <View className="flex-col gap-3">
            {(() => {
              const total = summary?.total || 0;
              const paid = summary?.paidTotal || 0;
              const pending = summary?.pendingTotal || 0;
              const paidPct = total > 0 ? (paid / total) * 100 : 0;
              const pendingPct = total > 0 ? (pending / total) * 100 : 0;

              return (
                <>
                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-400 text-xs font-medium">Alınan Ödeme</Text>
                      <Text className="text-white text-xs font-bold">{formatAmount(paid)}</Text>
                    </View>
                    <AnimatedBar percentage={paidPct} color="#3B82F6" />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-400 text-xs font-medium">Bekleyen Ödeme</Text>
                      <Text className="text-[#F59E0B] text-xs font-bold">{formatAmount(pending)}</Text>
                    </View>
                    <AnimatedBar percentage={pendingPct} color="#F59E0B" />
                  </View>

                  <View className="mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-400 text-xs font-medium">Tahmini Toplam Ödeme</Text>
                      <Text className="text-[#22C55E] text-xs font-bold">{formatAmount(total)}</Text>
                    </View>
                    <AnimatedBar percentage={100} color="#22C55E" />
                  </View>
                </>
              );
            })()}

            <View className="mt-2 pt-2 border-t border-[#2A2A2A] gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 text-sm">Alınan Toplam ({summary?.paidCount || 0})</Text>
                <Text className="text-white text-base font-bold">{formatAmount(summary?.paidTotal || 0)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 text-sm">Bekleyen Toplam ({summary?.pendingCount || 0})</Text>
                <Text className="text-[#F59E0B] text-base font-bold">{formatAmount(summary?.pendingTotal || 0)}</Text>
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-gray-300 text-sm">Tahmini Kasa</Text>
                <Text className="text-[#22C55E] text-lg font-bold">{formatAmount(summary?.total || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-[#111] rounded-xl border border-[#2A2A2A] p-3 flex-1 min-h-[500px]">
          <Text className="text-white text-xs font-bold mb-3">SON SERVİSLER</Text>

          <View className="flex-row flex-wrap gap-2 mb-3 items-center">
            <View className="flex-row items-center h-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2">
              <Ionicons name="search-outline" size={14} color="#6B7280" />
              <TextInput
                className="w-28 text-white text-xs ml-1.5"
                placeholder="Ara..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={14} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {(["all", "gun", "hafta", "ay"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                className={`px-3 h-8 rounded-lg items-center justify-center ${
                  timeFilter === f ? "bg-[#3B82F6]" : "bg-[#1A1A1A] border border-[#2A2A2A]"
                }`}
                onPress={() => setTimeFilter(f)}
              >
                <Text className={`text-xs font-medium ${timeFilter === f ? "text-white" : "text-gray-400"}`}>
                  {f === "all" ? "Tümü" : f === "gun" ? "Bu Gün" : f === "hafta" ? "Bu Hafta" : "Bu Ay"}
                </Text>
              </TouchableOpacity>
            ))}

            <View className="relative">
              <TouchableOpacity
                className="flex-row items-center h-8 px-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg"
                onPress={() => setStatusDropdownOpen(true)}
              >
                <Text className="text-xs text-white mr-2">
                  {statusOptions.find((s) => s.value === statusFilter)?.label}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="h-8 w-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg items-center justify-center"
              onPress={() => {
                setTimeFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
                fetchData();
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Modal visible={statusDropdownOpen} transparent animationType="fade">
            <TouchableOpacity
              className="flex-1 justify-center items-center bg-black/40"
              activeOpacity={1}
              onPress={() => setStatusDropdownOpen(false)}
            >
              <View className="bg-[#1A1A1A] rounded-2xl w-64 p-4">
                <Text className="text-white text-lg font-bold mb-3">Durum Seç</Text>
                {statusOptions.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    className={`px-3 py-3 border-b border-[#2A2A2A] ${statusFilter === s.value ? "bg-[#3B82F6]/10" : ""}`}
                    onPress={() => {
                      setStatusFilter(s.value as any);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Text className={`text-sm ${statusFilter === s.value ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  className="mt-3 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setStatusDropdownOpen(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <ScrollView className="flex-1" indicatorStyle="white">
            {filteredServices.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons name="wallet-outline" size={40} color="#3B3B3B" />
                <Text className="text-gray-500 text-sm mt-3">Henüz servis kaydı bulunmuyor.</Text>
              </View>
            ) : (
              filteredServices.map((s) => (
                <View
                  key={s.id}
                  className="flex-row items-center justify-between px-1 py-2.5 border-b border-[#2A2A2A]/50"
                >
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">{s.customer}</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">{s.serviceType || "Servis Raporu"} · {s.tarih}</Text>
                  </View>

                  <Text className="text-white text-sm font-semibold mr-3">{formatAmount(s.amount)}</Text>

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
          </ScrollView>
        </View>

      </View>

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
          if (toggleAlert.record) handleTogglePaid(toggleAlert.record);
        }}
        confirmText="Onayla"
      />
    </ScrollView>
  );
}
