import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface Customer {
  id: string;
  companyName: string;
  address: string;
  email: string;
  phone: string;
  contactPerson: string;
  contactPhone: string;
}

const initialData: Customer[] = [
  { id: "1", companyName: "ABC Teknoloji", address: "İstanbul, Kadıköy, Bağdat Caddesi No:42", email: "info@abc.com", phone: "555-123-4567", contactPerson: "Ahmet Yılmaz", contactPhone: "555-111-2233" },
  { id: "2", companyName: "XYZ Yazılım", address: "Ankara, Çankaya, Atatürk Bulvarı No:25", email: "info@xyz.com", phone: "555-987-6543", contactPerson: "Ayşe Demir", contactPhone: "555-222-3344" },
  { id: "3", companyName: "DEF Danışmanlık", address: "İzmir, Konak, Cumhuriyet Bulvarı No:10", email: "info@def.com", phone: "555-456-7890", contactPerson: "Mehmet Öz", contactPhone: "555-333-4455" },
  { id: "4", companyName: "GHI Güvenlik", address: "İstanbul, Beşiktaş, Barbaros Bulvarı No:15", email: "info@ghi.com", phone: "555-321-7654", contactPerson: "Zeynep Kaya", contactPhone: "555-444-5566" },
  { id: "5", companyName: "JKL Enerji", address: "İzmir, Karşıyaka, Mustafa Kemal Cad. No:5", email: "info@jkl.com", phone: "555-654-3210", contactPerson: "Ali Öztürk", contactPhone: "555-555-6677" },
];

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>(initialData);
  const [formOpen, setFormOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  function handleSave() {
    if (!newCompany.trim()) {
      Alert.alert("Hata", "Şirket adı gerekli");
      return;
    }
    const yeni: Customer = {
      id: Date.now().toString(),
      companyName: newCompany.trim(),
      address: newAddress.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      contactPerson: newContact.trim(),
      contactPhone: newContactPhone.trim(),
    };
    setCustomers([yeni, ...customers]);
    setNewCompany("");
    setNewAddress("");
    setNewEmail("");
    setNewPhone("");
    setNewContact("");
    setNewContactPhone("");
    setFormOpen(false);
  }

  function handleDelete(id: string) {
    Alert.alert("Sil", "Silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => setCustomers(customers.filter((c) => c.id !== id)) },
    ]);
  }

  function handleEdit(id: string) {
    Alert.alert("Düzenle", "Düzenleniyor...");
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
              Müşteri Yönetimi
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mb-4">
          Müşterilerinizi görüntüleyin ve yönetin
        </Text>

        {/* YENİ MÜŞTERİ EKLE */}
        <TouchableOpacity
          onPress={() => setFormOpen(!formOpen)}
          className="flex-row items-center justify-between bg-[#1A1A1A] rounded-2xl p-4 mb-4"
        >
          <Text className="text-white text-lg font-bold">Yeni Müşteri Ekle</Text>
          <Ionicons name={formOpen ? "chevron-up" : "chevron-down"} size={22} color="#3B82F6" />
        </TouchableOpacity>

        {formOpen && (
          <View className="bg-[#1A1A1A] rounded-2xl p-4 mb-4">
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-3"
              placeholder="Şirket Adı"
              placeholderTextColor="#6B7280"
              value={newCompany}
              onChangeText={setNewCompany}
            />
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-3"
              placeholder="Adres"
              placeholderTextColor="#6B7280"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-3"
              placeholder="E-posta"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-3"
              placeholder="Telefon"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={setNewPhone}
            />
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-3"
              placeholder="Sorumlu Kişi"
              placeholderTextColor="#6B7280"
              value={newContact}
              onChangeText={setNewContact}
            />
            <TextInput
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-4"
              placeholder="Sorumlu Telefon"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              value={newContactPhone}
              onChangeText={setNewContactPhone}
            />
            <TouchableOpacity
              onPress={handleSave}
              className="bg-[#3B82F6] rounded-lg py-3 items-center"
            >
              <Text className="text-white text-sm font-bold">Kaydet</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TÜM MÜŞTERİLER */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-bold">Tüm Müşteriler</Text>
          <Text className="text-gray-500 text-sm">{customers.length} kayıt</Text>
        </View>

        <TextInput
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-4"
          placeholder="Müşteri ara..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />

        {filteredCustomers.map((c) => (
          <View
            key={c.id}
            className="bg-[#1A1A1A] rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-[#3B82F6]/20 items-center justify-center">
                <Text className="text-[#3B82F6] text-lg font-bold">
                  {c.companyName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white text-base font-bold">{c.companyName}</Text>
                <Text className="text-gray-400 text-sm mt-0.5">{c.contactPerson}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">{c.phone}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleEdit(c.id)}
                  className="w-9 h-9 bg-[#3B82F6]/10 rounded-xl items-center justify-center"
                >
                  <Ionicons name="create-outline" size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(c.id)}
                  className="w-9 h-9 bg-[#EF4444]/10 rounded-xl items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
