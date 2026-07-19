import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { customerApi, Customer } from "../../api/customers";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async (pageNum: number = 0, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = searchQuery
        ? await customerApi.search(searchQuery, pageNum, size)
        : await customerApi.getAll(pageNum, size);
      setCustomers(response.data.content);
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
      setPage(response.data.number);
    } catch (error: any) {
      Alert.alert("Hata", "Müşteriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => {
    fetchCustomers(0);
  }, [fetchCustomers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search.trim()) {
        fetchCustomers(0, search.trim());
      } else {
        fetchCustomers(0);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, fetchCustomers]);

  function resetForm() {
    setNewCompany("");
    setNewAddress("");
    setNewEmail("");
    setNewPhone("");
    setNewContact("");
    setNewContactPhone("");
    setEditingCustomer(null);
  }

  async function handleSave() {
    if (!newCompany.trim()) {
      Alert.alert("Hata", "Şirket adı gerekli");
      return;
    }

    const data = {
      companyName: newCompany.trim(),
      address: newAddress.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      contactPerson: newContact.trim(),
      contactPhone: newContactPhone.trim(),
    };

    setLoading(true);
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, data);
        Alert.alert("Başarılı", "Müşteri güncellendi.");
      } else {
        await customerApi.create(data);
        Alert.alert("Başarılı", "Müşteri eklendi.");
      }
      resetForm();
      setFormOpen(false);
      fetchCustomers(page, search.trim() || undefined);
    } catch (error: any) {
      Alert.alert("Hata", "İşlem sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    Alert.alert("Sil", "Silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await customerApi.delete(id);
            Alert.alert("Başarılı", "Müşteri silindi.");
            fetchCustomers(page, search.trim() || undefined);
          } catch (error: any) {
            Alert.alert("Hata", "Silme işleminde bir sorun oluştu.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  async function handleEdit(id: string) {
    setLoading(true);
    try {
      const response = await customerApi.getById(id);
      const c = response.data;
      setEditingCustomer(c);
      setNewCompany(c.companyName);
      setNewAddress(c.address);
      setNewEmail(c.email);
      setNewPhone(c.phone);
      setNewContact(c.contactPerson);
      setNewContactPhone(c.contactPhone);
      setFormOpen(true);
    } catch (error: any) {
      Alert.alert("Hata", "Müşteri bilgileri yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
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

        <TouchableOpacity
          onPress={() => {
            if (formOpen) {
              resetForm();
            }
            setFormOpen(!formOpen);
          }}
          className="flex-row items-center justify-between bg-[#1A1A1A] rounded-2xl p-4 mb-4"
        >
          <Text className="text-white text-lg font-bold">
            {editingCustomer ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
          </Text>
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
              disabled={loading}
              className="bg-[#3B82F6] rounded-lg py-3 items-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-sm font-bold">
                  {editingCustomer ? "Güncelle" : "Kaydet"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-bold">Tüm Müşteriler</Text>
          <Text className="text-gray-500 text-sm">{totalElements} kayıt</Text>
        </View>

        <TextInput
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white text-sm mb-4"
          placeholder="Müşteri ara..."
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={setSearch}
        />

        {loading && customers.length === 0 ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 text-sm mt-3">Yükleniyor...</Text>
          </View>
        ) : (
          <>
            {customers.map((c) => (
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
                      className="w-9 h-9 bg-[#3A3A3A] rounded-xl items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {customers.length === 0 && (
              <View className="items-center py-10">
                <Text className="text-gray-500 text-sm">Müşteri bulunamadı.</Text>
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-center gap-3 mt-4">
                <TouchableOpacity
                  disabled={page === 0}
                  onPress={() => fetchCustomers(page - 1, search.trim() || undefined)}
                  className={`px-4 py-2 rounded-lg ${page === 0 ? "bg-[#1A1A1A] opacity-50" : "bg-[#3B82F6]"}`}
                >
                  <Text className="text-white text-sm">Önceki</Text>
                </TouchableOpacity>
                <Text className="text-gray-400 text-sm">
                  {page + 1} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={page >= totalPages - 1}
                  onPress={() => fetchCustomers(page + 1, search.trim() || undefined)}
                  className={`px-4 py-2 rounded-lg ${page >= totalPages - 1 ? "bg-[#1A1A1A] opacity-50" : "bg-[#3B82F6]"}`}
                >
                  <Text className="text-white text-sm">Sonraki</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
