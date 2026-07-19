import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, PanResponder, ActivityIndicator, Dimensions, Platform } from "react-native";
import { router } from "expo-router";
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

const serviceList = [
  "Alarm", "Yangın", "CCTV", "AHM Bağlantısı", "Kablolama",
  "Montaj", "Devreye Alma Eğitimi", "Belge Kontrolü",
];

const technicalList = [
  "AHM Sinyal Kontrolü", "Eğitim ve Tatbikat", "DOVR Kayıt Kontrol",
  "Uzak Erişim", "Kayıt ve Yedekleme Eğitimi", "Kameralara Netlik ve Yön Ayarı",
  "Test Sinyal Programlama", "Akü Ömrü Kontrolü",
  "Kablosuz Dedektör Pil Kontrolü", "GPRS Bağlantısı",
];

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
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserName = useRef("");
  const originalFormRef = useRef<typeof initialForm | null>(null);
  const [saveAlertVisible, setSaveAlertVisible] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{ visible: boolean; record: ServiceRecord | null }>({ visible: false, record: null });

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
    if (!form.customerName) {
      Alert.alert("Uyarı", "Müşteri adı zorunludur.");
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
          tarih: form.documentDate || new Date().toLocaleDateString("tr-TR"),
          hizmetler: form.services,
          teknik: form.technical,
          service: form.services.join(", ") || "-",
        });
        Alert.alert("Başarılı", "Servis kaydı güncellendi.");
        setIsEditing(false);
        setEditingId(null);
        originalFormRef.current = null;
        setForm({ ...initialForm });
        fetchRecords();
      } catch {
        Alert.alert("Hata", "Güncelleme sırasında bir sorun oluştu.");
      } finally {
        setLoading(false);
      }
    } else {
      setSignaturePaths([]);
      signaturePathsRef.current = [];
      setSignatureModal(true);
    }
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
        tarih: form.documentDate || new Date().toLocaleDateString("tr-TR"),
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
      Alert.alert("Başarılı", "Servis kaydı oluşturuldu.");

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
      Alert.alert("Hata", "Kayıt sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
      setForm({ ...initialForm });
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
    const html = generateServicePDFHtml(pdfData);
    setPdfPreviewHtml(html);
    setPdfPreviewData(pdfData);
    setPdfPreviewVisible(true);
  };

  const handleDownloadPDF = async () => {
    try {
      if (!pdfPreviewData) {
        Alert.alert("Hata", "PDF verisi bulunamadı.");
        return;
      }

      if (Platform.OS === "web") {
        const html = generateServicePDFHtml(pdfPreviewData);
        const printWindow = window.open("", "_blank", "width=800,height=600");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          Alert.alert("Hata", "Yeni pencere açılamadı. Lütfen pop-up engelleyiciyi kontrol edin.");
        }
      } else {
        const html = generateServicePDFHtml(pdfPreviewData);
        const { uri } = await Print.printToFileAsync({
          html: html,
          base64: false,
        });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Servis Formu.pdf",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.log("PDF hatası:", error);
      Alert.alert("Hata", "PDF oluşturulurken bir sorun oluştu: " + (error as any).message);
    }
  };

  const handleDelete = async (record: ServiceRecord) => {
    try {
      await serviceApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      Alert.alert("Hata", "Servis kaydı silinemedi.");
    }
  };

  return (
    <>
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white tracking-tight">
              Servis Yönetimi
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mb-5">
          Servis kayıtlarını oluşturun ve yönetin
        </Text>

        <TouchableOpacity
          className="flex-row items-center mb-4"
          onPress={() => setShowForm(!showForm)}
        >
          <View className="w-6 h-6 bg-[#3B82F6]/10 rounded-lg items-center justify-center">
            <Ionicons
              name={showForm ? "chevron-up" : "chevron-down"}
              size={16}
              color="#3B82F6"
            />
          </View>
          <Text className="text-white font-semibold text-base ml-2">
            Yeni Servis Kaydı
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] p-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-base">
                {isEditing ? "Servis Kaydını Düzenle" : "Yeni Servis Kaydı"}
              </Text>
              <TouchableOpacity onPress={handleClear} className="w-7 h-7 bg-[#2A2A2A] rounded-full items-center justify-center">
                <Ionicons name="refresh-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Müşteri Seç</Text>
                <TouchableOpacity
                  className="flex-row items-center h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3"
                  onPress={() => { setCustomerSearch(""); setCustomerSelectModal(true); }}
                >
                  <Ionicons name="person-outline" size={18} color="#666" />
                  <Text className={`text-sm ml-2 flex-1 ${selectedCustomerId ? "text-white" : "text-gray-500"}`}>
                    {selectedCustomerId ? customerList.find((m) => m.id === selectedCustomerId)?.companyName : "Müşteri seçin..."}
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
                      <Ionicons name="close-circle" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  {!selectedCustomerId && <Ionicons name="chevron-down" size={16} color="#666" />}
                </TouchableOpacity>
              </View>
            </View>

            <Modal visible={customerSelectModal} transparent animationType="fade" onRequestClose={() => setCustomerSelectModal(false)}>
              <View className="flex-1 justify-center items-center bg-black/60">
                <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md max-h-[70%] p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-bold">Müşteri Seç</Text>
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
                          <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                          <Text className="text-[#EF4444] text-xs font-medium ml-1">Seçimi Temizle</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => setCustomerSelectModal(false)}>
                        <Ionicons name="close" size={24} color="#555" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TextInput
                    className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                    placeholder="Müşteri ara..."
                    placeholderTextColor="#555"
                    value={customerSearch}
                    onChangeText={setCustomerSearch}
                  />
                  <ScrollView nestedScrollEnabled className="max-h-60" indicatorStyle="white">
                    {customerList
                      .filter((m) => {
                        if (!customerSearch) return true;
                        const q = customerSearch.toLowerCase();
                        return m.companyName.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q);
                      })
                      .map((m, i, arr) => (
                        <TouchableOpacity
                          key={m.id}
                          className={`flex-row items-center px-3 py-3 ${i < arr.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}
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
                            color={selectedCustomerId === m.id ? "#3B82F6" : "#555"}
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-white text-sm font-medium">{m.companyName}</Text>
                            <Text className="text-gray-500 text-xs mt-0.5">{m.contactPerson}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                  <TouchableOpacity
                    className="flex-row items-center justify-center h-10 bg-[#3B82F6]/10 rounded-lg mt-3"
                    onPress={() => {
                      setCustomerSelectModal(false);
                      setNewCustomerForm({ companyName: "", address: "", email: "", phone: "", contactPerson: "", contactPhone: "" });
                      setNewCustomerModal(true);
                    }}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#3B82F6" />
                    <Text className="text-[#3B82F6] text-sm font-medium ml-2">Yeni Müşteri Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Müşteri Adı</Text>
                <TextInput
                  ref={customerNameRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Müşteri adını girin"
                  placeholderTextColor="#555"
                  value={form.customerName}
                  onChangeText={(v) => updateForm("customerName", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Servis Adresi</Text>
                <View className="relative flex-1">
                  <TextInput
                    ref={serviceAddressRef}
                    className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 pr-10 text-white text-sm"
                    placeholder="Servis adresini girin veya seçin"
                    placeholderTextColor="#555"
                    value={form.serviceAddress}
                    onChangeText={(v) => updateForm("serviceAddress", v)}
                  />
                  <TouchableOpacity
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onPress={() => setMapSelectorVisible(true)}
                  >
                    <Ionicons name="locate-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Başlangıç</Text>
                <TextInput
                  ref={startTimeRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="HH:MM"
                  placeholderTextColor="#555"
                  value={form.startTime}
                  onChangeText={(v) => updateForm("startTime", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Bitiş</Text>
                <TextInput
                  ref={endTimeRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="HH:MM"
                  placeholderTextColor="#555"
                  value={form.endTime}
                  onChangeText={(v) => updateForm("endTime", v)}
                />
              </View>
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Müşteri Telefonu</Text>
                <TextInput
                  ref={phoneRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Telefon numarası"
                  placeholderTextColor="#555"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(v) => updateForm("phone", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Dahili IP</Text>
                <TextInput
                  ref={internalIpRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Dahili IP"
                  placeholderTextColor="#555"
                  value={form.internalIp}
                  onChangeText={(v) => updateForm("internalIp", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Harici IP</Text>
                <TextInput
                  ref={externalIpRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Harici IP"
                  placeholderTextColor="#555"
                  value={form.externalIp}
                  onChangeText={(v) => updateForm("externalIp", v)}
                />
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-xs font-medium mb-1.5">Servis Hizmetleri</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {serviceList.map((h) => (
                  <TouchableOpacity
                    key={h}
                    className={`flex-row items-center px-2.5 h-7 rounded-lg border ${
                      form.services.includes(h)
                        ? "bg-[#3B82F6]/20 border-[#3B82F6]"
                        : "bg-[#0A0A0A] border-[#2A2A2A]"
                    }`}
                    onPress={() => toggleService(h)}
                  >
                    {form.services.includes(h) && (
                      <Ionicons name="checkmark" size={12} color="#3B82F6" />
                    )}
                    <Text
                      className={`text-[11px] ml-1 ${
                        form.services.includes(h) ? "text-[#3B82F6]" : "text-gray-400"
                      }`}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-xs font-medium mb-1.5">Teknik Hizmetler</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {technicalList.map((t) => (
                  <TouchableOpacity
                    key={t}
                    className={`flex-row items-center px-2.5 h-7 rounded-lg border ${
                      form.technical.includes(t)
                        ? "bg-[#3B82F6]/20 border-[#3B82F6]"
                        : "bg-[#0A0A0A] border-[#2A2A2A]"
                    }`}
                    onPress={() => toggleTechnical(t)}
                  >
                    {form.technical.includes(t) && (
                      <Ionicons name="checkmark" size={12} color="#3B82F6" />
                    )}
                    <Text
                      className={`text-[11px] ml-1 ${
                        form.technical.includes(t) ? "text-[#3B82F6]" : "text-gray-400"
                      }`}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-xs font-medium mb-1">Detaylar</Text>
              <TextInput
                ref={detailsRef}
                className="w-full min-h-[64px] bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm"
                placeholder="Ek detaylar veya notlar"
                placeholderTextColor="#555"
                multiline
                textAlignVertical="top"
                value={form.details}
                onChangeText={(v) => updateForm("details", v)}
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Servis Ücreti (₺)</Text>
                <TextInput
                  ref={feeRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="0.00"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                  value={form.fee}
                  onChangeText={(v) => updateForm("fee", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Teknisyen</Text>
                <View className="w-full h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 items-center justify-center flex-row">
                  <Ionicons name="person-outline" size={14} color="#3B82F6" />
                  <Text className="text-white text-sm ml-1.5">{form.technician || "-"}</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Belge Tarihi</Text>
                <View className="flex-row items-center">
                  <TextInput
                    ref={documentDateRef}
                    className="flex-1 h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                    placeholder="GG/AA/YYYY"
                    placeholderTextColor="#555"
                    value={form.documentDate}
                    onChangeText={(v) => updateForm("documentDate", v)}
                  />
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center"
                    onPress={() => {
                      const now = new Date();
                      const tarih = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
                      updateForm("documentDate", tarih);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-full h-10 bg-[#3B82F6] rounded-lg items-center justify-center mt-1"
              onPress={handleSave}
            >
              <Text className="text-white font-semibold text-sm">{isEditing ? "Güncelle" : "Kaydet"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={newCustomerModal} transparent animationType="fade" onRequestClose={() => setNewCustomerModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">Yeni Müşteri</Text>
                <TouchableOpacity onPress={() => setNewCustomerModal(false)}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs font-medium mb-1">Şirket Adı</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Şirket adı"
                placeholderTextColor="#555"
                value={newCustomerForm.companyName}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, companyName: v }))}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Adres</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Servis adresi"
                placeholderTextColor="#555"
                value={newCustomerForm.address}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, address: v }))}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">E-posta</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="E-posta"
                placeholderTextColor="#555"
                keyboardType="email-address"
                value={newCustomerForm.email}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, email: v }))}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Telefon</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Telefon numarası"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                value={newCustomerForm.phone}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, phone: v }))}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Sorumlu Kişi</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Sorumlu kişi"
                placeholderTextColor="#555"
                value={newCustomerForm.contactPerson}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, contactPerson: v }))}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Sorumlu Telefon</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-4"
                placeholder="Sorumlu telefon"
                placeholderTextColor="#555"
                keyboardType="phone-pad"
                value={newCustomerForm.contactPhone}
                onChangeText={(v) => setNewCustomerForm((prev) => ({ ...prev, contactPhone: v }))}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setNewCustomerModal(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={() => {
                    if (!newCustomerForm.companyName) {
                      Alert.alert("Uyarı", "Şirket adı zorunludur.");
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
                      Alert.alert("Hata", "Müşteri eklenirken bir sorun oluştu.");
                    }).finally(() => setLoading(false));
                  }}
                >
                  <Text className="text-white font-medium">Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={signatureModal} transparent animationType="fade" onRequestClose={() => setSignatureModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">Müşteri İmzası</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSignatureModal(false);
                    setSignaturePaths([]);
                    signaturePathsRef.current = [];
                  }}
                  className="p-1"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
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
          <Text className="text-white font-semibold text-base">Tüm Servis Kayıtları</Text>
          <Text className="text-gray-500 text-xs">{filteredRecords.length} kayıt gösteriliyor</Text>
        </View>

        <View className="flex-row flex-wrap gap-2 mb-4 items-center">
          {(["all", "gun", "ay", "yil"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              className={`px-4 h-8 rounded-lg items-center justify-center ${
                filter === f ? "bg-[#3B82F6]" : "bg-[#1A1A1A] border border-[#2A2A2A]"
              }`}
              onPress={() => setFilter(filter === f ? "all" : f)}
            >
              <Text
                className={`text-xs font-medium ${
                  filter === f ? "text-white" : "text-gray-400"
                }`}
              >
                {f === "all" ? "Tümü" : f === "gun" ? "Gün" : f === "ay" ? "Ay" : "Yıl"}
              </Text>
            </TouchableOpacity>
          ))}
          <TextInput
            className="h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 text-white text-xs w-28"
            placeholder="Tarih"
            placeholderTextColor="#555"
            value={filterDate}
            onChangeText={setFilterDate}
          />
          <TextInput
            className="h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 text-white text-xs flex-1 min-w-[120px]"
            placeholder="Belge Adı"
            placeholderTextColor="#555"
            value={filterDocument}
            onChangeText={setFilterDocument}
          />
          <TextInput
            className="h-8 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 text-white text-xs flex-1 min-w-[120px]"
            placeholder="Müşteri"
            placeholderTextColor="#555"
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
            <Ionicons name="close-circle-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] overflow-hidden">
          <View className="flex-row bg-[#1A1A1A] px-3 py-3 border-b border-[#2A2A2A]">
            {["Tarih", "Belge Adı", "Müşteri", "Servis", ""].map(
              (col) => (
                <Text
                  key={col}
                  className={`text-gray-400 text-xs font-semibold ${
                    col === "Tarih"
                      ? "w-24"
                      : col === "Belge Adı"
                        ? "flex-1"
                        : col === "Müşteri"
                          ? "flex-1"
                          : col === "Servis"
                            ? "flex-1"
                            : "w-28 text-right"
                  }`}
                >
                  {col}
                </Text>
              ),
            )}
          </View>

          <ScrollView nestedScrollEnabled className="max-h-96" indicatorStyle="white">
            {filteredRecords.map((k, i) => (
              <View
                key={k.id}
                className="flex-row items-center px-3 py-3 border-b border-[#1F1F1F]"
              >
                <Text className="w-24 text-gray-400 text-xs">{k.tarih}</Text>
                <Text className="flex-1 text-white text-sm font-medium" numberOfLines={1}>
                  {k.customer} - {k.tarih}
                </Text>
                <Text className="flex-1 text-gray-300 text-sm" numberOfLines={1}>
                  {k.customer}
                </Text>
                <Text className="flex-1 text-gray-400 text-xs" numberOfLines={1}>
                  {k.service}
                </Text>
                <View className="w-28 flex-row items-center justify-end gap-3">
                  <TouchableOpacity onPress={() => setDeleteAlert({ visible: true, record: k })}>
                    <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleViewService(k)}>
                    <Ionicons name="eye-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(k)}>
                    <Ionicons name="create-outline" size={20} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openServicePDF(k)}>
                    <Ionicons name="download-outline" size={20} color="#F59E0B" />
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
      title={isEditing ? "Güncelle" : "Kaydet"}
      message={isEditing ? "Bu servis kaydını güncellemek istediğinize emin misiniz?" : "Bu servis kaydını oluşturmak istediğinize emin misiniz?"}
      onClose={() => setSaveAlertVisible(false)}
      onConfirm={confirmSave}
      confirmText="Onayla"
    />

    <CustomAlert
      visible={deleteAlert.visible}
      type="confirm"
      title="Sil"
      message={`"${deleteAlert.record?.customer}" servis kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
      onClose={() => setDeleteAlert({ visible: false, record: null })}
      onConfirm={() => {
        if (deleteAlert.record) handleDelete(deleteAlert.record);
      }}
      confirmText="Sil"
      confirmColor="#EF4444"
    />

    <Modal visible={pdfModalVisible} animationType="slide" onRequestClose={() => setPdfModalVisible(false)}>
      <View className="flex-1 bg-[#0A0A0A]">
        <View className="flex-row items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <Text className="text-white text-lg font-bold">Servis Formu</Text>
          <TouchableOpacity
            className="h-9 px-4 bg-[#3B82F6] rounded-lg items-center justify-center"
            onPress={() => setPdfModalVisible(false)}
          >
            <Text className="text-white text-sm font-medium">Kapat</Text>
          </TouchableOpacity>
        </View>
        {selectedServiceData && (
          <View className="flex-1 p-4">
            <View className="bg-[#1A1A1A] rounded-2xl p-5 mb-4">
              <Text className="text-white text-lg font-bold mb-4">Servis Bilgileri</Text>
              <View className="gap-3">
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Müşteri:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.customerName}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Tarih:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.documentDate}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Adres:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.serviceAddress || "Belirtilmemiş"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Telefon:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.phone || "Belirtilmemiş"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Servisler:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.services.join(", ") || "-"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Teknik:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.technical.join(", ") || "-"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Ücret:</Text>
                  <Text className="text-white text-sm flex-1">₺{selectedServiceData.fee || "0.00"}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-gray-400 text-sm w-28">Teknisyen:</Text>
                  <Text className="text-white text-sm flex-1">{selectedServiceData.technician || "Belirtilmemiş"}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              className="w-full h-12 bg-[#3B82F6] rounded-xl items-center justify-center flex-row gap-2"
              onPress={() => Alert.alert("Bilgi", "PDF oluşturma özelliği yeniden düzenleniyor...")}
            >
              <Ionicons name="download-outline" size={20} color="white" />
              <Text className="text-white font-semibold">PDF İndir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>

    <Modal visible={pdfPreviewVisible} animationType="slide" onRequestClose={() => setPdfPreviewVisible(false)}>
      <View className="flex-1 bg-[#0A0A0A]">
        <View className="flex-row items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <Text className="text-white text-lg font-bold">Servis Formu</Text>
          <TouchableOpacity
            className="h-9 px-4 bg-[#2A2A2A] rounded-lg items-center justify-center"
            onPress={() => setPdfPreviewVisible(false)}
          >
            <Text className="text-white text-sm font-medium">Kapat</Text>
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
                padding: 20,
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
                  position: "relative",
                } as any}
                dangerouslySetInnerHTML={{ __html: pdfPreviewHtml }}
              />
            </div>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: "#e5e5e5" }}
              contentContainerStyle={{
                alignItems: "center",
                padding: 12,
                paddingTop: 20,
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
                  marginTop: 0,
                }}
              >
                <WebView
                  source={{ html: pdfPreviewHtml }}
                  style={{
                    width: "100%",
                    height: Math.max((Dimensions.get("window").width - 24) * 1.414, 700),
                    backgroundColor: "white",
                    marginTop: 0,
                  }}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          )}
        </View>

        <View className="p-4 bg-[#1A1A1A] border-t border-[#2A2A2A]">
          <TouchableOpacity
            className="w-full h-12 bg-[#3B82F6] rounded-xl items-center justify-center flex-row gap-2"
            onPress={handleDownloadPDF}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="text-white font-semibold">PDF İndir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

function SignaturePad({ onSave, onClose }: { onSave: (paths: any[]) => void; onClose: () => void }) {
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
      Alert.alert("Uyarı", "Lütfen imza atın.");
      return;
    }
    onSave(allPathsRef.current);
  };

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
          <Text className="text-white font-medium">Onayla</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
