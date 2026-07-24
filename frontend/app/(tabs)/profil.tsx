import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, Alert, ActivityIndicator, Platform, Modal, PanResponder, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { profileApi, UserProfile } from "../../api/profile";
import { authApi } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import CustomAlert from "../../components/CustomAlert";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { colors, toggleTheme, isDark } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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
      const message = err.response?.data?.message || t("prf.errorLoad");
      setError(message);
      Alert.alert(t("common.error"), message);
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

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteModalVisible(false);
    try {
      await authApi.deleteAccount();
      await logout();
      navigation.replace("/(auth)/login");
    } catch (err: any) {
      const message = err.response?.data?.message || t("prf.errorDeleteAccount");
      Alert.alert(t("common.error"), message);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!company?.invitationCode) return;
    await Clipboard.setStringAsync(company.invitationCode);
    Alert.alert(t("prf.copied"), t("prf.copiedMsg", { code: company.invitationCode }));
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
      Alert.alert(t("common.error"), t("prf.nameEmpty"));
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
      Alert.alert(t("common.success"), t("prf.successUser"));
    } catch (err: any) {
      console.log("🔴 [PROFILE] Güncelleme hatası:", err.response?.status, err.response?.data || err.message);
      const message = err.response?.data?.message || t("prf.errorUser");
      Alert.alert(t("common.error"), message);
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
      Alert.alert(t("common.success"), t("prf.successSignature"));
    } catch (err: any) {
      Alert.alert(t("common.error"), t("prf.errorSignature"));
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
      Alert.alert(t("common.error"), t("prf.companyNameEmpty"));
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
      Alert.alert(t("common.success"), t("prf.successCompany"));
    } catch (err: any) {
      console.log("🔴 [PROFILE] Şirket güncelleme hatası:", err.response?.status, err.response?.data || err.message);
      const message = err.response?.data?.message || t("prf.errorUser");
      Alert.alert(t("common.error"), message);
    } finally {
      setSaving(false);
    }
  };

  const user = profile?.user;
  const company = profile?.company;
  const isAdmin = user?.role === "ADMIN";

  const inputClass = "text-sm rounded-lg px-3 py-2";
  const labelClass = "text-xs font-medium mb-1";

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>{t("prf.loading")}</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>{t("prf.error")}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity
          style={{ marginTop: 24, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={fetchProfile}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>{t("prf.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700", letterSpacing: -0.5 }}>
              {t("prf.title")}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
              <Ionicons name="home-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mb-6">
          <View style={{ width: 80, height: 80, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{user?.name}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{user?.email}</Text>
        </View>

        {/* Bilgiler Kartı */}
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16 }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.info")}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              {editingUser ? (
                <>
                  <TouchableOpacity onPress={cancelEditingUser} disabled={saving}>
                    <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleUpdateUser} disabled={saving}>
                    <Ionicons
                      name={saving ? "hourglass-outline" : "checkmark-circle"}
                      size={22}
                      color={saving ? colors.textMuted : colors.success}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={startEditingUser}>
                  <Ionicons name="create-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 gap-4">
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.name")}</Text>
                {editingUser ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editName}
                    onChangeText={setEditName}
                    editable={!saving}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{user?.name}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.email")}</Text>
                <Text style={{ color: colors.text, fontSize: 14 }}>{user?.email}</Text>
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.phone")}</Text>
                {editingUser ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    editable={!saving}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{user?.phone || "-"}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.role")}</Text>
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: colors.text, fontSize: 14 }}>{user?.role}</Text>
                  {isAdmin && (
                    <View style={{ backgroundColor: colors.primary + "15", borderColor: colors.primary + "4D", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "500" }}>Admin</Text>
                    </View>
                  )}
                </View>
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.signature")}</Text>
                {user?.signature ? (
                  <View className="flex-row items-center gap-2 mt-1">
                    <TouchableOpacity onPress={() => setSignatureModalVisible(true)}>
                      <View style={{ backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
                        {(() => {
                          try {
                            const parsed = JSON.parse(user.signature!);
                            const pts = Array.isArray(parsed) && parsed.length > 0
                              ? (Array.isArray(parsed[0]) ? parsed : [parsed])
                              : [];
                            if (pts.length === 0) return <Text style={{ color: colors.textSecondary, fontSize: 12 }}>-</Text>;
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
                                  return <Path key={i} d={d} stroke={colors.text} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                                })}
                              </Svg>
                            );
                          } catch { return <Text style={{ color: colors.textSecondary, fontSize: 12 }}>-</Text>; }
                        })()}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSignatureModalVisible(true)}>
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setSignatureModalVisible(true)}
                    className="flex-row items-center gap-1.5 mt-1"
                  >
                    <Ionicons name="pen-outline" size={14} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 12 }}>{t("prf.addSignature")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Davet Kodları Kartı — Admin */}
        {isAdmin && (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginTop: 16 }}>
            <View className="flex-row items-center gap-3 mb-4">
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.adminPrivileges")}</Text>
            </View>
            <View style={{ backgroundColor: colors.bgInput, borderRadius: 12, padding: 12 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.role")}</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{user?.role}</Text>
            </View>
          </View>
        )}

        {/* Kurumsal Bilgiler Kartı */}
        {company && (
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginTop: 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <Ionicons name="business-outline" size={20} color={colors.primary} />
                <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.companyInfo")}</Text>
              </View>
              {isAdmin && (
                <View className="flex-row items-center gap-2">
                  {editingCompany ? (
                    <>
                      <TouchableOpacity onPress={cancelEditingCompany} disabled={saving}>
                        <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleUpdateCompany} disabled={saving}>
                        <Ionicons
                          name={saving ? "hourglass-outline" : "checkmark-circle"}
                          size={22}
                          color={saving ? colors.textMuted : colors.success}
                        />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity onPress={startEditingCompany}>
                      <Ionicons name="create-outline" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-4 mb-4">
              {editingCompany ? (
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgInput, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                </View>
              ) : company.logoUrl ? (
                <Image
                  source={{ uri: company.logoUrl }}
                  style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgInput }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="business" size={24} color={colors.primary} />
                </View>
              )}
              <View className="flex-1">
                {editingCompany ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editCompanyName}
                    onChangeText={setEditCompanyName}
                    editable={!saving}
                    placeholder={t("prf.companyName")}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{company.name}</Text>
                )}
              </View>
            </View>

            <View className="gap-3">
              {isAdmin && company.invitationCode && (
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.invitationCode")}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}>
                    <Text style={{ color: colors.primary, fontSize: 14, fontFamily: "monospace", fontWeight: "600" }}>{company.invitationCode}</Text>
                    <TouchableOpacity onPress={handleCopyInviteCode} style={{ marginLeft: 8 }}>
                      <Ionicons name="copy-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("prf.invitationHint")}</Text>
                </View>
              )}
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.address")}</Text>
                {editingCompany ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editCompanyAddress}
                    onChangeText={setEditCompanyAddress}
                    editable={!saving}
                    placeholder={t("prf.address")}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{company.address}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.companyPhone")}</Text>
                {editingCompany ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editCompanyPhone}
                    onChangeText={setEditCompanyPhone}
                    editable={!saving}
                    keyboardType="phone-pad"
                    placeholder={t("prf.companyPhone")}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{company.phone}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.companyEmail")}</Text>
                {editingCompany ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editCompanyEmail}
                    onChangeText={setEditCompanyEmail}
                    editable={!saving}
                    keyboardType="email-address"
                    placeholder={t("prf.companyEmail")}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{company.email}</Text>
                )}
              </View>
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.taxNumber")}</Text>
                {editingCompany ? (
                  <TextInput
                    style={{ backgroundColor: colors.bgInput, color: colors.text, fontSize: 14, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}
                    value={editCompanyTaxNumber}
                    onChangeText={setEditCompanyTaxNumber}
                    editable={!saving}
                    keyboardType="number-pad"
                    placeholder={t("prf.taxNumber")}
                    placeholderTextColor={colors.textMuted}
                  />
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14 }}>{company.taxNumber || "-"}</Text>
                )}
              </View>
              {editingCompany && (
                <View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.logo")}</Text>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary + "4D", flexDirection: "row", alignItems: "center", gap: 8 }}
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
                      <Ionicons name="image-outline" size={18} color={colors.primary} />
                      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                        {editCompanyLogo ? t("prf.logoSelected") : t("prf.logoSelect")}
                      </Text>
                    </TouchableOpacity>
                    {editCompanyLogo && (
                      <TouchableOpacity onPress={() => setEditCompanyLogo(null)} disabled={saving}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {editCompanyLogo && (
                    <Image source={{ uri: editCompanyLogo }} style={{ width: "100%", height: 64, borderRadius: 8, marginTop: 8, backgroundColor: colors.bgInput }} resizeMode="contain" />
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Hesabı Sil */}
        <TouchableOpacity style={{ marginTop: 24 }} onPress={handleDeleteAccount}>
          <View style={{ backgroundColor: colors.danger + "15", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: "600" }}>{t("prf.deleteAccount")}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Çıkış Yap */}
        <TouchableOpacity style={{ marginTop: 12 }} onPress={handleLogout}>
          <View style={{ backgroundColor: colors.danger + "15", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
            <View className="flex-row items-center gap-2">
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={{ color: colors.danger, fontWeight: "600" }}>{t("prf.logout")}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={signatureModalVisible} transparent animationType="fade" onRequestClose={() => setSignatureModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, width: "91.666%", maxWidth: 448, padding: 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{t("prf.mySignature")}</Text>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
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
      <CustomAlert
        visible={deleteModalVisible}
        type="confirm"
        title={t("prf.deleteAccount")}
        message={t("prf.deleteAccountConfirm")}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDeleteAccount}
        confirmText={t("common.delete")}
        confirmColor="#ef4444"
      />
    </ScrollView>
  );
}

function ProfileSignaturePad({ onSave, onClose, initialSignature }: { onSave: (paths: any[]) => void; onClose: () => void; initialSignature?: string | null }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
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
      Alert.alert(t("common.warning"), t("prf.signRequired"));
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
        style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 8, height: 224, alignItems: "center", justifyContent: "center" }}
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && currentPointsRef.current.length === 0 && (
          <Text style={{ color: colors.textMuted, fontSize: 14, position: "absolute" }}>{t("prf.signHere")}</Text>
        )}
        <Svg width="100%" height="100%" viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}>
          {paths.map((points, i) => (
            <Path key={i} d={pointsToPath(points)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPointsRef.current.length > 0 && (
            <Path d={pointsToPath(currentPointsRef.current)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
      </View>
      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          style={{ flex: 1, height: 40, backgroundColor: colors.bgInput, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
          onPress={handleClear}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>{t("prf.clear")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, height: 40, backgroundColor: colors.primary, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
          onPress={handleSave}
        >
          <Text style={{ color: "white", fontWeight: "500" }}>{t("prf.save")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
