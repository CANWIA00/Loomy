import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Platform, type ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { generateQuotePDFHtml } from "../QuotePDF";
import { shareWebPdf, downloadWebPdf } from "../../utils/webPdf";
import { embedImage } from "../../utils/pdfAssets";
import { profileApi } from "../../api/profile";
import { quoteApi, QuoteRecord } from "../../api/quotes";
import { customerApi, Customer } from "../../api/customers";
import { useLanguage } from "../../contexts/LanguageContext";
import { initialQuoteForm, emptyLine, type QuoteFormData, type QuotePdfData, type QuoteFilter } from "./types";

interface DeleteAlertState {
  visible: boolean;
  record: QuoteRecord | null;
}

interface QuoteContextValue {
  loading: boolean;
  refreshRecords: () => void;
  form: QuoteFormData;
  updateForm: (key: keyof QuoteFormData, value: string) => void;
  updateLine: (index: number, key: "name" | "details" | "quantity" | "unitPrice", value: string) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  scrollRef: React.RefObject<ScrollView | null>;
  isEditing: boolean;
  handleCancelEditing: () => void;
  handleClear: () => void;
  handleSave: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  customerList: Customer[];
  selectedCustomerId: string | null;
  clearCustomerSelection: () => void;
  selectCustomer: (c: Customer) => void;
  customerSelectModal: boolean;
  setCustomerSelectModal: (v: boolean) => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  filteredRecords: QuoteRecord[];
  filter: QuoteFilter;
  setFilter: (f: QuoteFilter) => void;
  filterDate: string;
  setFilterDate: (v: string) => void;
  filterCustomer: string;
  setFilterCustomer: (v: string) => void;
  resetFilters: () => void;
  handleView: (record: QuoteRecord) => void;
  openQuotePDF: (record: QuoteRecord) => void;
  handleShare: (record: QuoteRecord) => void;
  handleEdit: (record: QuoteRecord) => void;
  deleteAlert: DeleteAlertState;
  setDeleteAlert: (v: DeleteAlertState) => void;
  handleDelete: (record: QuoteRecord) => void;
  pdfPreviewVisible: boolean;
  setPdfPreviewVisible: (v: boolean) => void;
  pdfPreviewHtml: string;
  pdfZoom: number;
  setPdfZoom: React.Dispatch<React.SetStateAction<number>>;
  handleDownloadPDF: () => void;
}

const QuoteContext = createContext<QuoteContextValue | undefined>(undefined);

export function useQuotes() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuotes must be used within QuotesProvider");
  return ctx;
}

export function QuotesProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState<QuoteFormData>({ ...initialQuoteForm });
  const [records, setRecords] = useState<QuoteRecord[]>([]);
  const [filter, setFilter] = useState<QuoteFilter>("all");
  const [showForm, setShowForm] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSelectModal, setCustomerSelectModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState<QuotePdfData | null>(null);
  const [pdfZoom, setPdfZoom] = useState(60);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlertState>({ visible: false, record: null });
  const companyLogoRef = useRef<string | null>(null);
  const companyStampRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const companyInfoRef = useRef<{ name: string; address: string; phone: string; email: string; fax: string; website: string; taxNumber: string }>({
    name: "",
    address: "",
    phone: "",
    email: "",
    fax: "",
    website: "",
    taxNumber: "",
  });

  const fetchRecords = useCallback(async () => {
    try {
      const res = await quoteApi.getAll(0, 100);
      setRecords(res.data.content);
    } catch (e: any) {
      console.warn("fetchRecords (quotes) failed:", e?.message || e);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerApi.getAllSimple();
      setCustomerList(res.data);
    } catch (e: any) {
      console.warn("fetchCustomers (quotes) failed:", e?.message || e);
    }
  }, []);

  const loadCompany = useCallback(async () => {
    try {
      const res = await profileApi.getProfile();
      const company = res.data.company;
      if (company) {
        companyInfoRef.current = {
          name: company.name || "",
          address: company.address || "",
          phone: company.phone || "",
          email: company.email || "",
          fax: company.fax || "",
          website: company.website || "",
          taxNumber: company.taxNumber || "",
        };
        companyLogoRef.current = company.logoUrl || null;
        companyStampRef.current = company.stampUrl || null;
      }
    } catch (e: any) {
      console.warn("loadCompany (quotes) failed:", e?.message || e);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchCustomers();
    loadCompany();
  }, [fetchRecords, fetchCustomers, loadCompany]);

  useFocusEffect(
    useCallback(() => {
      fetchRecords();
      loadCompany();
    }, [fetchRecords, loadCompany])
  );

  const updateForm = (key: keyof QuoteFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateLine = (index: number, key: "name" | "details" | "quantity" | "unitPrice", value: string) =>
    setForm((prev) => {
      const lines = prev.lines.map((l, i) => {
        if (i !== index) return l;
        if (key === "quantity" || key === "unitPrice") {
          const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
          const num = parseFloat(cleaned);
          return { ...l, [key]: isNaN(num) ? 0 : num };
        }
        return { ...l, [key]: value };
      });
      return { ...prev, lines };
    });

  const addLine = () => setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));

  const removeLine = (index: number) =>
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));

  const handleSave = () => {
    if (!form.customerName) {
      Alert.alert(t("qot.warning"), t("qot.customerRequired"));
      return;
    }
    const validLines = form.lines.filter((l) => l.name || l.details);
    if (validLines.length === 0) {
      Alert.alert(t("qot.warning"), t("qot.lineRequired"));
      return;
    }
    const finalForm = {
      ...form,
      lines: validLines.map((l) => ({
        name: l.name,
        details: l.details,
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      })),
    };
    setForm(finalForm);
    persist(finalForm);
  };

  const persist = async (dataToSave: QuoteFormData) => {
    setLoading(true);
    try {
      const payload: Omit<QuoteRecord, "id"> = {
        tarih: dataToSave.documentDate || new Date().toLocaleDateString(locale),
        customer: dataToSave.customerName,
        customerId: selectedCustomerId || undefined,
        contactPerson: dataToSave.contactPerson,
        email: dataToSave.email,
        telefon: dataToSave.phone,
        fax: dataToSave.fax,
        website: dataToSave.website,
        adres: dataToSave.address,
        subscriberNo: dataToSave.subscriberNo,
        notlar: dataToSave.notes,
        validUntil: dataToSave.validUntil,
        lines: dataToSave.lines,
      };
      if (isEditing && editingId !== null) {
        await quoteApi.update(editingId, payload);
        Alert.alert(t("qot.success"), t("qot.successUpdated"));
      } else {
        await quoteApi.create(payload);
        Alert.alert(t("qot.success"), t("qot.successCreated"));
      }
      resetForm();
      fetchRecords();
    } catch {
      Alert.alert(t("qot.error"), t("qot.errorSave"));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ ...initialQuoteForm });
    setEditingId(null);
    setIsEditing(false);
    setSelectedCustomerId(null);
  };

  const handleCancelEditing = () => resetForm();

  const handleClear = () => resetForm();

  const handleEdit = (record: QuoteRecord) => {
    setForm({
      customerName: record.customer || "",
      contactPerson: record.contactPerson || "",
      email: record.email || "",
      phone: record.telefon || "",
      fax: record.fax || "",
      website: record.website || "",
      address: record.adres || "",
      subscriberNo: record.subscriberNo || "",
      documentDate: record.tarih || "",
      validUntil: record.validUntil || "",
      notes: record.notlar || "",
      lines: record.lines?.length ? record.lines : [emptyLine()],
    });
    setSelectedCustomerId(record.customerId || null);
    setEditingId(record.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const filteredRecords = records.filter((k) => {
    if (filterDate && k.tarih !== filterDate) return false;
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

  const buildPdfData = (record: QuoteRecord): QuotePdfData => ({
    customerName: record.customer,
    contactPerson: record.contactPerson,
    documentDate: record.tarih,
    validUntil: record.validUntil,
    email: record.email,
    phone: record.telefon,
    fax: record.fax,
    website: record.website,
    address: record.adres,
    subscriberNo: record.subscriberNo,
    notes: record.notlar,
    lines: record.lines || [],
    companyName: companyInfoRef.current.name,
    companyAddress: companyInfoRef.current.address,
    companyPhone: companyInfoRef.current.phone,
    companyEmail: companyInfoRef.current.email,
    companyFax: companyInfoRef.current.fax,
    companyWebsite: companyInfoRef.current.website,
    companyTaxNumber: companyInfoRef.current.taxNumber,
    companyLogo: companyLogoRef.current,
    companyStamp: companyStampRef.current,
  });

  const resolvePdfData = async (record: QuoteRecord): Promise<QuotePdfData> => {
    const base = buildPdfData(record);
    const [companyLogo, companyStamp] = await Promise.all([
      embedImage(base.companyLogo),
      embedImage(base.companyStamp),
    ]);
    return { ...base, companyLogo, companyStamp };
  };

  const generateHtml = (data: QuotePdfData) =>
    generateQuotePDFHtml(data, t, locale.startsWith("tr") ? "tr" : "en");

  const performDownloadPDF = async (data: QuotePdfData) => {
    try {
      const html = generateHtml(data);
      if (Platform.OS === "web") {
        const fileName = `${data.customerName || "teklif"} - ${data.documentDate || ""}`.replace(/[\\/:*?"<>|]+/g, "-");
        await downloadWebPdf(html, fileName);
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("qot.pdfDialogTitle"),
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      Alert.alert(t("qot.error"), t("qot.errorPdfCreate") + (error as any).message);
    }
  };

  const openQuotePDF = async (record: QuoteRecord) => {
    const pdfData = await resolvePdfData(record);
    setPdfPreviewData(pdfData);
    await performDownloadPDF(pdfData);
  };

  const handleView = async (record: QuoteRecord) => {
    const pdfData = await resolvePdfData(record);
    setPdfPreviewHtml(generateHtml(pdfData));
    setPdfPreviewData(pdfData);
    setPdfZoom(60);
    setPdfPreviewVisible(true);
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewData) {
      Alert.alert(t("qot.error"), t("qot.errorPdfData"));
      return;
    }
    await performDownloadPDF(pdfPreviewData);
  };

  const handleDelete = async (record: QuoteRecord) => {
    try {
      await quoteApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      Alert.alert(t("qot.error"), t("qot.errorDelete"));
    }
  };

  const handleShare = async (record: QuoteRecord) => {
    try {
      const pdfData = await resolvePdfData(record);
      const html = generateHtml(pdfData);
      const fileName = `${record.customer || "teklif"} - ${record.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
      if (Platform.OS === "web") {
        await shareWebPdf(html, fileName);
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: t("qot.pdfDialogTitle"),
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      Alert.alert(t("qot.error"), t("qot.errorPdfCreate") + (error as any).message);
    }
  };

  const clearCustomerSelection = () => {
    setSelectedCustomerId(null);
    setForm((prev) => ({
      ...prev,
      customerName: "",
      contactPerson: "",
      address: "",
      phone: "",
      email: "",
      fax: "",
      website: "",
      subscriberNo: "",
    }));
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerSelectModal(false);
    setForm((prev) => ({
      ...prev,
      customerName: c.companyName || "",
      contactPerson: c.contactPerson || "",
      address: c.address || "",
      phone: c.phone || "",
      email: c.email || "",
      fax: c.fax || "",
      website: c.website || "",
      subscriberNo: c.subscriberNo || "",
    }));
  };

  const resetFilters = () => {
    setFilterDate("");
    setFilterCustomer("");
    setFilter("all");
  };

  const value: QuoteContextValue = {
    loading,
    refreshRecords: fetchRecords,
    form,
    updateForm,
    updateLine,
    addLine,
    removeLine,
    scrollRef,
    isEditing,
    handleCancelEditing,
    handleClear,
    handleSave,
    showForm,
    setShowForm,
    customerList,
    selectedCustomerId,
    clearCustomerSelection,
    selectCustomer,
    customerSelectModal,
    setCustomerSelectModal,
    customerSearch,
    setCustomerSearch,
    filteredRecords,
    filter,
    setFilter,
    filterDate,
    setFilterDate,
    filterCustomer,
    setFilterCustomer,
    resetFilters,
    handleView,
    openQuotePDF,
    handleShare,
    handleEdit,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    pdfPreviewVisible,
    setPdfPreviewVisible,
    pdfPreviewHtml,
    pdfZoom,
    setPdfZoom,
    handleDownloadPDF,
  };

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}
