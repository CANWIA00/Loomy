import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { generateServicePDFHtml } from "../ServicePDF";
import { shareWebPdf, downloadWebPdf } from "../../utils/webPdf";
import { embedImage } from "../../utils/pdfAssets";
import { profileApi } from "../../api/profile";
import { serviceApi, ServiceRecord } from "../../api/services";
import { customerApi, Customer } from "../../api/customers";
import { templateApi, ServiceTemplate } from "../../api/templates";
import { useLanguage } from "../../contexts/LanguageContext";
import { initialForm, initialNewCustomerForm, defaultTemplateConfig, type ServiceFormData, type NewCustomerFormData, type PdfData, type RecordFilter, type ServiceTemplateConfig } from "./types";

interface DeleteAlertState {
  visible: boolean;
  record: ServiceRecord | null;
}

interface ServicesContextValue {
  loading: boolean;
  refreshRecords: () => void;
  companyLogo: string | null;
  form: ServiceFormData;
  updateForm: (key: keyof ServiceFormData, value: string) => void;
  updateCustomField: (key: string, value: string) => void;
  toggleChip: (groupKey: string, item: string) => void;
  setGroupValue: (groupKey: string, labels: string[]) => void;
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
  filterTemplate: string;
  setFilterTemplate: (v: string) => void;
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
  templates: ServiceTemplate[];
  activeTemplate: ServiceTemplate | null;
  selectTemplate: (id: string) => void;
  templateConfig: ServiceTemplateConfig;
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
  const [filterTemplate, setFilterTemplate] = useState("");
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
  const currentUserPhone = useRef("");
  const originalFormRef = useRef<ServiceFormData | null>(null);
  const handledEditIdRef = useRef<string>("");
  const [saveAlertVisible, setSaveAlertVisible] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlertState>({ visible: false, record: null });
  const technicianSignatureRef = useRef<any>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyLogoRef = useRef<string | null>(null);
  const companyStampRef = useRef<string | null>(null);
  const companyInfoRef = useRef<{ name: string; address: string; phone: string; gsm: string; email: string; fax: string; website: string; taxNumber: string }>({
    name: "",
    address: "",
    phone: "",
    gsm: "",
    email: "",
    fax: "",
    website: "",
    taxNumber: "",
  });
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await serviceApi.getAll(0, 100);
      setRecords(res.data.content);
    } catch (e: any) {
      console.warn("fetchRecords failed:", e?.message || e);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.getAllSimple();
      setCustomerList(res.data);
    } catch (e: any) {
      console.warn("fetchCustomers failed:", e?.message || e);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await templateApi.getAll();
      setTemplates(res.data);
      setActiveTemplateId((prev) => {
        if (prev && res.data.some((t) => t.id === prev)) return prev;
        return res.data.find((t) => t.isDefault)?.id || res.data[0]?.id || null;
      });
    } catch (e: any) {
      console.warn("fetchTemplates failed:", e?.message || e);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
    fetchTemplates();
    profileApi.getProfile().then((res) => {
      const name = res.data.user?.name || "";
      const sig = res.data.user?.signature;
      const logo = res.data.company?.logoUrl || null;
      const stamp = res.data.company?.stampUrl || null;
      const company = res.data.company;
      setHasSignature(!!sig);
      if (name) {
        currentUserName.current = name;
        setForm((prev) => ({ ...prev, technician: name }));
      }
      if (res.data.user?.phone) {
        currentUserPhone.current = res.data.user.phone;
        setForm((prev) => ({ ...prev, technicianPhone: res.data.user!.phone || "" }));
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
      if (company) {
        companyInfoRef.current = {
          name: company.name || "",
          address: company.address || "",
          phone: company.phone || "",
          gsm: company.gsm || "",
          email: company.email || "",
          fax: company.fax || "",
          website: company.website || "",
          taxNumber: company.taxNumber || "",
        };
      }
    }).catch(() => {});
  }, [fetchRecords, fetchCustomers]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
      fetchTemplates();
      profileApi.getProfile().then((res) => {
        const sig = res.data.user?.signature;
        setHasSignature(!!sig);
        if (res.data.user?.phone) {
          currentUserPhone.current = res.data.user.phone;
        }
        if (sig) {
          try {
            technicianSignatureRef.current = typeof sig === 'string' ? JSON.parse(sig) : sig;
          } catch {}
        }
        const logo = res.data.company?.logoUrl || null;
        const stamp = res.data.company?.stampUrl || null;
        const company = res.data.company;
        if (logo) {
          companyLogoRef.current = logo;
          setCompanyLogo(logo);
        }
        if (stamp) {
          companyStampRef.current = stamp;
        }
        if (company) {
          companyInfoRef.current = {
            name: company.name || "",
            address: company.address || "",
            phone: company.phone || "",
            gsm: company.gsm || "",
            email: company.email || "",
            fax: company.fax || "",
            website: company.website || "",
            taxNumber: company.taxNumber || "",
          };
        }
      }).catch(() => {});
    }, [fetchRecords, fetchTemplates])
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

  const updateCustomField = (key: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      customValues: { ...prev.customValues, [key]: value },
    }));

  const toggleChip = (groupKey: string, item: string) =>
    setForm((prev) => {
      if (groupKey === "services") {
        return {
          ...prev,
          services: prev.services.includes(item)
            ? prev.services.filter((t) => t !== item)
            : [...prev.services, item],
        };
      }
      if (groupKey === "technical") {
        return {
          ...prev,
          technical: prev.technical.includes(item)
            ? prev.technical.filter((t) => t !== item)
            : [...prev.technical, item],
        };
      }
      const current = prev.customChips[groupKey] || [];
      return {
        ...prev,
        customChips: {
          ...prev.customChips,
          [groupKey]: current.includes(item)
            ? current.filter((t) => t !== item)
            : [...current, item],
        },
      };
    });

  const setGroupValue = (groupKey: string, labels: string[]) =>
    setForm((prev) => {
      if (groupKey === "services") return { ...prev, services: labels };
      if (groupKey === "technical") return { ...prev, technical: labels };
      return { ...prev, customChips: { ...prev.customChips, [groupKey]: labels } };
    });

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
          teknisyenTelefon: form.technicianPhone,
          tarih: form.documentDate || new Date().toLocaleDateString(locale),
          hizmetler: form.services,
          teknik: form.technical,
          customChips: form.customChips,
          customValues: form.customValues,
          service: form.services.join(", ") || "-",
          templateName: activeTemplate?.name || undefined,
          templateConfig: templateSnapshot(templateConfig),
        });
        Alert.alert(t("svc.success"), t("svc.successUpdated"));
        setIsEditing(false);
        setEditingId(null);
        originalFormRef.current = null;
        setForm({ ...initialForm, technician: currentUserName.current || "", technicianPhone: currentUserPhone.current || "" });
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
    setForm({ ...initialForm, technician: currentUserName.current || "", technicianPhone: currentUserPhone.current || "" });
    setSelectedCustomerId(null);
  };

  const handleClear = () => {
    if (isEditing && originalFormRef.current) {
      setForm({ ...originalFormRef.current });
    } else {
      setForm({ ...initialForm, technician: currentUserName.current || "", technicianPhone: currentUserPhone.current || "" });
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
      technicianPhone: record.teknisyenTelefon || currentUserPhone.current || "",
      documentDate: record.tarih || "",
      services: record.hizmetler || [],
      technical: record.teknik || [],
      customChips: record.customChips || {},
      customValues: record.customValues || {},
    };
    originalFormRef.current = { ...editForm };
    setForm(editForm);
    setEditingId(record.id);
    setIsEditing(true);
    setShowForm(true);
    if (record.templateName) {
      const tpl = templates.find((t) => t.name === record.templateName);
      if (tpl) setActiveTemplateId(tpl.id);
    }
  };

  const searchParams = useLocalSearchParams<{ edit?: string }>();
  const editParamId = typeof searchParams.edit === "string" ? searchParams.edit : "";
  useEffect(() => {
    if (!editParamId || handledEditIdRef.current === editParamId) return;
    const rec = records.find((r) => String(r.id) === editParamId);
    if (!rec) return;
    handledEditIdRef.current = editParamId;
    handleEdit(rec);
  }, [editParamId, records, handleEdit]);

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
        teknisyenTelefon: form.technicianPhone,
        hizmetler: form.services,
        teknik: form.technical,
        customChips: form.customChips,
        customValues: form.customValues,
        imzali: paths.length > 0,
        signature: paths,
        technicianSignature: technicianSignatureRef.current || null,
        templateName: activeTemplate?.name || undefined,
        templateConfig: templateSnapshot(templateConfig),
      });
      Alert.alert(t("svc.success"), t("svc.successCreated"));

      fetchRecords();
    } catch {
      Alert.alert(t("svc.error"), t("svc.errorSave"));
    } finally {
      setLoading(false);
      setForm({ ...initialForm, technician: currentUserName.current || "", technicianPhone: currentUserPhone.current || "" });
      setEditingId(null);
      setIsEditing(false);
      setSignatureModal(false);
    }
  };

  const filteredRecords = records.filter((k) => {
    if (filterTemplate && k.templateName !== filterTemplate) return false;
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
    technicianPhone: record.teknisyenTelefon || "",
    startTime: record.baslangic,
    endTime: record.bitis,
    details: record.detaylar,
    internalIp: record.dahiliIp,
    externalIp: record.hariciIp,
    customChips: record.customChips || {},
    customValues: record.customValues || {},
    signature: record.signature || null,
    technicianSignature: record.technicianSignature || technicianSignatureRef.current || null,
    companyLogo: companyLogoRef.current,
    companyStamp: companyStampRef.current,
    companyName: companyInfoRef.current.name,
    companyAddress: companyInfoRef.current.address,
    companyPhone: companyInfoRef.current.phone,
    companyGsm: companyInfoRef.current.gsm,
    companyEmail: companyInfoRef.current.email,
    companyFax: companyInfoRef.current.fax,
    companyWebsite: companyInfoRef.current.website,
    companyTaxNumber: companyInfoRef.current.taxNumber,
    templateName: record.templateName || null,
    templateConfig: record.templateConfig || null,
  });

  const resolvePdfData = async (record: ServiceRecord): Promise<PdfData> => {
    const base = buildPdfData(record);
    const [companyLogo, companyStamp] = await Promise.all([
      embedImage(base.companyLogo),
      embedImage(base.companyStamp),
    ]);
    return { ...base, companyLogo, companyStamp };
  };

  const openServicePDF = async (record: ServiceRecord) => {
    const pdfData = await resolvePdfData(record);
    setPdfPreviewData(pdfData);
    await performDownloadPDF(pdfData);
  };

  const handleViewService = async (record: ServiceRecord) => {
    const pdfData = await resolvePdfData(record);
    const html = generateServicePDFHtml(pdfData, t, locale.startsWith("tr") ? "tr" : "en");
    setPdfPreviewHtml(html);
    setPdfPreviewData(pdfData);
    setPdfZoom(60);
    setPdfPreviewVisible(true);
  };

  const performDownloadPDF = async (data: PdfData) => {
    try {
      const html = generateServicePDFHtml(data, t, locale.startsWith("tr") ? "tr" : "en");

      if (Platform.OS === "web") {
        const fileName = `${data.customerName || "servis"} - ${data.documentDate || ""}`.replace(/[\\/:*?"<>|]+/g, "-");
        await downloadWebPdf(html, fileName);
      } else {
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

  const handleDownloadPDF = async () => {
    if (!pdfPreviewData) {
      Alert.alert(t("svc.error"), t("svc.errorPdfData"));
      return;
    }
    await performDownloadPDF(pdfPreviewData);
  };

  const handleDelete = async (record: ServiceRecord) => {
    try {
      await serviceApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      Alert.alert(t("svc.error"), t("svc.errorDelete"));
    }
  };

  const buildPdfHtml = async (record: ServiceRecord) => {
    const pdfData = await resolvePdfData(record);
    return generateServicePDFHtml(pdfData, t, locale.startsWith("tr") ? "tr" : "en");
  };

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
      const html = await buildPdfHtml(record);
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
    setFilterTemplate("");
    setFilter("all");
  };

  const activeTemplate =
    templates.find((t) => t.id === activeTemplateId) ||
    templates.find((t) => t.isDefault) ||
    templates[0] ||
    null;

  const templateConfig: ServiceTemplateConfig = activeTemplate
    ? { fields: activeTemplate.fields, chipGroups: activeTemplate.chipGroups }
    : defaultTemplateConfig();

  const selectTemplate = (id: string) => {
    setActiveTemplateId(id);
    setForm((prev) => ({ ...prev, services: [], technical: [], customChips: {}, customValues: {} }));
  };

  const templateSnapshot = (config: ServiceTemplateConfig) =>
    JSON.parse(JSON.stringify(config)) as ServiceTemplateConfig;

  const value: ServicesContextValue = {
    loading,
    refreshRecords: fetchRecords,
    companyLogo,
    form,
    updateForm,
    updateCustomField,
    toggleChip,
    setGroupValue,
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
    filterTemplate,
    setFilterTemplate,
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
    templates,
    activeTemplate,
    selectTemplate,
    templateConfig,
  };

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}
