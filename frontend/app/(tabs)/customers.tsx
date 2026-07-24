import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, Linking } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { customerApi, Customer } from "../../api/customers";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import MapSelector from "../../components/MapSelector";
import CustomAlert from "../../components/CustomAlert";

export default function CustomersScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
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
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm">("success");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);

  function showAlert(type: "success" | "error" | "confirm", title: string, message: string, onConfirm?: () => void) {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOnConfirm(() => onConfirm);
    setAlertVisible(true);
  }

  const fetchCustomers = useCallback(async (pageNum: number = 0, searchQuery?: string) => {
    setLoading(true);
    try {
      const response = searchQuery
        ? await customerApi.search(searchQuery, pageNum, size)
        : await customerApi.getAll(pageNum, size);
      setCustomers(response.data.content.sort((a: any, b: any) => a.companyName.localeCompare(b.companyName, "tr")));
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
      setPage(response.data.number);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [size, t]);

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
      showAlert("error", t("common.error"), t("cst.errorRequired"));
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
        showAlert("success", t("common.success"), t("cst.successUpdate"));
      } else {
        await customerApi.create(data);
        showAlert("success", t("common.success"), t("cst.successAdd"));
      }
      resetForm();
      setFormOpen(false);
      fetchCustomers(page, search.trim() || undefined);
    } catch (error: any) {
      showAlert("error", t("common.error"), t("cst.errorSave"));
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    showAlert("confirm", t("cst.delete"), t("cst.confirmDelete"), async () => {
      setLoading(true);
      try {
        await customerApi.delete(id);
        showAlert("success", t("common.success"), t("cst.successDelete"));
        fetchCustomers(page, search.trim() || undefined);
      } catch (error: any) {
        showAlert("error", t("common.error"), t("cst.errorDelete"));
      } finally {
        setLoading(false);
      }
    });
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
      showAlert("error", t("common.error"), t("cst.errorEdit"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
              {t("cst.title")}
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
        <Text className="text-sm mb-4" style={{ color: colors.textMuted }}>
          {t("cst.subtitle")}
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (formOpen) {
              resetForm();
            }
            setFormOpen(!formOpen);
          }}
          className="flex-row items-center justify-between rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.bgCard }}
        >
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {editingCustomer ? t("cst.editCustomer") : t("cst.newCustomer")}
          </Text>
          <Ionicons name={formOpen ? "chevron-up" : "chevron-down"} size={22} color={colors.primary} />
        </TouchableOpacity>

        {formOpen && (
          <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.bgCard }}>
            {editingCustomer && (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>{t("cst.editCustomer")}</Text>
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                >
                  <Ionicons name="close" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.companyName")}
              placeholderTextColor={colors.textMuted}
              value={newCompany}
              onChangeText={setNewCompany}
            />
            <View className="relative mb-3">
              <TextInput
                className="rounded-lg px-4 py-3 text-sm pr-10"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
                placeholder={t("cst.address")}
                placeholderTextColor={colors.textMuted}
                value={newAddress}
                onChangeText={setNewAddress}
              />
              <TouchableOpacity
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onPress={() => setMapSelectorVisible(true)}
              >
                <Ionicons name="locate-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.email")}
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.phone")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newPhone}
              onChangeText={(v) => setNewPhone(v.replace(/[^0-9]/g, ""))}
            />
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-3"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.contactPerson")}
              placeholderTextColor={colors.textMuted}
              value={newContact}
              onChangeText={setNewContact}
            />
            <TextInput
              className="rounded-lg px-4 py-3 text-sm mb-4"
              style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              placeholder={t("cst.contactPhone")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={newContactPhone}
              onChangeText={(v) => setNewContactPhone(v.replace(/[^0-9]/g, ""))}
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              className="rounded-lg py-3 items-center"
              style={{ backgroundColor: colors.primary }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-sm font-bold" style={{ color: "white" }}>
                  {editingCustomer ? t("svc.update") : t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("cst.allCustomers")}</Text>
          <Text className="text-sm" style={{ color: colors.textMuted }}>{totalElements} {t("cst.records")}</Text>
        </View>

        <TextInput
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, color: colors.text }}
          placeholder={t("cst.search")}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {loading && customers.length === 0 ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm mt-3" style={{ color: colors.textMuted }}>{t("cst.loading")}</Text>
          </View>
        ) : (
          <>
            {customers.map((c) => (
              <TouchableOpacity
                key={c.id}
                className="rounded-2xl p-4 mb-3"
                style={{ backgroundColor: colors.bgCard }}
                onPress={() => setSelectedCustomer(c)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                    <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                      {c.companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-bold" style={{ color: colors.text }}>{c.companyName}</Text>
                    <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{c.contactPerson}</Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{c.phone}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleEdit(c.id)}
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.primary + '15' }}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(c.id)}
                      className="w-9 h-9 rounded-xl items-center justify-center"
                      style={{ backgroundColor: colors.danger + '15' }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {customers.length === 0 && (
              <View className="items-center py-10">
                <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noCustomers")}</Text>
              </View>
            )}

            {totalPages > 1 && (
              <View className="flex-row items-center justify-center gap-3 mt-4">
                <TouchableOpacity
                  disabled={page === 0}
                  onPress={() => fetchCustomers(page - 1, search.trim() || undefined)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: page === 0 ? colors.bgCard : colors.primary, opacity: page === 0 ? 0.5 : 1 }}
                >
                  <Text className="text-sm" style={{ color: "white" }}>{t("cst.previous")}</Text>
                </TouchableOpacity>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {page + 1} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={page >= totalPages - 1}
                  onPress={() => fetchCustomers(page + 1, search.trim() || undefined)}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: page >= totalPages - 1 ? colors.bgCard : colors.primary, opacity: page >= totalPages - 1 ? 0.5 : 1 }}
                >
                  <Text className="text-sm" style={{ color: "white" }}>{t("cst.next")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      <MapSelector
        visible={mapSelectorVisible}
        onSelect={(adres) => {
          setNewAddress(adres);
          setMapSelectorVisible(false);
        }}
        onClose={() => setMapSelectorVisible(false)}
      />

      <Modal visible={!!selectedCustomer} transparent animationType="fade" onRequestClose={() => setSelectedCustomer(null)}>
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View className="rounded-2xl p-6 w-11/12 max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("cst.customerInfo")}</Text>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedCustomer && (
              <View className="gap-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
                    <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                      {selectedCustomer.companyName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-base font-bold flex-1" style={{ color: colors.text }}>{selectedCustomer.companyName}</Text>
                </View>

                <View className="gap-3">
                  <View className="flex-row">
                    <Ionicons name="person-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                    <View className="flex-1 ml-1">
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.contactPerson")}</Text>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedCustomer.contactPerson || "-"}</Text>
                    </View>
                  </View>

                  <TouchableOpacity className="flex-row" onPress={() => selectedCustomer.phone && Linking.openURL(`tel:${selectedCustomer.phone}`)}>
                    <Ionicons name="call-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                    <View className="flex-1 ml-1">
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.phone")}</Text>
                      <Text className="text-sm font-medium" style={{ color: selectedCustomer.phone ? colors.primary : colors.text }}>{selectedCustomer.phone || "-"}</Text>
                    </View>
                    {selectedCustomer.phone && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row" onPress={() => selectedCustomer.contactPhone && Linking.openURL(`tel:${selectedCustomer.contactPhone}`)}>
                    <Ionicons name="call-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                    <View className="flex-1 ml-1">
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.contactPhone")}</Text>
                      <Text className="text-sm font-medium" style={{ color: selectedCustomer.contactPhone ? colors.primary : colors.text }}>{selectedCustomer.contactPhone || "-"}</Text>
                    </View>
                    {selectedCustomer.contactPhone && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row" onPress={() => {
                    if (selectedCustomer.email) {
                      Linking.openURL(`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedCustomer.email}`);
                    }
                  }}>
                    <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                    <View className="flex-1 ml-1">
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.email")}</Text>
                      <Text className="text-sm font-medium" style={{ color: selectedCustomer.email ? colors.primary : colors.text }}>{selectedCustomer.email || "-"}</Text>
                    </View>
                    {selectedCustomer.email && <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginTop: 2 }} />}
                  </TouchableOpacity>

                  <View className="flex-row">
                    <Ionicons name="location-outline" size={16} color={colors.textMuted} style={{ width: 24, marginTop: 2 }} />
                    <View className="flex-1 ml-1">
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.address")}</Text>
                      <Text className="text-sm font-medium" style={{ color: colors.text }}>{selectedCustomer.address || "-"}</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 h-11 rounded-lg items-center justify-center flex-row gap-2"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => {
                      setSelectedCustomer(null);
                      handleEdit(selectedCustomer.id);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="white" />
                    <Text className="text-sm font-semibold" style={{ color: "white" }}>{t("cst.edit")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 h-11 rounded-lg items-center justify-center flex-row gap-2"
                    style={{ backgroundColor: colors.bgInput }}
                    onPress={() => setSelectedCustomer(null)}
                  >
                    <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>{t("cst.close")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => { setAlertVisible(false); setAlertOnConfirm(undefined); }}
        onConfirm={alertOnConfirm}
        confirmText={alertType === "confirm" ? t("cst.delete") : undefined}
        confirmColor={alertType === "confirm" ? colors.danger : undefined}
      />
    </ScrollView>
  );
}
