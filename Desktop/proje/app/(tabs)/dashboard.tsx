import { View, Text, TouchableOpacity, ScrollView, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const appointments = [
  { time: "08:00", customer: "Ahmet Yılmaz", phone: "555-111-2233", address: "İstanbul, Sarıyer" },
  { time: "10:00", customer: "Mehmet Öz", phone: "555-456-7890", address: "İstanbul, Şişli" },
  { time: "14:00", customer: "Zeynep Kaya", phone: "555-321-7654", address: "Ankara, Çankaya" },
];

const customerList = [
  { id: "1", sirketAdi: "ABC Teknoloji", telefon: "555-123-4567", sorumluIsmi: "Ahmet Yılmaz" },
  { id: "2", sirketAdi: "XYZ Yazılım", telefon: "555-987-6543", sorumluIsmi: "Ayşe Demir" },
  { id: "3", sirketAdi: "DEF Danışmanlık", telefon: "555-456-7890", sorumluIsmi: "Mehmet Öz" },
  { id: "4", sirketAdi: "GHI Güvenlik", telefon: "555-321-7654", sorumluIsmi: "Zeynep Kaya" },
  { id: "5", sirketAdi: "JKL Enerji", telefon: "555-654-3210", sorumluIsmi: "Ali Öztürk" },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
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
                      onPress={() => router.push("/customers/add" as any)}
                    >
                      <Ionicons name="person-add-outline" size={18} color="white" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="flex-1" nestedScrollEnabled indicatorStyle="white">
                    {customerList.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        className="flex-row items-center py-3 border-b border-[#2A2A2A]/50"
                        onPress={() => router.push(`/customers/${m.id}` as any)}
                      >
                        <Image
                          source={{
                            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.sirketAdi)}&background=1A1A1A&color=888&size=40`,
                          }}
                          className="w-10 h-10 rounded-full bg-[#2A2A2A]"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-white text-sm font-medium">{m.sirketAdi}</Text>
                          <Text className="text-gray-500 text-xs">{m.sorumluIsmi} · {m.telefon}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#333" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </View>

            <View className="flex-1">
              <TouchableOpacity
                className="h-full"
                activeOpacity={0.7}
                onPress={() => router.push("/schedule" as any)}
              >
                <View className="bg-[#1A1A1A] rounded-2xl p-4 h-80">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-[#8B5CF6]/10 rounded-xl items-center justify-center">
                      <Ionicons name="calendar" size={20} color="#8B5CF6" />
                    </View>
                    <Text className="text-white text-lg font-bold ml-3">Bugünün Planı</Text>
                  </View>
                  <Text className="text-gray-400 text-sm mb-3">
                    Bugünkü randevu ve ziyaretleriniz
                  </Text>
                  <ScrollView className="flex-1" indicatorStyle="white">
                    {appointments.map((r, i) => (
                      <View
                        key={i}
                        className="bg-[#111] rounded-xl border border-[#2A2A2A] p-3 mb-2"
                      >
                        <View className="flex-row items-center mb-1">
                          <View className="bg-[#8B5CF6]/20 rounded-md px-2 py-0.5">
                            <Text className="text-[#8B5CF6] text-xs font-semibold">{r.time}</Text>
                          </View>
                          <Text className="text-white text-sm font-medium ml-2">{r.customer}</Text>
                        </View>
                        <Text className="text-gray-500 text-xs">{r.phone}</Text>
                        <Text className="text-gray-500 text-xs">{r.address}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
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
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-gray-400 text-xs font-medium">Alınan Ödeme</Text>
                      <Text className="text-white text-xs font-bold">₺15.450</Text>
                    </View>
                    <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                      <View className="bg-[#3B82F6] rounded-full h-full" style={{ width: "75%" }} />
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-gray-400 text-xs font-medium">Bekleyen Ödeme</Text>
                      <Text className="text-[#F59E0B] text-xs font-bold">₺8.200</Text>
                    </View>
                    <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                      <View className="bg-[#F59E0B] rounded-full h-full" style={{ width: "40%" }} />
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text className="text-gray-400 text-xs font-medium">Tahmini Toplam Ödeme</Text>
                      <Text className="text-[#22C55E] text-xs font-bold">₺23.650</Text>
                    </View>
                    <View className="bg-[#2A2A2A] rounded-full h-3 overflow-hidden">
                      <View className="bg-[#22C55E] rounded-full h-full" style={{ width: "100%" }} />
                    </View>
                  </View>

                  <View className="mt-3 gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-300 text-sm">Alınan Toplam</Text>
                      <Text className="text-white text-lg font-bold">₺15.450</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-300 text-sm">Bekleyen Toplam</Text>
                      <Text className="text-[#F59E0B] text-lg font-bold">₺8.200</Text>
                    </View>
                    <View className="flex-row items-center justify-between pt-1 border-t border-[#2A2A2A]">
                      <Text className="text-gray-300 text-sm">Tahmini Kasa</Text>
                      <Text className="text-[#22C55E] text-xl font-bold">₺23.650</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-white text-xs font-bold mb-3">SON SERVİSLER</Text>
                  <ScrollView className="max-h-64" nestedScrollEnabled indicatorStyle="white">
                    <View className="bg-[#111] rounded-xl border border-[#2A2A2A]">
                      <TouchableOpacity
                        className="flex-row items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]"
                        onPress={() => router.push("/services" as any)}
                      >
                        <View>
                          <Text className="text-white text-sm font-medium">Ahmet Yılmaz</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">12.07.2026</Text>
                        </View>
                        <View className="flex-row items-center bg-green-500/10 rounded-lg px-2 py-1">
                          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                          <Text className="text-[#22C55E] text-xs font-medium ml-1">Ödendi</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]"
                        onPress={() => router.push("/services" as any)}
                      >
                        <View>
                          <Text className="text-white text-sm font-medium">Ayşe Demir</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">10.07.2026</Text>
                        </View>
                        <View className="flex-row items-center bg-green-500/10 rounded-lg px-2 py-1">
                          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                          <Text className="text-[#22C55E] text-xs font-medium ml-1">Ödendi</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]"
                        onPress={() => router.push("/services" as any)}
                      >
                        <View>
                          <Text className="text-white text-sm font-medium">Mehmet Öz</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">08.07.2026</Text>
                        </View>
                        <View className="flex-row items-center bg-[#F59E0B]/10 rounded-lg px-2 py-1">
                          <Ionicons name="time" size={12} color="#F59E0B" />
                          <Text className="text-[#F59E0B] text-xs font-medium ml-1">Bekliyor</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]"
                        onPress={() => router.push("/services" as any)}
                      >
                        <View>
                          <Text className="text-white text-sm font-medium">Zeynep Kaya</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">05.07.2026</Text>
                        </View>
                        <View className="flex-row items-center bg-[#F59E0B]/10 rounded-lg px-2 py-1">
                          <Ionicons name="time" size={12} color="#F59E0B" />
                          <Text className="text-[#F59E0B] text-xs font-medium ml-1">Bekliyor</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-row items-center justify-between px-3 py-2.5"
                        onPress={() => router.push("/services" as any)}
                      >
                        <View>
                          <Text className="text-white text-sm font-medium">Ali Can</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">03.07.2026</Text>
                        </View>
                        <View className="flex-row items-center bg-green-500/10 rounded-lg px-2 py-1">
                          <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                          <Text className="text-[#22C55E] text-xs font-medium ml-1">Ödendi</Text>
                        </View>
                      </TouchableOpacity>
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
  );
}
