import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const user = {
  username: "ahmetkaya",
  name: "Ahmet Kaya",
  email: "ahmet@example.com",
  phone: "555-123-4567",
  role: "Admin",
  teams: ["Alfa Ekibi", "Bravo Ekibi"],
  company: "1D GÜVENLİK VE İLETİŞİM SİSTEMLERİ TİCARET LTD. ŞTİ.",
};

const company = {
  name: "1D GÜVENLİK VE İLETİŞİM SİSTEMLERİ TİCARET LTD. ŞTİ.",
  address: "Goncalar Mah. Ali Alp Böke Cad. No: 150 C Karşıyaka - İZMİR",
  phone1: "0232 365 20 87",
  phone2: "0 533 368 03 13",
  email: "info@1dguvenlik.com",
};

export default function ProfileScreen() {
  const [editingUser, setEditingUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [editedCompany, setEditedCompany] = useState(company);

  const isAdmin = editedUser.role === "Admin";

  const inputClass = "bg-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 border border-[#3B82F6]/30";
  const labelClass = "text-gray-400 text-xs font-medium mb-1";

  return (
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white tracking-tight">
              Profil
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-[#3B82F6] items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-white">
              {editedUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-white">{editedUser.username}</Text>
          <Text className="text-gray-400 text-sm">{editedUser.email}</Text>
        </View>

        {/* Bilgiler Kartı */}
        <View className="bg-[#1A1A1A] rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
              <Text className="text-white font-semibold">Bilgiler</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingUser(!editingUser)}>
              <Ionicons
                name={editingUser ? "checkmark-circle" : "create-outline"}
                size={22}
                color="#3B82F6"
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 gap-4">
              <View>
                <Text className={labelClass}>Ad Soyad</Text>
                {editingUser ? (
                  <TextInput
                    className={inputClass}
                    value={editedUser.name}
                    onChangeText={(t) => setEditedUser({ ...editedUser, name: t })}
                  />
                ) : (
                  <Text className="text-white text-sm">{editedUser.name}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>E-posta</Text>
                {editingUser ? (
                  <TextInput
                    className={inputClass}
                    value={editedUser.email}
                    onChangeText={(t) => setEditedUser({ ...editedUser, email: t })}
                  />
                ) : (
                  <Text className="text-white text-sm">{editedUser.email}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>Telefon</Text>
                {editingUser ? (
                  <TextInput
                    className={inputClass}
                    value={editedUser.phone}
                    onChangeText={(t) => setEditedUser({ ...editedUser, phone: t })}
                  />
                ) : (
                  <Text className="text-white text-sm">{editedUser.phone}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>Rol</Text>
                <Text className="text-white text-sm">{editedUser.role}</Text>
              </View>
            </View>

              <View className="flex-1">
                <Text className={labelClass}>Bulunduğu Ekipler</Text>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {editedUser.teams.map((team, i) => (
                    <View key={i} className="bg-[#3B82F6]/15 border border-[#3B82F6]/30 rounded-lg px-3 py-2">
                      <Text className="text-[#3B82F6] text-sm font-medium">{team}</Text>
                    </View>
                  ))}
                </View>

                <View className="mt-1">
                  <Text className={labelClass}>Bulunduğu Kurum</Text>
                  <Text className="text-white text-sm">{editedUser.company}</Text>
                </View>
            </View>
          </View>
        </View>

        {/* Davet Kodları Kartı */}
        {isAdmin && (
          <View className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
            <View className="flex-row items-center gap-3 mb-4">
              <Ionicons name="key-outline" size={20} color="#3B82F6" />
              <Text className="text-white font-semibold">Davet Kodları</Text>
            </View>
            <View className="gap-3">
              <View className="bg-[#2A2A2A] rounded-xl p-3">
                <Text className="text-gray-400 text-xs font-medium mb-1">Admin Kodu</Text>
                <Text className="text-white text-sm font-semibold">ADMIN2024</Text>
              </View>
              <View className="bg-[#2A2A2A] rounded-xl p-3">
                <Text className="text-gray-400 text-xs font-medium mb-1">Kullanıcı Kodu</Text>
                <Text className="text-white text-sm font-semibold">MIRA2024</Text>
              </View>
            </View>
          </View>
        )}

        {/* Kurumsal Bilgiler Kartı */}
        <View className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="business-outline" size={20} color="#3B82F6" />
              <Text className="text-white font-semibold">Kurumsal Bilgiler</Text>
            </View>
            {isAdmin ? (
              <TouchableOpacity onPress={() => setEditingCompany(!editingCompany)}>
                <Ionicons
                  name={editingCompany ? "checkmark-circle" : "create-outline"}
                  size={22}
                  color="#3B82F6"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="flex-row items-center gap-4 mb-4">
            <Image
              source={{ uri: "https://picsum.photos/seed/company/100/100" }}
              className="w-12 h-12 rounded-xl bg-[#2A2A2A]"
              resizeMode="cover"
            />
            <View className="flex-1">
              {editingCompany && isAdmin ? (
                <TextInput
                  className={inputClass}
                  value={editedCompany.name}
                  onChangeText={(t) => setEditedCompany({ ...editedCompany, name: t })}
                />
              ) : (
                <Text className="text-white text-sm font-semibold">{editedCompany.name}</Text>
              )}
            </View>
          </View>

          <View className="gap-3">
            <View>
              <Text className={labelClass}>Adres</Text>
              {editingCompany && isAdmin ? (
                <TextInput
                  className={inputClass}
                  value={editedCompany.address}
                  onChangeText={(t) => setEditedCompany({ ...editedCompany, address: t })}
                />
              ) : (
                <Text className="text-white text-sm">{editedCompany.address}</Text>
              )}
            </View>
            <View>
              <Text className={labelClass}>İletişim Numarası 1</Text>
              {editingCompany && isAdmin ? (
                <TextInput
                  className={inputClass}
                  value={editedCompany.phone1}
                  onChangeText={(t) => setEditedCompany({ ...editedCompany, phone1: t })}
                />
              ) : (
                <Text className="text-white text-sm">{editedCompany.phone1}</Text>
              )}
            </View>
            {editedCompany.phone2 ? (
              <View>
                <Text className={labelClass}>İletişim Numarası 2</Text>
                {editingCompany && isAdmin ? (
                  <TextInput
                    className={inputClass}
                    value={editedCompany.phone2}
                    onChangeText={(t) => setEditedCompany({ ...editedCompany, phone2: t })}
                  />
                ) : (
                  <Text className="text-white text-sm">{editedCompany.phone2}</Text>
                )}
              </View>
            ) : null}
            <View>
              <Text className={labelClass}>E-posta</Text>
              {editingCompany && isAdmin ? (
                <TextInput
                  className={inputClass}
                  value={editedCompany.email}
                  onChangeText={(t) => setEditedCompany({ ...editedCompany, email: t })}
                />
              ) : (
                <Text className="text-white text-sm">{editedCompany.email}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
