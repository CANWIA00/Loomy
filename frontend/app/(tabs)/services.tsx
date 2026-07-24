import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, PanResponder, ActivityIndicator, Dimensions, Platform, Linking } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import MapSelector from "../../components/MapSelector";
import CustomAlert from "../../components/CustomAlert";
import { generateServicePDFHtml } from "../../components/ServicePDF";
import { profileApi } from "../../api/profile";
import { serviceApi, ServiceRecord } from "../../api/services";
import { customerApi, Customer } from "../../api/customers";
import { WebView } from "react-native-webview";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

const serviceKeys = ["alarm", "fire", "cctv", "ahm", "wiring", "assembly", "commissioning", "docCheck"];
const technicalKeys = ["ahmSignal", "drill", "dovr", "remote", "backup", "cameraClarity", "signalTest", "battery", "wirelessPil", "gprs"];

const initialForm = {
  customerName: "",
  serviceAddress: "",
  startTime: "",
  endTime: "",
  phone: "",
  internalIp: "",
  externalIp: "",
  details: "",
  fee: "",
  technician: "",
  documentDate: "",
  services: [] as string[],
  technical: [] as string[],
};

export default function ServicesScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, locale, lang, setLanguage } = useLanguage();
  const serviceList = serviceKeys.map((k) => t(`svc.list.${k}`));
  const technicalList = technicalKeys.map((k) => t(`svc.tech.${k}`));
  const [form, setForm] = useState({ ...initialForm });
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filter, setFilter] = useState<"all" | "gun" | "ay" | "yil">("all");
  const [showForm, setShowForm] = useState(true);
  const [signatureModal, setSignatureModal] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState<any[]>([]);
  const signaturePathsRef = useRef<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDocument, setFilterDocument] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ companyName: "", address: "", email: "", phone: "", contactPerson: "", contactPhone: "" });
  const [customerSelectModal, setCustomerSelectModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureAlertVisible, setSignatureAlertVisible] = useState(false);
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState<any>(null);
  const [pdfZoom, setPdfZoom] = useState(60);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserName = useRef("");
  const originalFormRef = useRef<typeof initialForm | null>(null);
  const [saveAlertVisible, setSaveAlertVisible] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{ visible: boolean; record: ServiceRecord | null }>({ visible: false, record: null });
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareRecord, setShareRecord] = useState<ServiceRecord | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await serviceApi.getAll(0, 100);
      setRecords(res.data.content);
    } catch {}
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.getAllSimple();
      setCustomerList(res.data);
    } catch {}
  }, []);

  const technicianSignatureRef = useRef<any>(null);
  const companyLogoRef = useRef<string | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
    profileApi.getProfile().then((res) => {
      const name = res.data.user?.name || "";
      const sig = res.data.user?.signature;
      const logo = res.data.company?.logoUrl || null;
      setHasSignature(!!sig);
      if (name) {
        currentUserName.current = name;
        setForm((prev) => ({ ...prev, technician: name }));
      }
      if (sig) {
        try {
          technicianSignatureRef.current = typeof sig === 'string' ? JSON.parse(sig) : sig;
        } catch {}
      }
      if (logo) companyLogoRef.current = logo;
    }).catch(() => {});
  }, [fetchRecords, fetchCustomers]);

  useFocusEffect(
    useCallback(() => {
      profileApi.getProfile().then((res) => {
        const sig = res.data.user?.signature;
        setHasSignature(!!sig);
        if (sig) {
          try {
            technicianSignatureRef.current = typeof sig === 'string' ? JSON.parse(sig) : sig;
          } catch {}
        }
      }).catch(() => {});
    }, [])
  );

  const requireSignature = (): boolean => {
    if (!hasSignature) {
      setSignatureAlertVisible(true);
      return false;
    }
    return true;
  };

  const customerNameRef = useRef<TextInput>(null);
  const serviceAddressRef = useRef<TextInput>(null);
  const startTimeRef = useRef<TextInput>(null);
  const endTimeRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const internalIpRef = useRef<TextInput>(null);
  const externalIpRef = useRef<TextInput>(null);
  const detailsRef = useRef<TextInput>(null);
  const feeRef = useRef<TextInput>(null);
  const technicianRef = useRef<TextInput>(null);
  const documentDateRef = useRef<TextInput>(null);

  const updateForm = (key: keyof typeof initialForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleService = (item: string) =>
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(item)
        ? prev.services.filter((h) => h !== item)
        : [...prev.services, item],
    }));

  const toggleTechnical = (item: string) =>
    setForm((prev) => ({
      ...prev,
      technical: prev.technical.includes(item)
        ? prev.technical.filter((t) => t !== item)
        : [...prev.technical, item],
    }));

  const handleSave = () => {
    if (!requireSignature()) return;
    if (!form.customerName) {
      Alert.alert(t("svc.warning"), t("svc.errorRequired"));
      return;
    }
    setSaveAlertVisible(true);
  };

  const confirmSave = async () => {
    setSaveAlertVisible(false);
    if (isEditing && editingId !== null) {
      setLoading(true);
      try {
        await serviceApi.update(editingId, {
          customer: form.customerName,
          adres: form.serviceAddress,
          baslangic: form.startTime,
          bitis: form.endTime,
          telefon: form.phone,
          dahiliIp: form.internalIp,
          hariciIp: form.externalIp,
          detaylar: form.details,
          ucret: form.fee || "0.00",
          teknisyen: form.technician || "-",
          tarih: form.documentDate || new Date().toLocaleDateString(locale),
          hizmetler: form.services,
          teknik: form.technical,
          service: form.services.join(", ") || "-",
        });
        Alert.alert(t("svc.success"), t("svc.successUpdated"));
        setIsEditing(false);
        setEditingId(null);
        originalFormRef.current = null;
        setForm({ ...initialForm, technician: currentUserName.current || "" });
        fetchRecords();
      } catch {
        Alert.alert(t("svc.error"), t("svc.errorUpdate"));
      } finally {
        setLoading(false);
      }
    } else {
      setSignaturePaths([]);
      signaturePathsRef.current = [];
      setSignatureModal(true);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditingId(null);
    originalFormRef.current = null;
    setForm({
      customerName: "",
      serviceAddress: "",
      startTime: "",
      endTime: "",
      phone: "",
      internalIp: "",
      externalIp: "",
      details: "",
      fee: "",
      technician: currentUserName.current || "",
      documentDate: "",
      services: [],
      technical: [],
    });
    setSelectedCustomerId(null);
  };

  const handleClear = () => {
    if (isEditing && originalFormRef.current) {
      setForm({ ...originalFormRef.current });
    } else {
      setForm({
        customerName: "",
        serviceAddress: "",
        startTime: "",
        endTime: "",
        phone: "",
        internalIp: "",
        externalIp: "",
        details: "",
        fee: "",
        technician: currentUserName.current || "",
        documentDate: "",
        services: [],
        technical: [],
      });
      setSelectedCustomerId(null);
    }
  };

  const handleEdit = (record: ServiceRecord) => {
    const editForm = {
      customerName: record.customer || "",
      serviceAddress: record.adres || "",
      startTime: record.baslangic || "",
      endTime: record.bitis || "",
      phone: record.telefon || "",
      internalIp: record.dahiliIp || "",
      externalIp: record.hariciIp || "",
      details: record.detaylar || "",
      fee: record.ucret || "",
      technician: record.teknisyen || currentUserName.current || "-",
      documentDate: record.tarih || "",
      services: record.hizmetler || [],
      technical: record.teknik || [],
    };
    originalFormRef.current = { ...editForm };
    setForm(editForm);
    setEditingId(record.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSignatureSave = async (paths: any[]) => {
    setLoading(true);
    try {
      await serviceApi.create({
        tarih: form.documentDate || new Date().toLocaleDateString(locale),
        customer: form.customerName,
        customerId: selectedCustomerId || undefined,
        service: form.services.join(", ") || "-",
        adres: form.serviceAddress,
        baslangic: form.startTime,
        bitis: form.endTime,
        telefon: form.phone,
        dahiliIp: form.internalIp,
        hariciIp: form.externalIp,
        detaylar: form.details,
        ucret: form.fee || "0.00",
        teknisyen: form.technician || "-",
        hizmetler: form.services,
        teknik: form.technical,
        imzali: paths.length > 0,
        signature: paths,
        technicianSignature: technicianSignatureRef.current || null,
      });
      Alert.alert(t("svc.success"), t("svc.successCreated"));

      if (paths.length > 0) {
        try {
          const profileRes = await profileApi.getProfile();
          const userName = profileRes.data.user?.name || "";
          const userPhone = profileRes.data.user?.phone || "";
          await profileApi.updateUser({
            name: userName,
            phone: userPhone,
            signature: JSON.stringify(paths),
          });
        } catch {}
      }

      fetchRecords();
    } catch {
      Alert.alert(t("svc.error"), t("svc.errorSave"));
    } finally {
      setLoading(false);
      setForm({ ...initialForm, technician: currentUserName.current || "" });
      setEditingId(null);
      setIsEditing(false);
      setSignatureModal(false);
    }
  };

  const filteredRecords = records.filter((k) => {
    if (filterDate && k.tarih !== filterDate) return false;
    if (filterDocument && !`${k.customer} - ${k.tarih}`.toLowerCase().includes(filterDocument.toLowerCase())) return false;
    if (filterCustomer && !k.customer.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
    if (filter !== "all") {
      const [g, a, y] = k.tarih.split("/").map(Number);
      const bugun = new Date();
      if (filter === "gun" && (g !== bugun.getDate() || a !== bugun.getMonth() + 1 || y !== bugun.getFullYear())) return false;
      if (filter === "ay" && (a !== bugun.getMonth() + 1 || y !== bugun.getFullYear())) return false;
      if (filter === "yil" && y !== bugun.getFullYear()) return false;
    }
    return true;
  });



  const openServicePDF = (record: ServiceRecord) => {
    const pdfData = {
      customerName: record.customer,
      serviceAddress: record.adres,
      startTime: record.baslangic,
      endTime: record.bitis,
      phone: record.telefon,
      internalIp: record.dahiliIp,
      externalIp: record.hariciIp,
      details: record.detaylar,
      fee: record.ucret,
      technician: record.teknisyen,
      documentDate: record.tarih,
      services: record.hizmetler || [],
      technical: record.teknik || [],
      signature: record.signature || null,
      technicianSignature: record.technicianSignature || technicianSignatureRef.current || null,
      companyLogo: companyLogoRef.current,
    };
    setSelectedServiceData(pdfData);
    setPdfPreviewData(pdfData);
    setTimeout(() => handleDownloadPDF(), 100);
  };

  const handleViewService = (record: ServiceRecord) => {
    const pdfData = {
      customerName: record.customer,
      documentDate: record.tarih,
      serviceAddress: record.adres,
      phone: record.telefon,
      services: record.hizmetler || [],
      technical: record.teknik || [],
      fee: record.ucret,
      technician: record.teknisyen,
      startTime: record.baslangic,
      endTime: record.bitis,
      details: record.detaylar,
      signature: record.signature || null,
      technicianSignature: record.technicianSignature || technicianSignatureRef.current || null,
      companyLogo: companyLogoRef.current,
    };
    const html = generateServicePDFHtml(pdfData, t);
    setPdfPreviewHtml(html);
    setPdfPreviewData(pdfData);
    setPdfZoom(60);
    setPdfPreviewVisible(true);
  };

  const handleDownloadPDF = async () => {
    try {
      if (!pdfPreviewData) {
        Alert.alert(t("svc.error"), t("svc.errorPdfData"));
        return;
      }

      if (Platform.OS === "web") {
        const html = generateServicePDFHtml(pdfPreviewData, t);
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert(t("svc.error"), t("svc.errorPopup"));
        }
      } else {
        const html = generateServicePDFHtml(pdfPreviewData, t);
        const { uri } = await Print.printToFileAsync({
          html: html,
          base64: false,
        });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("svc.pdfDialogTitle"),
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.log("PDF hatası:", error);
      Alert.alert(t("svc.error"), t("svc.errorPdfCreate") + (error as any).message);
    }
  };

  const handleDelete = async (record: ServiceRecord) => {
    try {
      await serviceApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      Alert.alert(t("svc.error"), t("svc.errorDelete"));
    }
  };

  const buildShareText = (record: ServiceRecord) => {
    return `${t("svc.shareTitle")}\n\n${t("svc.colCustomer")}: ${record.customer}\n${t("svc.colService")}: ${record.service}\n${t("svc.colDate")}: ${record.tarih}\n${t("svc.adres")}: ${record.adres}\n${t("svc.telefon")}: ${record.telefon}\n${t("svc.detaylar")}: ${record.detaylar}\n${t("svc.ucret")}: ₺${record.ucret}`;
  };

  const shareViaWhatsApp = (record: ServiceRecord) => {
    const phone = record.telefon?.replace(/\s/g, "").replace(/^0/, "90");
    const text = encodeURIComponent(buildShareText(record));
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${text}`).catch(() =>
      Alert.alert(t("svc.error"), t("svc.shareError"))
    );
    setShareModalVisible(false);
  };

  const shareViaEmail = (record: ServiceRecord) => {
    const subject = encodeURIComponent(`${t("svc.shareTitle")} - ${record.customer}`);
    const body = encodeURIComponent(buildShareText(record));
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert(t("svc.error"), t("svc.shareError"))
    );
    setShareModalVisible(false);
  };

  const shareViaSMS = (record: ServiceRecord) => {
    const phone = record.telefon?.replace(/\s/g, "").replace(/^0/, "90");
    const text = encodeURIComponent(buildShareText(record));
    Linking.openURL(`sms:${phone}?body=${text}`).catch(() =>
      Alert.alert(t("svc.error"), t("svc.shareError"))
    );
    setShareModalVisible(false);
  };

  const shareViaSystem = (record: ServiceRecord) => {
    Sharing.shareAsync(buildShareText(record)).catch(() => {});
    setShareModalVisible(false);
  };

  const openShareModal = (record: ServiceRecord) => {
    setShareRecord(record);
    setShareModalVisible(true);
  };

  return (
    <>
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
              {t("svc.title")}
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
        <Text className="text-sm mb-5" style={{ color: colors.textMuted }}>
          {t("svc.subtitle")}
        </Text>

        <TouchableOpacity
          className="flex-row items-center mb-4"
          onPress={() => setShowForm(!showForm)}
        >
          <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
            <Ionicons
              name={showForm ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
            />
          </View>
          <Text className="font-semibold text-base ml-2" style={{ color: colors.text }}>
            {t("svc.newRecord")}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold text-base" style={{ color: colors.text }}>
                {isEditing ? t("svc.editRecord") : t("svc.newRecord")}
              </Text>
              <View className="flex-row items-center gap-2">
                {isEditing && (
                  <TouchableOpacity onPress={handleCancelEditing} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                    <Ionicons name="close-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleClear} className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                  <Ionicons name="refresh-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.selectCustomer")}</Text>
                <TouchableOpacity
                  className="flex-row items-center h-10 border rounded-lg px-3"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                  onPress={() => { setCustomerSearch(""); setCustomerSelectModal(true); }}
                >
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                  <Text className="text-sm ml-2 flex-1" style={{ color: selectedCustomerId ? colors.text : colors.textMuted }}>
                    {selectedCustomerId ? customerList.find((m) => m.id === selectedCustomerId)?.companyName : t("svc.searchCustomer")}
                  </Text>
                  {selectedCustomerId && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCustomerId(null);
                        updateForm("customerName", "");
                        updateForm("serviceAddress", "");
                        updateForm("phone", "");
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {!selectedCustomerId && <Ionicons name="chevron-down" size={16} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <Modal visible={customerSelectModal} transparent animationType="fade" onRequestClose={() => setCustomerSelectModal(false)}>
              <View className="flex-1 justify-center items-center bg-black/60">
                <View className="rounded-2xl w-11/12 max-w-md max-h-[70%] p-4" style={{ backgroundColor: colors.bgCard }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.selectCustomer")}</Text>
                    <View className="flex-row items-center gap-3">
                      {selectedCustomerId && (
                        <TouchableOpacity
                          className="flex-row items-center"
                          onPress={() => {
                            setSelectedCustomerId(null);
                            updateForm("customerName", "");
                            updateForm("serviceAddress", "");
                            updateForm("phone", "");
                            setCustomerSelectModal(false);
                          }}
                        >
                          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
                          <Text className="text-xs font-medium ml-1" style={{ color: colors.danger }}>{t("svc.clearSelection")}</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => setCustomerSelectModal(false)}>
                        <Ionicons name="close" size={24} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    placeholder={t("svc.searchCustomer")}
                    placeholderTextColor={colors.textMuted}
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                  <ScrollView nestedScrollEnabled className="max-h-60" indicatorStyle={colors.indicatorBg}>
                    {customerList
                      .filter((m) => {
                        if (!customerSearch) return true;
                        const q = customerSearch.toLowerCase();
                        return m.companyName.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q);
                      })
                      .map((m, i, arr) => (
                        <TouchableOpacity
                          key={m.id}
                          className="flex-row items-center px-3 py-3"
                          style={i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
                          onPress={() => {
                            setSelectedCustomerId(m.id);
                            setCustomerSelectModal(false);
                            updateForm("customerName", m.companyName);
                            updateForm("serviceAddress", m.address || "");
                            updateForm("phone", m.phone || "");
                          }}
                        >
                          <Ionicons
                            name={selectedCustomerId === m.id ? "radio-button-on" : "radio-button-off"}
                            size={18}
                            color={selectedCustomerId === m.id ? colors.primary : colors.textMuted}
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-sm font-medium" style={{ color: colors.text }}>{m.companyName}</Text>
                            <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{m.contactPerson}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                  <TouchableOpacity
                    className="flex-row items-center justify-center h-10 rounded-lg mt-3"
                    style={{ backgroundColor: colors.primary + '15' }}
                    onPress={() => {
                      setCustomerSelectModal(false);
                      setNewCustomerForm({ companyName: "", address: "", email: "", phone: "", contactPerson: "", contactPhone: "" });
                      setNewCustomerModal(true);
                    }}
                  >
                    <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                    <Text className="text-sm font-medium ml-2" style={{ color: colors.primary }}>{t("svc.addNewCustomer")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.customerName")}</Text>
                <TextInput
                  ref={customerNameRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder={t("svc.customerNamePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={form.customerName}
                  onChangeText={(v) => updateForm("customerName", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.serviceAddress")}</Text>
                <View className="relative flex-1">
                  <TextInput
                    ref={serviceAddressRef}
                    className="w-full h-10 border rounded-lg px-3 pr-10 text-sm"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    placeholder={t("svc.serviceAddressPlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    value={form.serviceAddress}
                    onChangeText={(v) => updateForm("serviceAddress", v)}
                  />
                  <TouchableOpacity
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onPress={() => setMapSelectorVisible(true)}
                  >
                    <Ionicons name="locate-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.startTime")}</Text>
                <TextInput
                  ref={startTimeRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textMuted}
                  value={form.startTime}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, "").slice(0, 4);
                    let formatted = digits;
                    if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2);
                    updateForm("startTime", formatted);
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.endTime")}</Text>
                <TextInput
                  ref={endTimeRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textMuted}
                  value={form.endTime}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, "").slice(0, 4);
                    let formatted = digits;
                    if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2);
                    updateForm("endTime", formatted);
                  }}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.customerPhone")}</Text>
                <TextInput
                  ref={phoneRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.phonePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(v) => updateForm("phone", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.internalIp")}</Text>
                <TextInput
                  ref={internalIpRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder={t("svc.internalIpPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={form.internalIp}
                  onChangeText={(v) => updateForm("internalIp", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.externalIp")}</Text>
                <TextInput
                  ref={externalIpRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder={t("svc.externalIpPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={form.externalIp}
                  onChangeText={(v) => updateForm("externalIp", v)}
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.serviceServices")}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {serviceList.map((h) => (
                  <TouchableOpacity
                    key={h}
                    className="flex-row items-center px-2.5 h-7 rounded-lg border"
                    style={{
                      backgroundColor: form.services.includes(h) ? colors.primary + '33' : colors.bg,
                      borderColor: form.services.includes(h) ? colors.primary : colors.border,
                    }}
                    onPress={() => toggleService(h)}
                  >
                    {form.services.includes(h) && (
                      <Ionicons name="checkmark" size={12} color={colors.primary} />
                    )}
                    <Text
                      className="text-[11px] ml-1"
                      style={{ color: form.services.includes(h) ? colors.primary : colors.textSecondary }}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-medium mb-1.5" style={{ color: colors.textSecondary }}>{t("svc.technicalServices")}</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {technicalList.map((ti) => (
                  <TouchableOpacity
                    key={ti}
                    className="flex-row items-center px-2.5 h-7 rounded-lg border"
                    style={{
                      backgroundColor: form.technical.includes(ti) ? colors.primary + '33' : colors.bg,
                      borderColor: form.technical.includes(ti) ? colors.primary : colors.border,
                    }}
                    onPress={() => toggleTechnical(ti)}
                  >
                    {form.technical.includes(ti) && (
                      <Ionicons name="checkmark" size={12} color={colors.primary} />
                    )}
                    <Text
                      className="text-[11px] ml-1"
                      style={{ color: form.technical.includes(ti) ? colors.primary : colors.textSecondary }}
                    >
                      {ti}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.details")}</Text>
              <TextInput
                ref={detailsRef}
                className="w-full min-h-[64px] border rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.detailsPlaceholder")}
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                value={form.details}
                onChangeText={(v) => updateForm("details", v)}
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.serviceFee")}</Text>
                <TextInput
                  ref={feeRef}
                  className="w-full h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={form.fee}
                  onChangeText={(v) => updateForm("fee", v.replace(/[^0-9.]/g, ""))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.technician")}</Text>
                <View className="w-full h-10 border rounded-lg px-3 items-center justify-center flex-row" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
                  <Ionicons name="person-outline" size={14} color={colors.primary} />
                  <Text className="text-sm ml-1.5" style={{ color: colors.text }}>{form.technician || "-"}</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.documentDate")}</Text>
                <View className="flex-row items-center">
                  <TextInput
                    ref={documentDateRef}
                    className="flex-1 h-10 border rounded-lg px-3 text-sm"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    placeholder="GG/AA/YYYY"
                    placeholderTextColor={colors.textMuted}
                    value={form.documentDate}
                    onChangeText={(v) => {
                      const digits = v.replace(/\D/g, "").slice(0, 8);
                      let formatted = digits;
                      if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
                      if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
                      updateForm("documentDate", formatted);
                    }}
                  />
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => {
                      const now = new Date();
                      const tarih = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
                      updateForm("documentDate", tarih);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-full h-10 rounded-lg items-center justify-center mt-1"
              style={{ backgroundColor: colors.primary }}
              onPress={handleSave}
            >
              <Text className="font-semibold text-sm" style={{ color: "white" }}>{isEditing ? t("svc.update") : t("common.save")}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={newCustomerModal} transparent animationType="fade" onRequestClose={() => setNewCustomerModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.newCustomer")}</Text>
                <TouchableOpacity onPress={() => setNewCustomerModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.companyName")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.companyNamePlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.companyName}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, companyName: v }))}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.address")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.serviceAddressPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.address}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, address: v }))}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.email")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.email")}
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={newCustomerForm.email}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, email: v }))}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.phone")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.phonePlaceholder")}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newCustomerForm.phone}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, phone: v }))}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.contactPerson")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.contactPersonPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCustomerForm.contactPerson}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, contactPerson: v }))}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("svc.contactPhone")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-4"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("svc.contactPhonePlaceholder")}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newCustomerForm.contactPhone}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, contactPhone: v }))}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => setNewCustomerModal(false)}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => {
                    if (!newCustomerForm.companyName) {
                      Alert.alert(t("svc.warning"), t("svc.errorCompanyRequired"));
                      return;
                    }
                    setLoading(true);
                    customerApi.create(newCustomerForm).then((res) => {
                      const yeni = res.data;
                      setCustomerList((prev) => [...prev, yeni]);
                      setSelectedCustomerId(yeni.id);
                      updateForm("customerName", yeni.companyName);
                      updateForm("serviceAddress", yeni.address || "");
                      updateForm("phone", yeni.phone || "");
                      setNewCustomerModal(false);
                    }).catch(() => {
                      Alert.alert(t("svc.error"), t("svc.errorCustomerAdd"));
                    }).finally(() => setLoading(false));
                  }}
                >
                  <Text className="font-medium" style={{ color: "white" }}>{t("common.save")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={signatureModal} transparent animationType="fade" onRequestClose={() => setSignatureModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.customerSignature")}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSignatureModal(false);
                    setSignaturePaths([]);
                    signaturePathsRef.current = [];
                  }}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <SignaturePad
                onSave={handleSignatureSave}
                onClose={() => {
                  setSignatureModal(false);
                  setSignaturePaths([]);
                  signaturePathsRef.current = [];
                }}
              />
            </View>
          </View>
        </Modal>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("svc.allRecords")}</Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{filteredRecords.length} {t("svc.showing")}</Text>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-4 items-center">
          {(["all", "gun", "ay", "yil"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              className={`px-4 h-8 rounded-lg items-center justify-center ${filter === f ? "" : "border"}`}
              style={{
                backgroundColor: filter === f ? colors.primary : colors.bgCard,
                borderColor: colors.border,
              }}
              onPress={() => setFilter(filter === f ? "all" : f)}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: filter === f ? "white" : colors.textSecondary }}
              >
                {f === "all" ? t("svc.filterAll") : f === "gun" ? t("svc.filterDay") : f === "ay" ? t("svc.filterMonth") : t("svc.filterYear")}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput
            className="h-8 border rounded-lg px-2 text-xs w-28"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("svc.filterDate")}
            placeholderTextColor={colors.textMuted}
            value={filterDate}
            onChangeText={setFilterDate}
          />
          <TextInput
            className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("svc.filterDocName")}
            placeholderTextColor={colors.textMuted}
            value={filterDocument}
            onChangeText={setFilterDocument}
          />
          <TextInput
            className="h-8 border rounded-lg px-2 text-xs flex-1 min-w-[120px]"
            style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
            placeholder={t("svc.filterCustomer")}
            placeholderTextColor={colors.textMuted}
            value={filterCustomer}
            onChangeText={setFilterCustomer}
          />
          <TouchableOpacity
            onPress={() => {
              setFilterDate("");
              setFilterDocument("");
              setFilterCustomer("");
              setFilter("all");
            }}
          >
            <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
          <View className="flex-row px-3 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
            {[t("svc.colDate"), t("svc.colDocName"), t("svc.colCustomer"), t("svc.colService"), ""].map(
              (col) => (
                <Text
                  key={col}
                  className={`text-xs font-semibold ${
                    col === t("svc.colDate")
                      ? "w-24"
                      : col === t("svc.colDocName")
                        ? "flex-1"
                        : col === t("svc.colCustomer")
                          ? "flex-1"
                          : col === t("svc.colService")
                            ? "flex-1"
                            : "text-right"
                  }`}
                  style={{ color: colors.textSecondary }}
                >
                  {col}
                </Text>
              ),
            )}
          </View>

          <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle={colors.indicatorBg}>
            {filteredRecords.map((k, i) => (
              <View
                key={k.id}
                className="flex-row items-center px-3 py-3 border-b"
                style={{ borderColor: colors.borderAlt }}
              >
                <Text className="w-24 text-xs" style={{ color: colors.textSecondary }}>{k.tarih}</Text>
                <Text className="flex-1 text-sm font-medium" style={{ color: colors.text }} numberOfLines={1}>
                  {k.customer} - {k.tarih}
                </Text>
                <Text className="flex-1 text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {k.customer}
                </Text>
                <Text className="flex-1 text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                  {k.service}
                </Text>
                <View className="flex-row items-center justify-end gap-2.5">
                  <TouchableOpacity onPress={() => openShareModal(k)}>
                    <Ionicons name="share-social-outline" size={20} color={colors.purple} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteAlert({ visible: true, record: k })}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleViewService(k)}>
                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(k)}>
                    <Ionicons name="create-outline" size={20} color={colors.teal} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openServicePDF(k)}>
                    <Ionicons name="download-outline" size={20} color={colors.warning} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>

    <MapSelector
      visible={mapSelectorVisible}
      onSelect={(adres) => {
        updateForm("serviceAddress", adres);
        setMapSelectorVisible(false);
      }}
      onClose={() => setMapSelectorVisible(false)}
    />

    <CustomAlert
      visible={saveAlertVisible}
      type="confirm"
      title={isEditing ? t("svc.update") : t("common.save")}
      message={isEditing ? t("svc.confirmUpdate") : t("svc.confirmSave")}
      onClose={() => setSaveAlertVisible(false)}
      onConfirm={confirmSave}
      confirmText={t("common.confirm")}
    />

    <CustomAlert
      visible={deleteAlert.visible}
      type="confirm"
      title={t("common.delete")}
      message={t("svc.confirmDelete", { name: deleteAlert.record?.customer || "" })}
      onClose={() => setDeleteAlert({ visible: false, record: null })}
      onConfirm={() => {
        if (deleteAlert.record) handleDelete(deleteAlert.record);
      }}
      confirmText={t("common.delete")}
      confirmColor={colors.danger}
    />

    <Modal visible={signatureAlertVisible} transparent animationType="fade" onRequestClose={() => setSignatureAlertVisible(false)}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
              <Ionicons name="warning-outline" size={28} color={colors.primary} />
            </View>
            <TouchableOpacity onPress={() => setSignatureAlertVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>{t("svc.signatureRequired")}</Text>
          <Text className="text-sm mb-6 leading-5" style={{ color: colors.textSecondary }}>
            {t("svc.noSignature")}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
              onPress={() => setSignatureAlertVisible(false)}
            >
              <Text style={{ color: colors.textSecondary }} className="font-semibold text-base">{t("svc.cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => {
                setSignatureAlertVisible(false);
                router.push("/(tabs)/profil");
              }}
            >
              <Text style={{ color: "white" }} className="font-semibold text-base">{t("svc.goToProfile")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={shareModalVisible} transparent animationType="fade" onRequestClose={() => setShareModalVisible(false)}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ color: colors.text }} className="text-lg font-bold">{t("svc.share")}</Text>
            <TouchableOpacity onPress={() => setShareModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {shareRecord && (
            <View className="mb-5 p-3 rounded-xl" style={{ backgroundColor: colors.bgInput }}>
              <Text style={{ color: colors.text }} className="text-sm font-medium">{shareRecord.customer}</Text>
              <Text style={{ color: colors.textMuted }} className="text-xs mt-1">{shareRecord.service} · {shareRecord.tarih}</Text>
            </View>
          )}
          <View className="gap-3">
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: "#25D36615", borderColor: "#25D36640", borderWidth: 1 }}
              onPress={() => shareRecord && shareViaWhatsApp(shareRecord)}
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={{ color: colors.text }} className="text-sm font-medium">WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.primary + "15", borderColor: colors.primary + "40", borderWidth: 1 }}
              onPress={() => shareRecord && shareViaEmail(shareRecord)}
            >
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">E-posta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.success + "15", borderColor: colors.success + "40", borderWidth: 1 }}
              onPress={() => shareRecord && shareViaSMS(shareRecord)}
            >
              <Ionicons name="chatbubble-outline" size={22} color={colors.success} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">SMS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-3 p-4 rounded-xl"
              style={{ backgroundColor: colors.bgInput, borderColor: colors.border, borderWidth: 1 }}
              onPress={() => shareRecord && shareViaSystem(shareRecord)}
            >
              <Ionicons name="ellipsis-horizontal-outline" size={22} color={colors.textSecondary} />
              <Text style={{ color: colors.text }} className="text-sm font-medium">{t("svc.shareOther")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={pdfModalVisible} animationType="slide" onRequestClose={() => setPdfModalVisible(false)}>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.serviceForm")}</Text>
          <TouchableOpacity
            className="h-9 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            onPress={() => setPdfModalVisible(false)}
          >
            <Text className="text-sm font-medium" style={{ color: "white" }}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
        {selectedServiceData && (
          <View className="flex-1 p-4">
            <View className="rounded-2xl p-5 mb-4" style={{ backgroundColor: colors.bgCard }}>
              <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>{t("svc.serviceInfo")}</Text>
              <View className="gap-3">
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.customerName") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.customerName}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.filterDate") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.documentDate}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.address") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.serviceAddress || t("svc.notSpecified")}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.phone") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.phone || t("svc.notSpecified")}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.services") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.services.join(", ") || "-"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.technical") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.technical.join(", ") || "-"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.feeLabel")}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>₺{selectedServiceData.fee || "0.00"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm w-28" style={{ color: colors.textSecondary }}>{t("svc.technician") + ":"}</Text>
                  <Text className="text-sm flex-1" style={{ color: colors.text }}>{selectedServiceData.technician || t("svc.notSpecified")}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              className="w-full h-12 rounded-xl items-center justify-center flex-row gap-2"
              style={{ backgroundColor: colors.primary }}
              onPress={() => Alert.alert(t("common.info"), t("svc.infoPdf"))}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <Text className="font-semibold" style={{ color: "white" }}>{t("svc.downloadPdf")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>

    <Modal visible={pdfPreviewVisible} animationType="slide" onRequestClose={() => setPdfPreviewVisible(false)}>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.serviceForm")}</Text>
          <TouchableOpacity
            className="h-9 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={() => setPdfPreviewVisible(false)}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text }}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          {Platform.OS === "web" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#e5e5e5",
                overflow: "auto",
              } as any}
            >
              <div
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  backgroundColor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  padding: "15mm",
                  borderRadius: 4,
                  transform: `scale(${pdfZoom / 100})`,
                  transformOrigin: "center center",
                  flexShrink: 0,
                } as any}
                dangerouslySetInnerHTML={{ __html: pdfPreviewHtml }}
              />
            </div>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: "#e5e5e5" }}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 12,
              }}
              showsVerticalScrollIndicator={true}
            >
              <View
                style={{
                  width: Dimensions.get("window").width - 24,
                  minHeight: (Dimensions.get("window").width - 24) * 1.414,
                  backgroundColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                  borderRadius: 4,
                  padding: 24,
                }}
              >
                <WebView
                  source={{ html: pdfPreviewHtml }}
                  style={{
                    width: "100%",
                    height: Math.max((Dimensions.get("window").width - 24) * 1.414, 700),
                    backgroundColor: "white",
                  }}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          )}
        </View>
        <View className="px-4 py-3 border-t" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center justify-center gap-4 mb-3">
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.max(20, z - 10))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold min-w-[50px] text-center" style={{ color: colors.text }}>
              %{pdfZoom}
            </Text>
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.min(150, z + 10))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full h-12 rounded-xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: colors.primary }}
            onPress={handleDownloadPDF}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="font-semibold" style={{ color: "white" }}>{t("svc.downloadPdf")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    </>
  );
}

function SignaturePad({ onSave, onClose }: { onSave: (paths: any[]) => void; onClose: () => void }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [paths, setPaths] = useState<any[][]>([]);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });
  const currentPointsRef = useRef<any[]>([]);
  const allPathsRef = useRef<any[][]>([]);
  const [, forceRender] = useState(0);

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
      Alert.alert(t("svc.warning"), t("svc.signatureWarning"));
      return;
    }
    onSave(allPathsRef.current);
  };

  return (
    <>
      <View
        className="border rounded-lg h-56 items-center justify-center"
        style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && currentPointsRef.current.length === 0 && (
          <Text className="text-sm absolute" style={{ color: colors.textMuted }}>{t("svc.signHere")}</Text>
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
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={handleClear}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.clear")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
        >
          <Text className="font-medium" style={{ color: "white" }}>{t("common.confirm")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
