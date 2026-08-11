import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { generateServicePDFHtml } from "../ServicePDF";
import { shareWebPdf } from "../../utils/webPdf";
import { profileApi } from "../../api/profile";
import { serviceApi, ServiceRecord } from "../../api/services";
import { customerApi, Customer } from "../../api/customers";
import { useLanguage } from "../../contexts/LanguageContext";
import { initialForm, initialNewCustomerForm, type ServiceFormData, type NewCustomerFormData, type PdfData, type RecordFilter } from "./types";

interface DeleteAlertState {
  visible: boolean;
  record: ServiceRecord | null;
}

interface ServicesContextValue {
  loading: boolean;
  companyLogo: string | null;
  form: ServiceFormData;
  updateForm: (key: keyof ServiceFormData, value: string) => void;
  toggleService: (item: string) => void;
  toggleTechnical: (item: string) => void;
  isEditing: boolean;
  handleCancelEditing: () => void;
  handleClear: () => void;
  handleSave: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  saveAlertVisible: boolean;
  setSaveAlertVisible: (v: boolean) => void;
  confirmSave: () => void;
  customerList: Customer[];
  selectedCustomerId: string | null;
  clearCustomerSelection: () => void;
  selectCustomer: (id: string, name: string, address: string, phone: string) => void;
  customerSelectModal: boolean;
  setCustomerSelectModal: (v: boolean) => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  newCustomerModal: boolean;
  setNewCustomerModal: (v: boolean) => void;
  newCustomerForm: NewCustomerFormData;
  updateNewCustomerForm: (key: keyof NewCustomerFormData, value: string) => void;
  createNewCustomer: () => void;
  mapSelectorVisible: boolean;
  setMapSelectorVisible: (v: boolean) => void;
  filteredRecords: ServiceRecord[];
  filter: RecordFilter;
  setFilter: React.Dispatch<React.SetStateAction<RecordFilter>>;
  filterDate: string;
  setFilterDate: (v: string) => void;
  filterDocument: string;
  setFilterDocument: (v: string) => void;
  filterCustomer: string;
  setFilterCustomer: (v: string) => void;
  resetFilters: () => void;
  handleShare: (record: ServiceRecord) => void;
  handleViewService: (record: ServiceRecord) => void;
  openServicePDF: (record: ServiceRecord) => void;
  handleEdit: (record: ServiceRecord) => void;
  deleteAlert: DeleteAlertState;
  setDeleteAlert: (v: DeleteAlertState) => void;
  handleDelete: (record: ServiceRecord) => void;
  signatureModal: boolean;
  setSignatureModal: (v: boolean) => void;
  handleSignatureSave: (paths: any[]) => void;
  signatureAlertVisible: boolean;
  setSignatureAlertVisible: (v: boolean) => void;
  pdfPreviewVisible: boolean;
  setPdfPreviewVisible: (v: boolean) => void;
  pdfPreviewHtml: string;
  pdfZoom: number;
  setPdfZoom: React.Dispatch<React.SetStateAction<number>>;
  handleDownloadPDF: () => void;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState<ServiceFormData>({ ...initialForm });
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [showForm, setShowForm] = useState(true);
  const [signatureModal, setSignatureModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterDocument, setFilterDocument] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerFormData>({ ...initialNewCustomerForm });
  const [customerSelectModal, setCustomerSelectModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureAlertVisible, setSignatureAlertVisible] = useState(false);
  const [mapSelectorVisible, setMapSelectorVisible] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState<PdfData | null>(null);
  const [pdfZoom, setPdfZoom] = useState(60);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserName = useRef("");
  const originalFormRef = useRef<ServiceFormData | null>(null);
  const [saveAlertVisible, setSaveAlertVisible] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlertState>({ visible: false, record: null });
  const technicianSignatureRef = useRef<any>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyLogoRef = useRef<string | null>(null);
  const companyStampRef = useRef<string | null>(null);

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

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
    profileApi.getProfile().then((res) => {
      const name = res.data.user?.name || "";
      const sig = res.data.user?.signature;
      const logo = res.data.company?.logoUrl || null;
      const stamp = res.data.company?.stampUrl || null;
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
      if (logo) {
        companyLogoRef.current = logo;
        setCompanyLogo(logo);
      }
      if (stamp) {
        companyStampRef.current = stamp;
      }
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
        const logo = res.data.company?.logoUrl || null;
        const stamp = res.data.company?.stampUrl || null;
        if (logo) {
          companyLogoRef.current = logo;
          setCompanyLogo(logo);
        }
        if (stamp) {
          companyStampRef.current = stamp;
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

  const updateForm = (key: keyof ServiceFormData, value: string) =>
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
    if (form.startTime && form.startTime === form.endTime) {
      Alert.alert(t("svc.warning"), t("svc.errorTimeEqual"));
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
      setSignatureModal(true);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditingId(null);
    originalFormRef.current = null;
    setForm({ ...initialForm, technician: currentUserName.current || "" });
    setSelectedCustomerId(null);
  };

  const handleClear = () => {
    if (isEditing && originalFormRef.current) {
      setForm({ ...originalFormRef.current });
    } else {
      setForm({ ...initialForm, technician: currentUserName.current || "" });
      setSelectedCustomerId(null);
    }
  };

  const handleEdit = (record: ServiceRecord) => {
    const editForm: ServiceFormData = {
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

  const buildPdfData = (record: ServiceRecord): PdfData => ({
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
    internalIp: record.dahiliIp,
    externalIp: record.hariciIp,
    signature: record.signature || null,
    technicianSignature: record.technicianSignature || technicianSignatureRef.current || null,
    companyLogo: companyLogoRef.current,
    companyStamp: companyStampRef.current,
  });

  const openServicePDF = (record: ServiceRecord) => {
    const pdfData = buildPdfData(record);
    setPdfPreviewData(pdfData);
    setTimeout(() => handleDownloadPDF(), 100);
  };

  const handleViewService = (record: ServiceRecord) => {
    const pdfData = buildPdfData(record);
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

  const buildPdfHtml = (record: ServiceRecord) => generateServicePDFHtml(buildPdfData(record), t);

  const printPdfToFile = async (html: string) => {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    return uri;
  };

  const sharePdfFileNative = async (uri: string) => {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: t("svc.pdfDialogTitle"),
      UTI: "com.adobe.pdf",
    });
  };

  const handleShare = async (record: ServiceRecord) => {
    try {
      const html = buildPdfHtml(record);
      if (Platform.OS === "web") {
        const fileName = `${record.customer || "servis"} - ${record.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
        await shareWebPdf(html, fileName);
      } else {
        const uri = await printPdfToFile(html);
        await sharePdfFileNative(uri);
      }
    } catch (error) {
      Alert.alert(t("svc.error"), t("svc.errorPdfCreate") + (error as any).message);
    }
  };

  const clearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setForm((prev) => ({ ...prev, customerName: "", serviceAddress: "", phone: "" }));
  };

  const selectCustomer = (id: string, name: string, address: string, phone: string) => {
    setSelectedCustomerId(id);
    setCustomerSelectModal(false);
    setForm((prev) => ({ ...prev, customerName: name, serviceAddress: address, phone }));
  };

  const updateNewCustomerForm = (key: keyof NewCustomerFormData, value: string) =>
    setNewCustomerForm((prev) => ({ ...prev, [key]: value }));

  const createNewCustomer = () => {
    if (!newCustomerForm.companyName) {
      Alert.alert(t("svc.warning"), t("svc.errorCompanyRequired"));
      return;
    }
    setLoading(true);
    customerApi.create(newCustomerForm).then((res) => {
      const yeni = res.data;
      setCustomerList((prev) => [...prev, yeni]);
      setSelectedCustomerId(yeni.id);
      setForm((prev) => ({
        ...prev,
        customerName: yeni.companyName,
        serviceAddress: yeni.address || "",
        phone: yeni.phone || "",
      }));
      setNewCustomerModal(false);
    }).catch(() => {
      Alert.alert(t("svc.error"), t("svc.errorCustomerAdd"));
    }).finally(() => setLoading(false));
  };

  const resetFilters = () => {
    setFilterDate("");
    setFilterDocument("");
    setFilterCustomer("");
    setFilter("all");
  };

  const value: ServicesContextValue = {
    loading,
    companyLogo,
    form,
    updateForm,
    toggleService,
    toggleTechnical,
    isEditing,
    handleCancelEditing,
    handleClear,
    handleSave,
    showForm,
    setShowForm,
    saveAlertVisible,
    setSaveAlertVisible,
    confirmSave,
    customerList,
    selectedCustomerId,
    clearCustomerSelection,
    selectCustomer,
    customerSelectModal,
    setCustomerSelectModal,
    customerSearch,
    setCustomerSearch,
    newCustomerModal,
    setNewCustomerModal,
    newCustomerForm,
    updateNewCustomerForm,
    createNewCustomer,
    mapSelectorVisible,
    setMapSelectorVisible,
    filteredRecords,
    filter,
    setFilter,
    filterDate,
    setFilterDate,
    filterDocument,
    setFilterDocument,
    filterCustomer,
    setFilterCustomer,
    resetFilters,
    handleShare,
    handleViewService,
    openServicePDF,
    handleEdit,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    signatureModal,
    setSignatureModal,
    handleSignatureSave,
    signatureAlertVisible,
    setSignatureAlertVisible,
    pdfPreviewVisible,
    setPdfPreviewVisible,
    pdfPreviewHtml,
    pdfZoom,
    setPdfZoom,
    handleDownloadPDF,
  };

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}
