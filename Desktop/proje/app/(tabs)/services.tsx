import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, PanResponder, ActivityIndicator, Dimensions, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import MapSelector from "../../components/MapSelector";
import { generateServicePDFHtml } from "../../components/ServicePDF";
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

const fakeRecords = [
  { id: 1, tarih: "15/07/2026", customer: "Ahmet Yılmaz", service: "Alarm, CCTV", adres: "İstanbul, Sarıyer", baslangic: "09:00", bitis: "10:30", telefon: "555-111-2233", dahiliIp: "192.168.1.10", hariciIp: "85.107.45.10", detaylar: "Yıllık bakım yapıldı", ucret: "850.00", teknisyen: "Mehmet Usta", hizmetler: ["Alarm", "CCTV"], teknik: ["AHM Sinyal Kontrolü Yapıldı (Açma-Kapama)"] },
  { id: 2, tarih: "14/07/2026", customer: "Ayşe Demir", service: "Yangın, Montaj", adres: "Ankara, Çankaya", baslangic: "10:00", bitis: "11:00", telefon: "555-222-3344", dahiliIp: "192.168.1.20", hariciIp: "85.107.45.20", detaylar: "", ucret: "0.00", teknisyen: "Ali Usta", hizmetler: ["Yangın", "Montaj"], teknik: [] },
  { id: 3, tarih: "13/07/2026", customer: "Mehmet Öz", service: "AHM Bağlantısı", adres: "İzmir, Konak", baslangic: "14:00", bitis: "15:00", telefon: "555-333-4455", dahiliIp: "192.168.1.30", hariciIp: "85.107.45.30", detaylar: "Yeni abone kurulumu", ucret: "1200.00", teknisyen: "Mehmet Usta", hizmetler: ["AHM Bağlantısı Yapıldı"], teknik: ["Uzak Erişim yapıldı", "GPRS Bağlantısı yapıldı"] },
  { id: 4, tarih: "12/07/2026", customer: "Zeynep Kaya", service: "Kablolama, CCTV, Montaj", adres: "İstanbul, Beşiktaş", baslangic: "08:30", bitis: "12:00", telefon: "555-444-5566", dahiliIp: "192.168.1.40", hariciIp: "85.107.45.40", detaylar: "", ucret: "1500.00", teknisyen: "Veli Usta", hizmetler: ["Kablolama", "CCTV", "Montaj"], teknik: ["Kameralara Netlik ve Yön Ayarı yapıldı"] },
  { id: 5, tarih: "11/07/2026", customer: "Ali Öztürk", service: "Devreye Alma Eğitimi", adres: "İzmir, Karşıyaka", baslangic: "13:00", bitis: "16:00", telefon: "555-555-6677", dahiliIp: "192.168.1.50", hariciIp: "85.107.45.50", detaylar: "Eğitim sonrası sınav yapıldı", ucret: "600.00", teknisyen: "Ahmet Usta", hizmetler: ["Devreye Alma Eğitimi"], teknik: ["Eğitim verildi - Tatbikat Yapıldı", "Kayıt ve Yedekleme Eğitimi verildi"] },
  { id: 6, tarih: "10/07/2026", customer: "Elif Yıldız", service: "Alarm, Yangın, CCTV", adres: "İstanbul, Kadıköy", baslangic: "09:30", bitis: "11:30", telefon: "555-666-7788", dahiliIp: "192.168.1.60", hariciIp: "85.107.45.60", detaylar: "", ucret: "950.00", teknisyen: "Mehmet Usta", hizmetler: ["Alarm", "Yangın", "CCTV"], teknik: ["Akü Ömrü Kontrol edildi"] },
  { id: 7, tarih: "09/07/2026", customer: "Murat Şahin", service: "Montaj", adres: "Ankara, Keçiören", baslangic: "10:00", bitis: "11:00", telefon: "555-777-8899", dahiliIp: "192.168.1.70", hariciIp: "85.107.45.70", detaylar: "", ucret: "400.00", teknisyen: "Ali Usta", hizmetler: ["Montaj"], teknik: [] },
  { id: 8, tarih: "08/07/2026", customer: "Sema Korkmaz", service: "AHM Bağlantısı, Kablolama", adres: "İstanbul, Üsküdar", baslangic: "13:30", bitis: "15:30", telefon: "555-888-9900", dahiliIp: "192.168.1.80", hariciIp: "85.107.45.80", detaylar: "Mevcut sisteme yeni hat eklendi", ucret: "1100.00", teknisyen: "Veli Usta", hizmetler: ["AHM Bağlantısı Yapıldı", "Kablolama"], teknik: ["BVR Kayıt Kontrol Yapıldı", "Test sinyal Programlandı"] },
  { id: 9, tarih: "07/07/2026", customer: "Burak Çelik", service: "CCTV, Montaj", adres: "İzmir, Bornova", baslangic: "09:00", bitis: "12:00", telefon: "555-999-0011", dahiliIp: "192.168.1.90", hariciIp: "85.107.45.90", detaylar: "4 kamera montajı", ucret: "2000.00", teknisyen: "Mehmet Usta", hizmetler: ["CCTV", "Montaj"], teknik: ["Kameralara Netlik ve Yön Ayarı yapıldı", "BVR Kayıt Kontrol Yapıldı"] },
  { id: 10, tarih: "06/07/2026", customer: "Ceren Yılmaz", service: "Yangın", adres: "İstanbul, Maltepe", baslangic: "14:00", bitis: "15:00", telefon: "555-000-1122", dahiliIp: "192.168.1.100", hariciIp: "85.107.45.100", detaylar: "Yangın dedektörü değişimi", ucret: "350.00", teknisyen: "Ali Usta", hizmetler: ["Yangın"], teknik: ["Kablosuz Dedektör Pil Kontrolü (TÜM)"] },
  { id: 11, tarih: "05/07/2026", customer: "Emre Demirtaş", service: "Alarm, CCTV, Kablolama", adres: "Ankara, Çankaya", baslangic: "08:00", bitis: "13:00", telefon: "555-111-2234", dahiliIp: "192.168.1.110", hariciIp: "85.107.45.110", detaylar: "", ucret: "1800.00", teknisyen: "Veli Usta", hizmetler: ["Alarm", "CCTV", "Kablolama"], teknik: ["Akü Ömrü Kontrol edildi", "Kablosuz Dedektör Pil Kontrolü (TÜM)"] },
  { id: 12, tarih: "04/07/2026", customer: "Gülseren Aktaş", service: "Devreye Alma Eğitimi, Belge Kontrolü", adres: "İzmir, Karşıyaka", baslangic: "10:00", bitis: "12:00", telefon: "555-222-3345", dahiliIp: "192.168.1.120", hariciIp: "85.107.45.120", detaylar: "", ucret: "500.00", teknisyen: "Ahmet Usta", hizmetler: ["Devreye Alma Eğitimi", "Belge Kontrolü Yapıldı"], teknik: [] },
  { id: 13, tarih: "03/07/2026", customer: "Hakan Çınar", service: "Montaj, CCTV", adres: "İstanbul, Ataşehir", baslangic: "09:00", bitis: "11:30", telefon: "555-333-4456", dahiliIp: "192.168.1.130", hariciIp: "85.107.45.130", detaylar: "", ucret: "750.00", teknisyen: "Mehmet Usta", hizmetler: ["Montaj", "CCTV"], teknik: [] },
  { id: 14, tarih: "02/07/2026", customer: "Irmak Gül", service: "Yangın, Alarm", adres: "Ankara, Yenimahalle", baslangic: "14:30", bitis: "16:00", telefon: "555-444-5567", dahiliIp: "192.168.1.140", hariciIp: "85.107.45.140", detaylar: "Periyodik bakım", ucret: "0.00", teknisyen: "Ali Usta", hizmetler: ["Yangın", "Alarm"], teknik: ["AHM Sinyal Kontrolü Yapıldı (Açma-Kapama)", "Test sinyal Programlandı"] },
  { id: 15, tarih: "01/07/2026", customer: "Kaan Yıldırım", service: "AHM Bağlantısı", adres: "İzmir, Buca", baslangic: "11:00", bitis: "12:30", telefon: "555-555-6678", dahiliIp: "192.168.1.150", hariciIp: "85.107.45.150", detaylar: "", ucret: "900.00", teknisyen: "Veli Usta", hizmetler: ["AHM Bağlantısı Yapıldı"], teknik: ["GPRS Bağlantısı yapıldı"] },
  { id: 16, tarih: "30/06/2026", customer: "Lale Çiçek", service: "Kablolama, Montaj, CCTV", adres: "İstanbul, Pendik", baslangic: "08:00", bitis: "14:00", telefon: "555-666-7789", dahiliIp: "192.168.1.160", hariciIp: "85.107.45.160", detaylar: "", ucret: "2200.00", teknisyen: "Mehmet Usta", hizmetler: ["Kablolama", "Montaj", "CCTV"], teknik: ["Kameralara Netlik ve Yön Ayarı yapıldı"] },
  { id: 17, tarih: "29/06/2026", customer: "Mert Koç", service: "Alarm", adres: "Ankara, Etimesgut", baslangic: "15:00", bitis: "16:00", telefon: "555-777-8890", dahiliIp: "192.168.1.170", hariciIp: "85.107.45.170", detaylar: "Kontrol paneli arızası giderildi", ucret: "300.00", teknisyen: "Ali Usta", hizmetler: ["Alarm"], teknik: ["Kablosuz Dedektör Pil Kontrolü (TÜM)"] },
  { id: 18, tarih: "28/06/2026", customer: "Nazlı Özkan", service: "Yangın, AHM Bağlantısı", adres: "İzmir, Alsancak", baslangic: "09:30", bitis: "11:00", telefon: "555-888-9901", dahiliIp: "192.168.1.180", hariciIp: "85.107.45.180", detaylar: "", ucret: "650.00", teknisyen: "Veli Usta", hizmetler: ["Yangın", "AHM Bağlantısı Yapıldı"], teknik: ["Akü Ömrü Kontrol edildi", "GPRS Bağlantısı yapıldı"] },
  { id: 19, tarih: "27/06/2026", customer: "Okan Arslan", service: "CCTV, Montaj, Kablolama", adres: "İstanbul, Şişli", baslangic: "08:30", bitis: "13:30", telefon: "555-999-0012", dahiliIp: "192.168.1.190", hariciIp: "85.107.45.190", detaylar: "8 kamera sistemi kurulumu", ucret: "3500.00", teknisyen: "Mehmet Usta", hizmetler: ["CCTV", "Montaj", "Kablolama"], teknik: ["BVR Kayıt Kontrol Yapıldı", "Kameralara Netlik ve Yön Ayarı yapıldı", "Kayıt ve Yedekleme Eğitimi verildi"] },
  { id: 20, tarih: "26/06/2026", customer: "Pınar Deniz", service: "Devreye Alma Eğitimi", adres: "Ankara, Sincan", baslangic: "10:00", bitis: "12:00", telefon: "555-000-1123", dahiliIp: "192.168.1.200", hariciIp: "85.107.45.200", detaylar: "", ucret: "0.00", teknisyen: "Ahmet Usta", hizmetler: ["Devreye Alma Eğitimi"], teknik: ["Eğitim verildi - Tatbikat Yapıldı"] },
];

const fakeCustomers = [
  { id: 1, companyName: "ABC Teknoloji", address: "İstanbul, Kadıköy, Bağdat Caddesi No:42", email: "info@abc.com", phone: "555-123-4567", contactPerson: "Ahmet Yılmaz", contactPhone: "555-111-2233" },
  { id: 2, companyName: "XYZ Yazılım", address: "Ankara, Çankaya, Atatürk Bulvarı No:25", email: "info@xyz.com", phone: "555-987-6543", contactPerson: "Ayşe Demir", contactPhone: "555-222-3344" },
  { id: 3, companyName: "DEF Danışmanlık", address: "İzmir, Konak, Cumhuriyet Bulvarı No:10", email: "info@def.com", phone: "555-456-7890", contactPerson: "Mehmet Öz", contactPhone: "555-333-4455" },
  { id: 4, companyName: "GHI Güvenlik", address: "İstanbul, Beşiktaş, Barbaros Bulvarı No:15", email: "info@ghi.com", phone: "555-321-7654", contactPerson: "Zeynep Kaya", contactPhone: "555-444-5566" },
  { id: 5, companyName: "JKL Enerji", address: "İzmir, Karşıyaka, Mustafa Kemal Cad. No:5", email: "info@jkl.com", phone: "555-654-3210", contactPerson: "Ali Öztürk", contactPhone: "555-555-6677" },
];

export default function ServicesScreen() {
  const [form, setForm] = useState({ ...initialForm });
  const [records, setRecords] = useState(fakeRecords);
  const [filter, setFilter] = useState<"all" | "gun" | "ay" | "yil">("all");
  const [showForm, setShowForm] = useState(true);
  const [signatureModal, setSignatureModal] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState<any[]>([]);
  const signaturePathsRef = useRef<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDocument, setFilterDocument] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customerList, setCustomerList] = useState(fakeCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
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

    if (isEditing && editingId !== null) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
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
              }
            : r
        )
      );
      Alert.alert("Başarılı", "Servis kaydı güncellendi.");
      setIsEditing(false);
      setEditingId(null);
      setForm({ ...initialForm });
    } else {
      setSignaturePaths([]);
      signaturePathsRef.current = [];
      setSignatureModal(true);
    }
  };

  const handleClear = () => {
    Alert.alert("Formu Temizle", "Formdaki tüm veriler silinecek. Devam etmek istiyor musunuz?", [
      { text: "Hayır", style: "cancel" },
      {
        text: "Evet, Temizle",
        style: "destructive",
        onPress: () => {
          setShowForm(false);
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
            technician: "",
            documentDate: "",
            services: [],
            technical: [],
          });
          setSelectedCustomerId(null);
          setIsEditing(false);
          setEditingId(null);
          customerNameRef.current?.setNativeProps({ text: "" });
          serviceAddressRef.current?.setNativeProps({ text: "" });
          startTimeRef.current?.setNativeProps({ text: "" });
          endTimeRef.current?.setNativeProps({ text: "" });
          phoneRef.current?.setNativeProps({ text: "" });
          internalIpRef.current?.setNativeProps({ text: "" });
          externalIpRef.current?.setNativeProps({ text: "" });
          detailsRef.current?.setNativeProps({ text: "" });
          feeRef.current?.setNativeProps({ text: "" });
          technicianRef.current?.setNativeProps({ text: "" });
          documentDateRef.current?.setNativeProps({ text: "" });
          setTimeout(() => {
            setShowForm(true);
          }, 50);
        },
      },
    ]);
  };

  const handleEdit = (record: typeof fakeRecords[0]) => {
    const r = record as any;
    setForm({
      customerName: r.customer || "",
      serviceAddress: r.adres || "",
      startTime: r.baslangic || "",
      endTime: r.bitis || "",
      phone: r.telefon || "",
      internalIp: r.dahiliIp || "",
      externalIp: r.hariciIp || "",
      details: r.detaylar || "",
      fee: r.ucret || "",
      technician: r.teknisyen || "",
      documentDate: r.tarih || "",
      services: r.hizmetler || [],
      technical: r.teknik || [],
    });
    setEditingId(r.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSignatureSave = (paths: any[]) => {
    const newRecord = {
      id: Date.now(),
      tarih: form.documentDate || new Date().toLocaleDateString("tr-TR"),
      customer: form.customerName,
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
      imzali: paths.length > 0,
      hizmetler: form.services,
      teknik: form.technical,
      signature: paths,
    };
    if (isEditing && editingId !== null) {
      setRecords((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...newRecord, id: editingId } : r))
      );
      Alert.alert("Başarılı", "Servis kaydı güncellendi.");
    } else {
      setRecords((prev) => [newRecord, ...prev]);
      Alert.alert("Başarılı", "Servis kaydı oluşturuldu.");
    }
    setForm({ ...initialForm });
    setEditingId(null);
    setIsEditing(false);
    setSignatureModal(false);
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



  const openServicePDF = (record: typeof fakeRecords[0]) => {
    const r = record as any;
    const pdfData = {
      customerName: r.musteri || r.customer || "",
      serviceAddress: r.adres || "",
      startTime: r.baslangic || "",
      endTime: r.bitis || "",
      phone: r.telefon || "",
      internalIp: r.dahiliIp || "",
      externalIp: r.hariciIp || "",
      details: r.detaylar || "",
      fee: r.ucret || r.fee || "0.00",
      technician: r.teknisyen || r.technician || "",
      documentDate: r.tarih || new Date().toLocaleDateString("tr-TR"),
      services: r.hizmetler || [],
      technical: r.teknik || [],
      signature: r.signature || null,
    };
    setSelectedServiceData(pdfData);
    setPdfPreviewData(pdfData);
    setTimeout(() => handleDownloadPDF(), 100);
  };

  const handleViewService = (record: typeof fakeRecords[0]) => {
    const r = record as any;
    const pdfData = {
      customerName: r.customer || "",
      documentDate: r.tarih || new Date().toLocaleDateString("tr-TR"),
      serviceAddress: r.adres || "",
      phone: r.telefon || "",
      services: r.hizmetler || [],
      technical: r.teknik || [],
      fee: r.ucret || "0.00",
      technician: r.teknisyen || "",
      startTime: r.baslangic || "",
      endTime: r.bitis || "",
      details: r.detaylar || "",
      signature: r.signature || null,
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
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
                        return m.companyName.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q);
                      })
                      .map((m, i, arr) => (
                        <TouchableOpacity
                          key={m.id}
                          className={`flex-row items-center px-3 py-3 ${i < arr.length - 1 ? "border-b border-[#2A2A2A]" : ""}`}
                          onPress={() => {
                            setSelectedCustomerId(m.id);
                            setCustomerSelectModal(false);
                            updateForm("customerName", m.companyName);
                            updateForm("serviceAddress", m.address);
                            updateForm("phone", m.phone);
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
                <TextInput
                  ref={technicianRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Teknisyen adını girin"
                  placeholderTextColor="#555"
                  value={form.technician}
                  onChangeText={(v) => updateForm("technician", v)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-xs font-medium mb-1">Belge Tarihi</Text>
                <TextInput
                  ref={documentDateRef}
                  className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="GG/AA/YYYY"
                  placeholderTextColor="#555"
                  value={form.documentDate}
                  onChangeText={(v) => updateForm("documentDate", v)}
                />
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
                    const yeniId = Math.max(...customerList.map((m) => m.id), 0) + 1;
                    const yeni = { id: yeniId, ...newCustomerForm };
                    setCustomerList((prev) => [...prev, yeni]);
                    setSelectedCustomerId(yeni.id);
                    updateForm("customerName", yeni.companyName);
                    updateForm("serviceAddress", yeni.address);
                    updateForm("phone", yeni.phone);
                    setNewCustomerModal(false);
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
