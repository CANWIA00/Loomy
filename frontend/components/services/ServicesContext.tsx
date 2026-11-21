import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dimensions, Platform, type ScrollView, type View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { generateServicePDFHtml } from "../ServicePDF";
import { shareWebPdf, downloadWebPdf } from "../../utils/webPdf";
import { embedImage } from "../../utils/pdfAssets";
import { getTryRates } from "../../utils/currencyRates";
import { parseNumericInput } from "../../components/stock/format";
import { profileApi } from "../../apiclient/profile";
import { serviceApi, ServiceRecord } from "../../apiclient/services";
import { customerApi, Customer } from "../../apiclient/customers";
import { templateApi, ServiceTemplate } from "../../apiclient/templates";
import { useLanguage } from "../../contexts/LanguageContext";
import { useFocusedPolling } from "../../hooks/useFocusedPolling";
import { initialForm, initialNewCustomerForm, defaultTemplateConfig, effectiveFields, type ServiceFormData, type NewCustomerFormData, type PdfData, type RecordFilter, type ServiceTemplateConfig, type TemplateField, type UsedProductFormItem } from "./types";

interface DeleteAlertState {
  visible: boolean;
  record: ServiceRecord | null;
}

interface ResultAlertState {
  visible: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
}

interface ServicesContextValue {
  loading: boolean;
  refreshRecords: () => void;
  companyLogo: string | null;
  form: ServiceFormData;
  updateForm: (key: keyof ServiceFormData, value: string | boolean) => void;
  updateCustomField: (key: string, value: string) => void;
  toggleChip: (groupKey: string, item: string) => void;
  setGroupValue: (groupKey: string, labels: string[]) => void;
  addUsedProduct: () => void;
  updateUsedProduct: (index: number, patch: Partial<UsedProductFormItem>) => void;
  removeUsedProduct: (index: number) => void;
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
  resetNewCustomerForm: () => void;
  createNewCustomer: () => void;
  mapSelectorVisible: boolean;
  setMapSelectorVisible: (v: boolean) => void;
  filteredRecords: ServiceRecord[];
  totalElements: number;
  hasMoreRecords: boolean;
  loadMoreRecords: () => void;
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
  resultAlert: ResultAlertState;
  setResultAlert: (v: ResultAlertState) => void;
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
  // --- UX iyilestirmeleri ---
  /** Teknisyenin (giris yapan kullanicinin) profilde kayitli imzasi var mi */
  hasSignature: boolean;
  techSignatureModal: boolean;
  setTechSignatureModal: (v: boolean) => void;
  /** Teknisyen imzasini sayfadan ayrilmadan profile kaydeder */
  handleTechnicianSignatureSave: (paths: any[]) => void;
  /** Zorunlu alan durumu (kirmizi cerceve / * isareti) */
  isMissing: (key: string) => boolean;
  isRequiredKey: (key: string) => boolean;
  /** Alan etiketlerinin konumu: eksik alana kaydirmak icin */
  registerFieldLabel: (key: string) => (node: View | null) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  contentTopRef: React.RefObject<View | null>;
  handleDuplicate: (record: ServiceRecord) => void;
  /** Telefonda: yeni kayit icin formu tam ekran acar */
  openNewRecord: () => void;
  /** Telefonda: form ekranini kapatip listeye doner */
  closeFormScreen: () => void;
  isFormDirty: () => boolean;
}

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

/** Bugunun tarihi, formun kullandigi GG/AA/YYYY biciminde. */
const todayInput = (now: Date = new Date()) =>
  `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

const normalizeUsedProducts = (items: UsedProductFormItem[]) =>
  (items || []).map((p) => ({
    ...p,
    quantity: parseNumericInput(p.quantity),
    unitPrice: p.unitPrice != null && String(p.unitPrice).trim() !== "" ? parseNumericInput(p.unitPrice) : null,
  }));

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) throw new Error("useServices must be used within ServicesProvider");
  return ctx;
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const { t, lang, locale } = useLanguage();
  // Telefonda (768px alti) liste once gelir; form "Yeni Servis Kaydi" ile tam ekran acilir.
  const isPhoneNow = () => Dimensions.get("window").width < 768;
  const [form, setForm] = useState<ServiceFormData>({ ...initialForm, documentDate: todayInput() });
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [techSignatureModal, setTechSignatureModal] = useState(false);
  const pendingSaveRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const contentTopRef = useRef<View | null>(null);
  const fieldLabelRefs = useRef<Record<string, View | null>>({});
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [showForm, setShowForm] = useState(() => !isPhoneNow());
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
  const [pdfZoom, setPdfZoom] = useState(50);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const recordsPageRef = useRef(0);
  const currentUserName = useRef("");
  const currentUserPhone = useRef("");
  const originalFormRef = useRef<ServiceFormData | null>(null);
  const handledEditIdRef = useRef<string>("");
  const [saveAlertVisible, setSaveAlertVisible] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlertState>({ visible: false, record: null });
  const [resultAlert, setResultAlert] = useState<ResultAlertState>({ visible: false, type: "success", title: "", message: "" });
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
      setTotalElements(res.data.totalElements);
      recordsPageRef.current = 0;
    } catch (e: any) {
      console.warn("fetchRecords failed:", e?.message || e);
    }
  }, []);

  const loadMoreRecords = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = recordsPageRef.current + 1;
      const res = await serviceApi.getAll(nextPage, 100);
      setRecords((prev) => [...prev, ...res.data.content]);
      setTotalElements(res.data.totalElements);
      recordsPageRef.current = nextPage;
    } catch (e: any) {
      console.warn("loadMoreRecords failed:", e?.message || e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

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
      fetchCustomers();
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
    }, [fetchRecords, fetchCustomers, fetchTemplates])
  );

  const pollRefetch = useCallback(async () => {
    await Promise.all([fetchRecords(), fetchCustomers(), fetchTemplates()]);
  }, [fetchRecords, fetchCustomers, fetchTemplates]);
  useFocusedPolling(pollRefetch);

  // Teknisyen imzasi yoksa profile yonlendirmek yerine imza penceresi acilir;
  // imza kaydedilince kaydetme islemi kaldigi yerden devam eder.
  const requireSignature = (): boolean => {
    if (!hasSignature) {
      pendingSaveRef.current = true;
      setTechSignatureModal(true);
      return false;
    }
    return true;
  };

  const handleTechnicianSignatureSave = async (paths: any[]) => {
    try {
      await profileApi.updateUser({
        name: currentUserName.current,
        phone: currentUserPhone.current,
        signature: JSON.stringify(paths),
      });
      technicianSignatureRef.current = paths;
      setHasSignature(true);
      setTechSignatureModal(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        // hasSignature state'i guncellenmeden once calismamasi icin bir sonraki tura birak
        setTimeout(() => proceedSave(), 0);
      } else {
        setResultAlert({ visible: true, type: "success", title: t("svc.success"), message: t("svc.signatureSaved") });
      }
    } catch {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorSignatureSave") });
    }
  };

  const clearMissing = (key: string, value: unknown) => {
    if (typeof value === "string" && value.trim()) setMissingKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev));
  };

  const updateForm = (key: keyof ServiceFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearMissing(key === "kdvRate" ? "kdv" : key === "serviceAddress" ? "serviceAddress" : key, value);
  };

  const updateCustomField = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      customValues: { ...prev.customValues, [key]: value },
    }));
    clearMissing(key, value);
  };

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

  const addUsedProduct = () =>
    setForm((prev) => ({
      ...prev,
      usedProducts: [...prev.usedProducts, { name: "", quantity: "", unitPrice: "", currency: "TRY", unit: "Adet" }],
    }));

  const updateUsedProduct = (index: number, patch: Partial<UsedProductFormItem>) =>
    setForm((prev) => ({
      ...prev,
      usedProducts: prev.usedProducts.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  const removeUsedProduct = (index: number) =>
    setForm((prev) => ({
      ...prev,
      usedProducts: prev.usedProducts.filter((_, i) => i !== index),
    }));

  const fieldValueByKey = useCallback((key: string): string => {
    switch (key) {
      case "customerName": return form.customerName;
      case "serviceAddress": return form.serviceAddress;
      case "startTime": return form.startTime;
      case "endTime": return form.endTime;
      case "phone": return form.phone;
      case "technician": return form.technician;
      case "documentDate": return form.documentDate;
      case "details": return form.details;
      case "fee": return form.fee;
      case "labor": return form.labor;
      case "kdv": return form.kdvRate;
      default: return form.customValues[key] || "";
    }
  }, [form]);

  const missingRequiredFields = (): TemplateField[] => {
    const required = effectiveFields(templateConfig).filter((f) => f.required === true);
    return required
      .filter((f) => !((f.key === "fee") && form.productsMode))
      .filter((f) => !((f.key === "labor" || f.key === "kdv") && !form.productsMode))
      .filter((f) => !fieldValueByKey(f.key).trim());
  };

  const requiredKeysNow = (): string[] =>
    effectiveFields(templateConfig)
      .filter((f) => f.required === true)
      .filter((f) => !((f.key === "fee") && form.productsMode))
      .filter((f) => !((f.key === "labor" || f.key === "kdv") && !form.productsMode))
      .map((f) => f.key);

  const isMissing = (key: string) => missingKeys.includes(key);
  const isRequiredKey = (key: string) => requiredKeysNow().includes(key);
  const registerFieldLabel = (key: string) => (node: View | null) => {
    fieldLabelRefs.current[key] = node;
  };

  // Eksik alanlar arasindan ekranda en ustte olana kaydirir (sablonun alan sirasi
  // ekran sirasindan farkli olabildigi icin konumlar olculur).
  const scrollToFirstMissing = (keys: string[]) => {
    setTimeout(() => {
      const top = contentTopRef.current as any;
      if (!top?.measureInWindow) return;
      top.measureInWindow((_tx: number, topY: number) => {
        let pending = keys.length;
        let best: number | null = null;
        keys.forEach((k) => {
          const node = fieldLabelRefs.current[k] as any;
          if (!node?.measureInWindow) { pending -= 1; return; }
          node.measureInWindow((_x: number, y: number) => {
            if (best === null || y < best) best = y;
            pending -= 1;
            if (pending === 0 && best !== null) scrollRef.current?.scrollTo({ y: Math.max(0, best - topY - 24), animated: true });
          });
        });
      });
    }, 60);
  };

  const showMissingFieldsWarning = (missing: TemplateField[]) => {
    const keys = missing.map((f) => f.key);
    setMissingKeys(keys);
    scrollToFirstMissing(keys);
    const names = missing.map((f: TemplateField) => `• ${lang === "tr" ? f.labelTr : f.labelEn}`).join("\n");
    setResultAlert({ visible: true, type: "warning", title: t("svc.requiredTitle"), message: `${t("svc.requiredFieldsMissing")}\n${names}` });
  };

  const showTimeEqualWarning = () => {
    setResultAlert({ visible: true, type: "warning", title: t("svc.warning"), message: t("svc.errorTimeEqual") });
  };

  const handleSave = () => {
    if (!requireSignature()) return;
    proceedSave();
  };

  // Yeni kayitta "emin misiniz?" onayi sorulmaz (zaten musteri imzasi adimi var);
  // guncellemede mevcut kaydi degistirdigi icin onay korunur.
  const proceedSave = () => {
    setSaveAlertVisible(false);
    const missing = missingRequiredFields();
    if (missing.length) {
      showMissingFieldsWarning(missing);
      return;
    }
    setMissingKeys([]);
    if (form.startTime && form.startTime === form.endTime) {
      showTimeEqualWarning();
      return;
    }
    if (isEditing) setSaveAlertVisible(true);
    else confirmSave();
  };

  const confirmSave = async () => {
    setSaveAlertVisible(false);
    const missing = missingRequiredFields();
    if (missing.length) {
      showMissingFieldsWarning(missing);
      return;
    }
    if (form.startTime && form.startTime === form.endTime) {
      showTimeEqualWarning();
      return;
    }
    // Formda gosterilen genel toplam bu kurlarla hesaplandi; backend'in ayni
    // tutari yazmasi icin anlik kur snapshot'ini istekle birlikte gonderiyoruz.
    const tryRates = form.usedProducts.some((p) => (p.currency || "TRY") !== "TRY")
      || (form.laborCurrency || "TRY") !== "TRY"
      ? (await getTryRates()).data ?? undefined
      : undefined;
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
          ucretCurrency: form.feeCurrency || "TRY",
          labor: form.labor || "0.00",
          laborCurrency: form.laborCurrency || "TRY",
          kdvRate: form.kdvRate || "20",
          teknisyen: form.technician || "-",
          teknisyenTelefon: form.technicianPhone,
          tarih: form.documentDate || new Date().toLocaleDateString(locale),
          hizmetler: form.services,
          teknik: form.technical,
          customChips: form.customChips,
          customValues: form.customValues,
          usedProducts: normalizeUsedProducts(form.usedProducts),
          productsMode: form.productsMode,
          deductStock: activeTemplate ? (activeTemplate.deductStock ?? true) : true,
          service: form.services.join(", ") || "-",
          templateName: activeTemplate?.name || undefined,
          templateConfig: templateSnapshot(templateConfig),
          tryRates,
        });
        setResultAlert({ visible: true, type: "success", title: t("svc.success"), message: t("svc.successUpdated") });
        setIsEditing(false);
        setEditingId(null);
        originalFormRef.current = null;
        setForm(freshForm());
        if (isPhoneNow()) setShowForm(false);
        fetchRecords();
      } catch {
        setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorUpdate") });
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
    setForm(freshForm());
    setSelectedCustomerId(null);
  };

  const handleClear = () => {
    if (isEditing && originalFormRef.current) {
      setForm({ ...originalFormRef.current });
    } else {
      setForm(freshForm());
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
      feeCurrency: record.ucretCurrency || "TRY",
      labor: record.labor || "",
      laborCurrency: record.laborCurrency || "TRY",
      kdvRate: record.kdvRate || "20",
      technician: record.teknisyen || currentUserName.current || "-",
      technicianPhone: record.teknisyenTelefon || currentUserPhone.current || "",
      documentDate: record.tarih || "",
      services: record.hizmetler || [],
      technical: record.teknik || [],
      customChips: record.customChips || {},
      customValues: { ...(record.customValues || {}) },
      usedProducts: (record.usedProducts || []).map((p) => ({
        name: p.name || "",
        quantity: p.quantity != null ? String(p.quantity) : "",
        unit: p.unit || "AD",
        unitPrice: p.unitPrice != null ? String(p.unitPrice) : "",
        currency: p.currency || "TRY",
        stockItemId: p.stockItemId ?? null,
        inStock: p.inStock,
        deducted: p.deducted,
        transactionId: p.transactionId ?? null,
      })),
      productsMode: record.productsMode ?? ((record.usedProducts || []).length > 0),
    };
    if (record.dahiliIp && !editForm.customValues.custom_internalIp) editForm.customValues.custom_internalIp = record.dahiliIp;
    if (record.hariciIp && !editForm.customValues.custom_externalIp) editForm.customValues.custom_externalIp = record.hariciIp;
    originalFormRef.current = { ...editForm };
    setForm(editForm);
    setSelectedCustomerId(record.customerId || null);
    setMissingKeys([]);
    setEditingId(record.id);
    setIsEditing(true);
    setShowForm(true);
    scrollToForm();
    if (record.templateName) {
      const tpl = templates.find((t) => t.name === record.templateName);
      if (tpl) setActiveTemplateId(tpl.id);
    }
  };

  // Duzenle/Kopyala sonrasi form sayfanin ustunde dolar; kullanici listede kalmasin.
  const scrollToForm = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  // Kopya: ayni musteriye tekrar eden servisler icin; yeni bir kayittir
  // (bugunun tarihi, imzasiz, stok yeniden dusulur).
  const handleDuplicate = (record: ServiceRecord) => {
    handleEdit(record);
    setForm((prev) => ({
      ...prev,
      documentDate: todayInput(),
      usedProducts: prev.usedProducts.map((p) => ({ ...p, deducted: undefined, transactionId: null })),
    }));
    originalFormRef.current = null;
    setEditingId(null);
    setIsEditing(false);
  };

  const openNewRecord = () => {
    setIsEditing(false);
    setEditingId(null);
    originalFormRef.current = null;
    setForm(freshForm());
    setSelectedCustomerId(null);
    setMissingKeys([]);
    setShowForm(true);
    scrollToForm();
  };

  const closeFormScreen = () => {
    setIsEditing(false);
    setEditingId(null);
    originalFormRef.current = null;
    setForm(freshForm());
    setSelectedCustomerId(null);
    setMissingKeys([]);
    setShowForm(false);
  };

  const isFormDirty = () => {
    const base = isEditing && originalFormRef.current ? originalFormRef.current : freshForm();
    return JSON.stringify(form) !== JSON.stringify(base);
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
    const missing = missingRequiredFields();
    if (missing.length) {
      setSignatureModal(false);
      showMissingFieldsWarning(missing);
      return;
    }
    if (form.startTime && form.startTime === form.endTime) {
      setSignatureModal(false);
      showTimeEqualWarning();
      return;
    }
    // Formda gosterilen genel toplam bu kurlarla hesaplandi; backend'in ayni
    // tutari yazmasi icin anlik kur snapshot'ini istekle birlikte gonderiyoruz.
    const tryRates = form.usedProducts.some((p) => (p.currency || "TRY") !== "TRY")
      || (form.laborCurrency || "TRY") !== "TRY"
      ? (await getTryRates()).data ?? undefined
      : undefined;
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
        ucretCurrency: form.feeCurrency || "TRY",
        labor: form.labor || "0.00",
        laborCurrency: form.laborCurrency || "TRY",
        kdvRate: form.kdvRate || "20",
        teknisyen: form.technician || "-",
        teknisyenTelefon: form.technicianPhone,
        hizmetler: form.services,
        teknik: form.technical,
        customChips: form.customChips,
        customValues: form.customValues,
        usedProducts: normalizeUsedProducts(form.usedProducts),
        productsMode: form.productsMode,
        deductStock: activeTemplate ? (activeTemplate.deductStock ?? true) : true,
        imzali: paths.length > 0,
        signature: paths,
        technicianSignature: technicianSignatureRef.current || null,
        templateName: activeTemplate?.name || undefined,
        templateConfig: templateSnapshot(templateConfig),
        tryRates,
      });
      setResultAlert({ visible: true, type: "success", title: t("svc.success"), message: t("svc.successCreated") });
      // Form yalnizca basarili kayittan sonra temizlenir; hata olursa kullanicinin
      // girdigi bilgiler kaybolmaz.
      setForm(freshForm());
      setSelectedCustomerId(null);
      setEditingId(null);
      setIsEditing(false);
      if (isPhoneNow()) setShowForm(false);
      fetchRecords();
    } catch {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorSave") });
    } finally {
      setLoading(false);
      setSignatureModal(false);
    }
  };

  const filteredRecords = records.filter((k) => {
    if (filterTemplate && k.templateName !== filterTemplate) return false;
    if (filterDate && k.tarih !== filterDate) return false;
    if (filterDocument && !`${k.customer} - ${k.tarih}`.toLowerCase().includes(filterDocument.toLowerCase())) return false;
    if (filterCustomer && !k.customer.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
    if (filter !== "all") {
      // Kayitlarda hem "GG/AA/YYYY" hem "GG.AA.YYYY" (varsayilan tarih) bicimi var.
      const [g, a, y] = (k.tarih || "").split(/[./-]/).map(Number);
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
    feeCurrency: record.ucretCurrency || "TRY",
    labor: record.labor,
    laborCurrency: record.laborCurrency || "TRY",
    kdvRate: record.kdvRate || "20",
    technician: record.teknisyen,
    technicianPhone: record.teknisyenTelefon || "",
    startTime: record.baslangic,
    endTime: record.bitis,
    details: record.detaylar,
    internalIp: record.dahiliIp,
    externalIp: record.hariciIp,
    customChips: record.customChips || {},
    customValues: record.customValues || {},
    usedProducts: (record.usedProducts || []).map((p) => ({
      name: p.name,
      quantity: p.quantity != null ? String(p.quantity) : "",
      unit: p.unit,
      unitPrice: p.unitPrice != null ? String(p.unitPrice) : "",
      currency: p.currency,
      stockItemId: p.stockItemId,
      inStock: p.inStock,
      deducted: p.deducted,
      transactionId: p.transactionId,
    })),
    productsMode: record.productsMode ?? ((record.usedProducts || []).length > 0),
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
    const [companyLogo, companyStamp, ratesResult] = await Promise.all([
      embedImage(base.companyLogo),
      embedImage(base.companyStamp),
      getTryRates(false),
    ]);
    return { ...base, companyLogo, companyStamp, tryRates: ratesResult.data };
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
    setPdfZoom(Platform.OS === "web" ? Math.max(30, Math.min(100, Math.floor(((Dimensions.get("window").width - 48) / 794) * 100 / 5) * 5)) : 50);
    setPdfPreviewVisible(true);
  };

  const performDownloadPDF = async (data: PdfData) => {
    try {
      const html = generateServicePDFHtml(data, t, locale.startsWith("tr") ? "tr" : "en");

      if (Platform.OS === "web") {
        const fileName = [t("svc.pdfFileName"), data.customerName, data.documentDate].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "-").trim();
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
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorPdfCreate") + (error as any).message });
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewData) {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorPdfData") });
      return;
    }
    await performDownloadPDF(pdfPreviewData);
  };

  const handleDelete = async (record: ServiceRecord) => {
    try {
      await serviceApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorDelete") });
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
        const fileName = [t("svc.pdfFileName"), record.customer, record.tarih].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "-").trim();
        await shareWebPdf(html, fileName);
      } else {
        const uri = await printPdfToFile(html);
        await sharePdfFileNative(uri);
      }
    } catch (error) {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorPdfCreate") + (error as any).message });
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
    // Musteriden gelen alanlar dolduysa eksik isaretleri kalkar
    clearMissing("customerName", name);
    clearMissing("serviceAddress", address);
    clearMissing("phone", phone);
  };

  const updateNewCustomerForm = (key: keyof NewCustomerFormData, value: string) =>
    setNewCustomerForm((prev) => ({ ...prev, [key]: value }));

  const resetNewCustomerForm = () => setNewCustomerForm({ ...initialNewCustomerForm });

  const createNewCustomer = () => {
    if (!newCustomerForm.companyName) {
      setResultAlert({ visible: true, type: "warning", title: t("svc.warning"), message: t("svc.errorCompanyRequired") });
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
      clearMissing("customerName", yeni.companyName);
      clearMissing("serviceAddress", yeni.address || "");
      clearMissing("phone", yeni.phone || "");
      resetNewCustomerForm();
      setNewCustomerModal(false);
    }).catch(() => {
      setResultAlert({ visible: true, type: "error", title: t("svc.error"), message: t("svc.errorCustomerAdd") });
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
    ? {
        fields: activeTemplate.fields,
        chipGroups: activeTemplate.chipGroups,
        useProducts: activeTemplate.useProducts ?? false,
        deductStock: activeTemplate.deductStock ?? true,
      }
    : defaultTemplateConfig();

  const selectTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    setActiveTemplateId(id);
    setForm((prev) => ({
      ...prev,
      services: [],
      technical: [],
      customChips: {},
      customValues: {},
      productsMode: tpl ? !!tpl.useProducts : prev.productsMode,
    }));
  };

  useEffect(() => {
    if (isEditing) return;
    setForm((prev) => ({ ...prev, productsMode: activeTemplate ? !!activeTemplate.useProducts : prev.productsMode }));
  }, [activeTemplateId, templates, isEditing]);

  const freshForm = (): ServiceFormData => ({
    ...initialForm,
    documentDate: todayInput(),
    technician: currentUserName.current || "",
    technicianPhone: currentUserPhone.current || "",
    productsMode: activeTemplate ? !!activeTemplate.useProducts : false,
  });

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
    addUsedProduct,
    updateUsedProduct,
    removeUsedProduct,
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
    resetNewCustomerForm,
    createNewCustomer,
    mapSelectorVisible,
    setMapSelectorVisible,
    filteredRecords,
    totalElements,
    hasMoreRecords: records.length < totalElements,
    loadMoreRecords,
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
    resultAlert,
    setResultAlert,
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
    hasSignature,
    techSignatureModal,
    setTechSignatureModal,
    handleTechnicianSignatureSave,
    isMissing,
    isRequiredKey,
    registerFieldLabel,
    scrollRef,
    contentTopRef,
    handleDuplicate,
    openNewRecord,
    closeFormScreen,
    isFormDirty,
  };

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>;
}
