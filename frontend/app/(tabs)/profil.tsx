import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Platform, Modal, PanResponder, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { profileApi, UserProfile } from "../../api/profile";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const navigation = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyAddress, setEditCompanyAddress] = useState("");
  const [editCompanyPhone, setEditCompanyPhone] = useState("");
  const [editCompanyEmail, setEditCompanyEmail] = useState("");
  const [editCompanyTaxNumber, setEditCompanyTaxNumber] = useState("");
  const [editCompanyLogoUrl, setEditCompanyLogoUrl] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      console.log("🔑 [PROFILE] AsyncStorage token:", token ? `${token.substring(0, 20)}...` : "NULL");

      const response = await profileApi.getProfile();
      console.log("✅ [PROFILE] API response:", JSON.stringify(response.data).substring(0, 100));
      setProfile(response.data);
    } catch (err: any) {
      console.log("🔴 [PROFILE] Hata:", err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 401) {
        await logout();
        router.replace("/(auth)/login");
        return;
      }
      const message = err.response?.data?.message || "Profil bilgileri yüklenemedi.";
      setError(message);
      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    navigation.replace("/(auth)/login");
  };

  const handleCopyInviteCode = async () => {
    if (!company?.invitationCode) return;
    await Clipboard.setStringAsync(company.invitationCode);
    Alert.alert("Kopyalandı", `Davet kodu panoya kopyalandı:\n${company.invitationCode}`);
  };

  const startEditingUser = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditingUser(true);
  };

  const cancelEditingUser = () => {
    setEditingUser(false);
    setEditName("");
    setEditPhone("");
  };

  const handleUpdateUser = async () => {
    if (!editName.trim()) {
      Alert.alert("Hata", "Ad Soyad boş bırakılamaz.");
      return;
    }

    try {
      setSaving(true);
      const response = await profileApi.updateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      setProfile((prev) => prev ? { ...prev, user: response.data } : prev);
      setEditingUser(false);
      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.");
    } catch (err: any) {
      console.log("🔴 [PROFILE] Güncelleme hatası:", err.response?.status, err.response?.data || err.message);
      const message = err.response?.data?.message || "Güncelleme başarısız.";
      Alert.alert("Hata", message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignature = async (paths: any[]) => {
    try {
      const response = await profileApi.updateUser({
        name: user?.name || "",
        phone: user?.phone || "",
        signature: JSON.stringify(paths),
      });
      setProfile((prev) => prev ? { ...prev, user: response.data } : prev);
      setSignatureModalVisible(false);
      Alert.alert("Başarılı", "İmzanız kaydedildi.");
    } catch (err: any) {
      Alert.alert("Hata", "İmza kaydedilemedi.");
    }
  };

  const startEditingCompany = () => {
    setEditCompanyName(company?.name || "");
    setEditCompanyAddress(company?.address || "");
    setEditCompanyPhone(company?.phone || "");
    setEditCompanyEmail(company?.email || "");
    setEditCompanyTaxNumber(company?.taxNumber || "");
    setEditCompanyLogoUrl(company?.logoUrl || "");
    setEditCompanyLogo(null);
    setEditingCompany(true);
  };

  const cancelEditingCompany = () => {
    setEditingCompany(false);
    setEditCompanyName("");
    setEditCompanyAddress("");
    setEditCompanyPhone("");
    setEditCompanyEmail("");
    setEditCompanyTaxNumber("");
    setEditCompanyLogoUrl("");
    setEditCompanyLogo(null);
  };

  const handleUpdateCompany = async () => {
    if (!editCompanyName.trim()) {
      Alert.alert("Hata", "Şirket adı boş bırakılamaz.");
      return;
    }

    try {
      setSaving(true);
      const response = await profileApi.updateCompany({
        name: editCompanyName.trim(),
        address: editCompanyAddress.trim(),
        phone: editCompanyPhone.trim(),
        email: editCompanyEmail.trim(),
        taxNumber: editCompanyTaxNumber.trim(),
        logoUrl: editCompanyLogo || editCompanyLogoUrl.trim(),
      });

      setProfile((prev) => prev ? { ...prev, company: response.data } : prev);
      setEditingCompany(false);
      Alert.alert("Başarılı", "Kurumsal bilgiler güncellendi.");
    } catch (err: any) {
      console.log("🔴 [PROFILE] Şirket güncelleme hatası:", err.response?.status, err.response?.data || err.message);
      const message = err.response?.data?.message || "Güncelleme başarısız.";
      Alert.alert("Hata", message);
    } finally {
      setSaving(false);
    }
  };

  const user = profile?.user;
  const company = profile?.company;
  const isAdmin = user?.role === "ADMIN";

  const inputClass = "bg-[#2A2A2A] text-white text-sm rounded-lg px-3 py-2 border border-[#3B82F6]/30";
  const labelClass = "text-gray-400 text-xs font-medium mb-1";

  if (loading) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 text-sm mt-3">Yükleniyor...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-white text-lg font-semibold mt-4">Bir hata oluştu</Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">{error}</Text>
        <TouchableOpacity
          className="mt-6 bg-[#3B82F6] rounded-xl px-6 py-3"
          onPress={fetchProfile}
        >
          <Text className="text-white font-semibold">Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-white">{user?.name}</Text>
          <Text className="text-gray-400 text-sm">{user?.email}</Text>
        </View>

        {/* Bilgiler Kartı */}
        <View className="bg-[#1A1A1A] rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={20} color="#3B82F6" />
              <Text className="text-white font-semibold">Bilgiler</Text>
            </View>
            <View className="flex-row items-center gap-2">
              {editingUser ? (
                <>
                  <TouchableOpacity onPress={cancelEditingUser} disabled={saving}>
                    <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleUpdateUser} disabled={saving}>
                    <Ionicons
                      name={saving ? "hourglass-outline" : "checkmark-circle"}
                      size={22}
                      color={saving ? "#6B7280" : "#22C55E"}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={startEditingUser}>
                  <Ionicons name="create-outline" size={22} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 gap-4">
              <View>
                <Text className={labelClass}>Ad Soyad</Text>
                {editingUser ? (
                  <TextInput
                    className={inputClass}
                    value={editName}
                    onChangeText={setEditName}
                    editable={!saving}
                  />
                ) : (
                  <Text className="text-white text-sm">{user?.name}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>E-posta</Text>
                <Text className="text-white text-sm">{user?.email}</Text>
              </View>
              <View>
                <Text className={labelClass}>Telefon</Text>
                {editingUser ? (
                  <TextInput
                    className={inputClass}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    editable={!saving}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text className="text-white text-sm">{user?.phone || "-"}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>Rol</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-white text-sm">{user?.role}</Text>
                  {isAdmin && (
                    <View className="bg-[#3B82F6]/15 border border-[#3B82F6]/30 rounded-lg px-2 py-0.5">
                      <Text className="text-[#3B82F6] text-xs font-medium">Admin</Text>
                    </View>
                  )}
                </View>
              </View>
              <View>
                <Text className={labelClass}>İmza</Text>
                {user?.signature ? (
                  <View className="flex-row items-center gap-2 mt-1">
                    <TouchableOpacity onPress={() => setSignatureModalVisible(true)}>
                      <View className="bg-white rounded-lg px-2 py-1.5">
                        {(() => {
                          try {
                            const parsed = JSON.parse(user.signature!);
                            const pts = Array.isArray(parsed) && parsed.length > 0
                              ? (Array.isArray(parsed[0]) ? parsed : [parsed])
                              : [];
                            if (pts.length === 0) return <Text className="text-gray-400 text-xs">-</Text>;
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            pts.forEach((path: any[]) => {
                              path.forEach((p: any) => {
                                if (p.x < minX) minX = p.x;
                                if (p.y < minY) minY = p.y;
                                if (p.x > maxX) maxX = p.x;
                                if (p.y > maxY) maxY = p.y;
                              });
                            });
                            const pad = 10;
                            const vw = maxX - minX + pad * 2;
                            const vh = maxY - minY + pad * 2;
                            return (
                              <Svg width={100} height={28} viewBox={`${minX - pad} ${minY - pad} ${vw} ${vh}`}>
                                {pts.map((path: any[], i: number) => {
                                  if (!path || path.length === 0) return null;
                                  const d = path.map((p: any, j: number) =>
                                    j === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                                  ).join(" ");
                                  return <Path key={i} d={d} stroke="#000" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                                })}
                              </Svg>
                            );
                          } catch { return <Text className="text-gray-400 text-xs">-</Text>; }
                        })()}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSignatureModalVisible(true)}>
                      <Ionicons name="create-outline" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setSignatureModalVisible(true)}
                    className="flex-row items-center gap-1.5 mt-1"
                  >
                    <Ionicons name="pen-outline" size={14} color="#3B82F6" />
                    <Text className="text-[#3B82F6] text-xs">İmza Eklemek İçin Tıklayın</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Davet Kodları Kartı — Admin */}
        {isAdmin && (
          <View className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
            <View className="flex-row items-center gap-3 mb-4">
              <Ionicons name="key-outline" size={20} color="#3B82F6" />
              <Text className="text-white font-semibold">Admin Yetkileri</Text>
            </View>
            <View className="bg-[#2A2A2A] rounded-xl p-3">
              <Text className="text-gray-400 text-xs font-medium mb-1">Rol</Text>
              <Text className="text-white text-sm font-semibold">{user?.role}</Text>
            </View>
          </View>
        )}

        {/* Kurumsal Bilgiler Kartı */}
        {company && (
          <View className="bg-[#1A1A1A] rounded-2xl p-4 mt-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="business-outline" size={20} color="#3B82F6" />
                <Text className="text-white font-semibold">Kurumsal Bilgiler</Text>
              </View>
              {isAdmin && (
                <View className="flex-row items-center gap-2">
                  {editingCompany ? (
                    <>
                      <TouchableOpacity onPress={cancelEditingCompany} disabled={saving}>
                        <Ionicons name="close-circle-outline" size={22} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleUpdateCompany} disabled={saving}>
                        <Ionicons
                          name={saving ? "hourglass-outline" : "checkmark-circle"}
                          size={22}
                          color={saving ? "#6B7280" : "#22C55E"}
                        />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={startEditingCompany}>
                      <Ionicons name="create-outline" size={22} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-4 mb-4">
              {editingCompany ? (
                <View className="w-12 h-12 rounded-xl bg-[#2A2A2A] items-center justify-center">
                  <Ionicons name="image-outline" size={24} color="#6B7280" />
                </View>
              ) : company.logoUrl ? (
                <Image
                  source={{ uri: company.logoUrl }}
                  className="w-12 h-12 rounded-xl bg-[#2A2A2A]"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 items-center justify-center">
                  <Ionicons name="business" size={24} color="#3B82F6" />
                </View>
              )}
              <View className="flex-1">
                {editingCompany ? (
                  <TextInput
                    className={inputClass}
                    value={editCompanyName}
                    onChangeText={setEditCompanyName}
                    editable={!saving}
                    placeholder="Şirket Adı"
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text className="text-white text-sm font-semibold">{company.name}</Text>
                )}
              </View>
            </View>

            <View className="gap-3">
              {isAdmin && company.invitationCode && (
                <View>
                  <Text className={labelClass}>Davet Kodu</Text>
                  <View className="flex-row items-center justify-between bg-[#2A2A2A] rounded-lg px-3 py-2 border border-[#3B82F6]/30">
                    <Text className="text-[#3B82F6] text-sm font-mono font-semibold">{company.invitationCode}</Text>
                    <TouchableOpacity onPress={handleCopyInviteCode} className="ml-2">
                      <Ionicons name="copy-outline" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">Bu kodu paylaşıp çalışan kaydı yapabilirsiniz.</Text>
                </View>
              )}
              <View>
                <Text className={labelClass}>Adres</Text>
                {editingCompany ? (
                  <TextInput
                    className={inputClass}
                    value={editCompanyAddress}
                    onChangeText={setEditCompanyAddress}
                    editable={!saving}
                    placeholder="Adres"
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text className="text-white text-sm">{company.address}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>Telefon</Text>
                {editingCompany ? (
                  <TextInput
                    className={inputClass}
                    value={editCompanyPhone}
                    onChangeText={setEditCompanyPhone}
                    editable={!saving}
                    keyboardType="phone-pad"
                    placeholder="Telefon"
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text className="text-white text-sm">{company.phone}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>E-posta</Text>
                {editingCompany ? (
                  <TextInput
                    className={inputClass}
                    value={editCompanyEmail}
                    onChangeText={setEditCompanyEmail}
                    editable={!saving}
                    keyboardType="email-address"
                    placeholder="E-posta"
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text className="text-white text-sm">{company.email}</Text>
                )}
              </View>
              <View>
                <Text className={labelClass}>Vergi Numarası</Text>
                {editingCompany ? (
                  <TextInput
                    className={inputClass}
                    value={editCompanyTaxNumber}
                    onChangeText={setEditCompanyTaxNumber}
                    editable={!saving}
                    keyboardType="number-pad"
                    placeholder="Vergi Numarası"
                    placeholderTextColor="#6B7280"
                  />
                ) : (
                  <Text className="text-white text-sm">{company.taxNumber || "-"}</Text>
                )}
              </View>
              {editingCompany && (
                <View>
                  <Text className={labelClass}>Logo</Text>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-[#2A2A2A] rounded-lg px-3 py-2.5 border border-[#3B82F6]/30 flex-row items-center gap-2"
                      onPress={async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                          mediaTypes: ["images"],
                          allowsEditing: true,
                          aspect: [4, 1],
                          quality: 0.5,
                          base64: true,
                        });
                        if (!result.canceled && result.assets[0].base64) {
                          setEditCompanyLogo(`data:image/png;base64,${result.assets[0].base64}`);
                        }
                      }}
                      disabled={saving}
                    >
                      <Ionicons name="image-outline" size={18} color="#3B82F6" />
                      <Text className="text-gray-400 text-sm">
                        {editCompanyLogo ? "Logo seçildi" : "Logo seçin..."}
                      </Text>
                    </TouchableOpacity>
                    {editCompanyLogo && (
                      <TouchableOpacity onPress={() => setEditCompanyLogo(null)} disabled={saving}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {editCompanyLogo && (
                    <Image source={{ uri: editCompanyLogo }} className="w-full h-16 rounded-lg mt-2 bg-[#2A2A2A]" resizeMode="contain" />
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Çıkış Yap */}
        <TouchableOpacity className="mt-6" onPress={handleLogout}>
          <View className="bg-red-500/10 rounded-xl py-3.5 items-center">
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text className="text-red-400 font-semibold">Çıkış Yap</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={signatureModalVisible} transparent animationType="fade" onRequestClose={() => setSignatureModalVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">İmzam</Text>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)} className="p-1">
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ProfileSignaturePad
              onSave={handleSaveSignature}
              onClose={() => setSignatureModalVisible(false)}
              initialSignature={user?.signature}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function ProfileSignaturePad({ onSave, onClose, initialSignature }: { onSave: (paths: any[]) => void; onClose: () => void; initialSignature?: string | null }) {
  const [paths, setPaths] = useState<any[][]>([]);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });
  const currentPointsRef = useRef<any[]>([]);
  const allPathsRef = useRef<any[][]>([]);
  const [, forceRender] = useState(0);

  const parseInitial = (): any[][] => {
    if (!initialSignature) return [];
    try {
      const parsed = JSON.parse(initialSignature);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      if (Array.isArray(parsed[0])) return parsed;
      if (parsed[0] && typeof parsed[0].x === "number") return [parsed];
      return [];
    } catch {
      return [];
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        currentPointsRef.current = [{ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }];
      },
      onPanResponderMove: (evt) => {
        currentPointsRef.current = [
          ...currentPointsRef.current,
          { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY },
        ];
        forceRender((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          allPathsRef.current = [...allPathsRef.current, [...currentPointsRef.current]];
          setPaths([...allPathsRef.current]);
        }
        currentPointsRef.current = [];
      },
    }),
  ).current;

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
  };

  const handleClear = () => {
    currentPointsRef.current = [];
    allPathsRef.current = [];
    setPaths([]);
    forceRender((n) => n + 1);
  };

  const handleSave = () => {
    if (allPathsRef.current.length === 0) {
      Alert.alert("Uyarı", "Lütfen imza atın.");
      return;
    }
    onSave(allPathsRef.current);
  };

  useEffect(() => {
    const initial = parseInitial();
    if (initial.length > 0) {
      allPathsRef.current = initial;
      setPaths([...initial]);
    }
  }, [initialSignature]);

  return (
    <>
      <View
        className="bg-[#111] border border-[#2A2A2A] rounded-lg h-56 items-center justify-center"
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && currentPointsRef.current.length === 0 && (
          <Text className="text-gray-500 text-sm absolute">Lütfen bu alana imzanızı atınız</Text>
        )}
        <Svg width="100%" height="100%" viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}>
          {paths.map((points, i) => (
            <Path key={i} d={pointsToPath(points)} stroke="#3B82F6" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPointsRef.current.length > 0 && (
            <Path d={pointsToPath(currentPointsRef.current)} stroke="#3B82F6" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
      </View>
      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
          onPress={handleClear}
        >
          <Text className="text-gray-300 font-medium">Temizle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
          onPress={handleSave}
        >
          <Text className="text-white font-medium">Kaydet</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
