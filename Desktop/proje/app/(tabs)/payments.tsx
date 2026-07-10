import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const recentServices = [
  { customer: "Ahmet Yılmaz", tarih: "08.07.2026", status: "Ödendi", amount: "₺850", renk: "#22C55E", ikon: "checkmark-circle" },
  { customer: "Ayşe Demir", tarih: "08.07.2026", status: "Ödendi", amount: "₺1.200", renk: "#22C55E", ikon: "checkmark-circle" },
  { customer: "Mehmet Öz", tarih: "07.07.2026", status: "Bekliyor", amount: "₺450", renk: "#F59E0B", ikon: "time" },
  { customer: "Zeynep Kaya", tarih: "05.07.2026", status: "Bekliyor", amount: "₺2.100", renk: "#F59E0B", ikon: "time" },
  { customer: "Ali Can", tarih: "03.07.2026", status: "Ödendi", amount: "₺750", renk: "#22C55E", ikon: "checkmark-circle" },
  { customer: "Fatma Yıldız", tarih: "30.06.2026", status: "Ödendi", amount: "₺1.600", renk: "#22C55E", ikon: "checkmark-circle" },
  { customer: "Mustafa Aydın", tarih: "28.06.2026", status: "Ödendi", amount: "₺950", renk: "#22C55E", ikon: "checkmark-circle" },
];

export default function PaymentsScreen() {
  const [timeFilter, setTimeFilter] = useState<"all" | "gun" | "hafta" | "ay">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "odendi" | "bekliyor">("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const statusOptions = [
    { label: "Tüm Durumlar", value: "all" },
    { label: "Ödendi", value: "odendi" },
    { label: "Bekliyor", value: "bekliyor" },
  ];

  const filteredServices = recentServices
    .filter((s) => {
      if (timeFilter !== "all") {
        const tarih = new Date(s.tarih.split(".").reverse().join("-"));
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
        const durum = s.status === "Ödendi" ? "odendi" : "bekliyor";
        if (durum !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.tarih.split(".").reverse().join("-"));
      const dateB = new Date(b.tarih.split(".").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });

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
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-400 text-xs font-medium">Alınan Ödeme</Text>
                <Text className="text-white text-xs font-bold">₺15.450</Text>
              </View>
              <View className="bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                <View className="bg-[#3B82F6] rounded-full h-full" style={{ width: "75%" }} />
              </View>
            </View>

            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-400 text-xs font-medium">Bekleyen Ödeme</Text>
                <Text className="text-[#F59E0B] text-xs font-bold">₺8.200</Text>
              </View>
              <View className="bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                <View className="bg-[#F59E0B] rounded-full h-full" style={{ width: "40%" }} />
              </View>
            </View>

            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-400 text-xs font-medium">Tahmini Toplam Ödeme</Text>
                <Text className="text-[#22C55E] text-xs font-bold">₺23.650</Text>
              </View>
              <View className="bg-[#2A2A2A] rounded-full h-2 overflow-hidden">
                <View className="bg-[#22C55E] rounded-full h-full" style={{ width: "100%" }} />
              </View>
            </View>

            <View className="mt-2 pt-2 border-t border-[#2A2A2A] gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 text-sm">Alınan Toplam</Text>
                <Text className="text-white text-base font-bold">₺15.450</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-300 text-sm">Bekleyen Toplam</Text>
                <Text className="text-[#F59E0B] text-base font-bold">₺8.200</Text>
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-gray-300 text-sm">Tahmini Kasa</Text>
                <Text className="text-[#22C55E] text-lg font-bold">₺23.650</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="bg-[#111] rounded-xl border border-[#2A2A2A] p-3 flex-1 min-h-[500px]">
          <Text className="text-white text-xs font-bold mb-3">SON SERVİSLER</Text>

          <View className="flex-row flex-wrap gap-2 mb-3 items-center">
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
            {filteredServices.map((s, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between px-1 py-2.5 border-b border-[#2A2A2A]/50"
              >
                <TouchableOpacity
                  className="flex-1"
                  onPress={() => {
                    Alert.alert("Müşteri Filtresi", `${s.customer} için servisler filtreleniyor...`);
                  }}
                >
                  <Text className="text-white text-sm font-medium">{s.customer}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">{s.tarih}</Text>
                </TouchableOpacity>

                <Text className="text-white text-sm font-semibold mr-3">{s.amount}</Text>

                <TouchableOpacity
                  className="flex-row items-center rounded-lg px-2 py-1"
                  style={{ backgroundColor: `${s.renk}15` }}
                  onPress={() => {
                    const durum = s.status === "Ödendi" ? "odendi" : "bekliyor";
                    setStatusFilter(durum as any);
                    setStatusDropdownOpen(false);
                  }}
                >
                  <Ionicons name={s.ikon as any} size={12} color={s.renk} />
                  <Text className="text-xs font-medium ml-1" style={{ color: s.renk }}>{s.status}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

      </View>
    </ScrollView>
  );
}
