import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Dimensions, Platform, type ScrollView } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";

import { generateQuotePDFHtml } from "../QuotePDF";
import { shareWebPdf, downloadWebPdf } from "../../utils/webPdf";
import { embedImage } from "../../utils/pdfAssets";
import { sharePdfFile } from "../../utils/sharePdf";
import { profileApi } from "../../apiclient/profile";
import { quoteApi, QuoteRecord, type QuoteStatus } from "../../apiclient/quotes";
import { customerApi, Customer } from "../../apiclient/customers";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { freshQuoteForm, todayDateInput, emptyLine, parseNumericInput, initialNewCustomerForm, type QuoteFormData, type QuotePdfData, type QuoteFilter, type NewCustomerFormData, validateQuoteForm, hasQuoteErrors, NO_QUOTE_ERRORS, type QuoteValidation } from "./types";

interface DeleteAlertState {
  visible: boolean;
  record: QuoteRecord | null;
}

interface ResultAlertState {
  visible: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
}

export type RequiredErrors = QuoteValidation;
const NO_REQUIRED_ERRORS: RequiredErrors = NO_QUOTE_ERRORS;

interface QuoteContextValue {
  loading: boolean;
  refreshRecords: () => void;
  form: QuoteFormData;
  updateForm: (key: keyof QuoteFormData, value: string) => void;
  updateLine: (index: number, key: "name" | "details" | "quantity" | "unitPrice" | "currency" | "unit", value: string) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  requiredErrors: RequiredErrors;
  scrollRef: React.RefObject<ScrollView | null>;
  isEditing: boolean;
  handleCancelEditing: () => void;
  handleClear: () => void;
  handleSave: () => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  /** Telefonda: yeni teklif icin formu tam ekran acar. */
  openNewQuote: () => void;
  /** Telefonda: form ekranini kapatip listeye doner (onay cagiran tarafta). */
  closeFormScreen: () => void;
  /** Form, acildigi/yuklendigi andan beri degisti mi? */
  isFormDirty: () => boolean;
  /** Kaydette eksik alan varsa artar; form ilk hatali alana kaydirir. */
  errorScrollNonce: number;
  customerList: Customer[];
  selectedCustomerId: string | null;
  clearCustomerSelection: () => void;
  selectCustomer: (c: Customer) => void;
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
  filteredRecords: QuoteRecord[];
  /** Durum filtresi ("all" = hepsi) ve durum basina teklif sayilari. */
  statusFilter: QuoteStatus | "all";
  setStatusFilter: (s: QuoteStatus | "all") => void;
  statusCounts: Record<QuoteStatus, number>;
  setQuoteStatus: (record: QuoteRecord, status: QuoteStatus) => Promise<void>;
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
  handleDuplicate: (record: QuoteRecord) => void;
  deleteAlert: DeleteAlertState;
  setDeleteAlert: (v: DeleteAlertState) => void;
  handleDelete: (record: QuoteRecord) => void;
  resultAlert: ResultAlertState;
  setResultAlert: (v: ResultAlertState) => void;
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
  const { rates } = useCurrency();
  // Telefonda (768px alti) liste once gelir; form "Yeni Teklif" ile tam ekran acilir.
  const isPhoneNow = () => Dimensions.get("window").width < 768;
  const initialFormRef = useRef<QuoteFormData>(freshQuoteForm());
  const [form, setFormState] = useState<QuoteFormData>(initialFormRef.current);
  // Formun acildigi/yuklendigi andaki hali: kaydedilmemis degisiklik kontrolu icin.
  const baselineRef = useRef<string>(JSON.stringify(initialFormRef.current));
  const loadForm = (f: QuoteFormData) => {
    baselineRef.current = JSON.stringify(f);
    setFormState(f);
  };
  const setForm = setFormState;
  const [errorScrollNonce, setErrorScrollNonce] = useState(0);
  const [requiredErrors, setRequiredErrors] = useState<RequiredErrors>({ ...NO_REQUIRED_ERRORS });
  const [records, setRecords] = useState<QuoteRecord[]>([]);
  const [filter, setFilter] = useState<QuoteFilter>("all");
  const [showForm, setShowForm] = useState(() => !isPhoneNow());
  const [filterDate, setFilterDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSelectModal, setCustomerSelectModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerFormData>({ ...initialNewCustomerForm });
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState("");
  const [pdfPreviewData, setPdfPreviewData] = useState<QuotePdfData | null>(null);
  const [pdfZoom, setPdfZoom] = useState(50);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<DeleteAlertState>({ visible: false, record: null });
  const [resultAlert, setResultAlert] = useState<ResultAlertState>({ visible: false, type: "success", title: "", message: "" });
  const companyLogoRef = useRef<string | null>(null);
  const companyStampRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Duzenle/Kopyala sonrasi form sayfanin ustunde dolar; kullanici listede kalmasin diye
  // forma kaydirilir. Form render edildikten sonra kaydirmak icin kisa gecikme.
  const scrollToForm = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };
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
          gsm: company.gsm || "",
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

  const updateForm = (key: keyof QuoteFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "customerName" && value.trim()) {
      setRequiredErrors((prev) => (prev.customerName ? { ...prev, customerName: false } : prev));
    }
    if (key === "documentDate" || key === "validUntil") {
      // Tarih hatalari iki alana birden bagli (gecerlilik >= belge tarihi); sadece tarihleri yeniden degerlendir.
      setRequiredErrors((prev) => {
        if (!prev.documentDate && !prev.validUntil) return prev;
        const next = validateQuoteForm({ ...form, [key]: value });
        return { ...prev, documentDate: prev.documentDate ? next.documentDate : null, validUntil: prev.validUntil ? next.validUntil : null };
      });
    }
  };

  const updateLine = (index: number, key: "name" | "details" | "quantity" | "unitPrice" | "currency" | "unit", value: string) => {
    setForm((prev) => {
      const lines = prev.lines.map((l, i) => {
        if (i !== index) return l;
        if (key === "quantity" || key === "unitPrice") {
          return { ...l, [key]: value.replace(/[^0-9.,]/g, "") };
        }
        return { ...l, [key]: value };
      });
      return { ...prev, lines };
    });
    const drop = (arr: number[]) => arr.filter((i) => i !== index);
    if (key === "name" && value.trim()) {
      setRequiredErrors((prev) => (prev.lines.includes(index) ? { ...prev, lines: drop(prev.lines) } : prev));
    }
    if (key === "quantity" && parseNumericInput(value) > 0) {
      setRequiredErrors((prev) => (prev.quantity.includes(index) ? { ...prev, quantity: drop(prev.quantity) } : prev));
    }
    if (key === "unitPrice" && parseNumericInput(value) > 0) {
      setRequiredErrors((prev) => (prev.unitPrice.includes(index) ? { ...prev, unitPrice: drop(prev.unitPrice) } : prev));
    }
  };

  const addLine = () => setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));

  const removeLine = (index: number) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
    const shift = (arr: number[]) => arr.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
    setRequiredErrors((prev) => ({
      ...prev,
      lines: shift(prev.lines),
      quantity: shift(prev.quantity),
      unitPrice: shift(prev.unitPrice),
    }));
  };

  const handleSave = () => {
    const errors = validateQuoteForm(form);
    if (hasQuoteErrors(errors)) {
      setRequiredErrors(errors);
      // Eksikler uyari penceresinde listelenir; arkada form ilk hatali alana kayar.
      setErrorScrollNonce((n) => n + 1);
      const missing: string[] = [];
      if (errors.customerName) missing.push(`• ${t("qot.customerName")}`);
      if (errors.documentDate) missing.push(`• ${t("qot.documentDate")}${errors.documentDate === "invalid" ? ` (${t("qot.errDateInvalid")})` : ""}`);
      if (errors.validUntil) {
        const why = errors.validUntil === "invalid" ? t("qot.errDateInvalid") : errors.validUntil === "beforeDocument" ? t("qot.errBeforeDocument") : "";
        missing.push(`• ${t("qot.validUntil").replace(/:$/, "")}${why ? ` (${why})` : ""}`);
      }
      const lineIdx = Array.from(new Set([...errors.lines, ...errors.quantity, ...errors.unitPrice])).sort((x, y) => x - y);
      lineIdx.forEach((i) => {
        const parts: string[] = [];
        if (errors.lines.includes(i)) parts.push(t("qot.productName").toLocaleLowerCase(locale));
        if (errors.quantity.includes(i)) parts.push(t("qot.quantity").toLocaleLowerCase(locale));
        if (errors.unitPrice.includes(i)) parts.push(t("qot.unitPrice").toLocaleLowerCase(locale));
        missing.push(`• ${t("qot.lineN", { n: String(i + 1) })}: ${parts.join(", ")}`);
      });
      setResultAlert({
        visible: true,
        type: "warning",
        title: t("qot.requiredTitle"),
        message: `${t("qot.requiredFieldsMissing")}\n${missing.join("\n")}`,
      });
      return;
    }

    const validLines = form.lines.filter((l) => l.name || l.details);
    const finalForm = { ...form, lines: validLines };
    setForm(finalForm);
    setRequiredErrors({ ...NO_REQUIRED_ERRORS });
    persist(finalForm);
  };

  const persist = async (dataToSave: QuoteFormData) => {
    setLoading(true);
    try {
      const payload: Omit<QuoteRecord, "id"> = {
        title: dataToSave.title || "",
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
        lines: (dataToSave.lines || []).map((l) => ({
          name: l.name,
          details: l.details,
          quantity: parseNumericInput(l.quantity),
          unitPrice: parseNumericInput(l.unitPrice),
          currency: l.currency || "TRY",
          unit: l.unit || "Adet",
        })),
      };
      if (isEditing && editingId !== null) {
        const existingRecord = records.find((r) => r.id === editingId);
        const updatePayload =
          existingRecord && !existingRecord.tryRates && rates
            ? { ...payload, tryRates: rates }
            : payload;
        await quoteApi.update(editingId, updatePayload);
        setResultAlert({ visible: true, type: "success", title: t("qot.success"), message: t("qot.successUpdated") });
      } else {
        await quoteApi.create(rates ? { ...payload, tryRates: rates } : payload);
        setResultAlert({ visible: true, type: "success", title: t("qot.success"), message: t("qot.successCreated") });
      }
      resetForm();
      if (isPhoneNow()) setShowForm(false);
      fetchRecords();
    } catch {
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorSave") });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    loadForm(freshQuoteForm());
    setRequiredErrors({ ...NO_REQUIRED_ERRORS });
    setEditingId(null);
    setIsEditing(false);
    setSelectedCustomerId(null);
  };

  const handleCancelEditing = () => resetForm();

  const handleClear = () => resetForm();

  const isFormDirty = () => JSON.stringify(form) !== baselineRef.current;

  const openNewQuote = () => {
    resetForm();
    setShowForm(true);
    scrollToForm();
  };

  const closeFormScreen = () => {
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (record: QuoteRecord) => {
    loadForm({
      title: record.title || "",
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
      lines: record.lines?.length
        ? record.lines.map((l) => ({
            name: l.name,
            details: l.details,
            quantity: l.quantity != null ? String(l.quantity).replace(".", ",") : "1",
            unitPrice: l.unitPrice != null ? String(l.unitPrice).replace(".", ",") : "",
            currency: l.currency || "TRY",
            unit: l.unit || "Adet",
          }))
        : [emptyLine()],
    });
    setSelectedCustomerId(record.customerId || null);
    setEditingId(record.id);
    setIsEditing(true);
    setShowForm(true);
    setRequiredErrors({ ...NO_REQUIRED_ERRORS });
    scrollToForm();
  };

  const handleDuplicate = (record: QuoteRecord) => {
    loadForm({
      title: record.title || "",
      customerName: record.customer || "",
      contactPerson: record.contactPerson || "",
      email: record.email || "",
      phone: record.telefon || "",
      fax: record.fax || "",
      website: record.website || "",
      address: record.adres || "",
      subscriberNo: record.subscriberNo || "",
      documentDate: todayDateInput(),
      validUntil: todayDateInput(),
      notes: record.notlar || "",
      lines: record.lines?.length
        ? record.lines.map((l) => ({
            name: l.name,
            details: l.details,
            quantity: l.quantity != null ? String(l.quantity).replace(".", ",") : "1",
            unitPrice: l.unitPrice != null ? String(l.unitPrice).replace(".", ",") : "",
            currency: l.currency || "TRY",
            unit: l.unit || "Adet",
          }))
        : [emptyLine()],
    });
    setSelectedCustomerId(record.customerId || null);
    setEditingId(null);
    setIsEditing(false);
    setShowForm(true);
    setRequiredErrors({ ...NO_REQUIRED_ERRORS });
    scrollToForm();
  };

  const handledEditIdRef = useRef<string>("");
  const searchParams = useLocalSearchParams<{ edit?: string }>();
  const editParamId = typeof searchParams.edit === "string" ? searchParams.edit : "";
  useEffect(() => {
    if (!editParamId || handledEditIdRef.current === editParamId) return;
    const rec = records.find((r) => String(r.id) === editParamId);
    if (!rec) return;
    handledEditIdRef.current = editParamId;
    handleEdit(rec);
  }, [editParamId, records, handleEdit]);

  const statusCounts: Record<QuoteStatus, number> = { PENDING: 0, ACCEPTED: 0, REJECTED: 0 };
  records.forEach((r) => { statusCounts[r.status || "PENDING"] += 1; });

  // Durum degisikligi ekranda hemen gorunur; sunucu hata verirse eski haline doner.
  const setQuoteStatus = async (record: QuoteRecord, status: QuoteStatus) => {
    const previous = record.status || "PENDING";
    if (previous === status) return;
    setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, status } : r)));
    try {
      await quoteApi.setStatus(record.id, status);
    } catch {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: previous } : r)));
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorStatus") });
    }
  };

  const filteredRecords = records.filter((k) => {
    if (statusFilter !== "all" && (k.status || "PENDING") !== statusFilter) return false;
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

  const buildPdfData = (record: QuoteRecord): QuotePdfData => {
    const savedRates =
      record.tryRates && record.tryRates.rates && Object.keys(record.tryRates.rates).length ? record.tryRates : null;
    return {
    title: record.title || "",
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
    companyGsm: companyInfoRef.current.gsm,
    companyEmail: companyInfoRef.current.email,
    companyFax: companyInfoRef.current.fax,
    companyWebsite: companyInfoRef.current.website,
    companyTaxNumber: companyInfoRef.current.taxNumber,
    companyLogo: companyLogoRef.current,
    companyStamp: companyStampRef.current,
    tryRates: savedRates || rates,
  };
};

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
        const fileName = [t("qot.pdfFileName"), data.customerName, data.documentDate].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "-").trim();
        await downloadWebPdf(html, fileName);
      } else {
        const fileName = [t("qot.pdfFileName"), data.customerName, data.documentDate].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "-").trim();
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
          margins: { top: 24, bottom: 24, left: 24, right: 24 },
        });
        await sharePdfFile(uri, fileName, {
          mimeType: "application/pdf",
          dialogTitle: t("qot.pdfDialogTitle"),
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorPdfCreate") + (error as any).message });
    }
  };

  const openQuotePDF = async (record: QuoteRecord) => {
    const pdfData = await resolvePdfData(record);
    setPdfPreviewData(pdfData);
    await performDownloadPDF(pdfData);
  };

  // Web'de on izleme A4 sayfayi (794px) pencere genisligine sigdirarak acar (en fazla %100);
  // eskiden sabit %50 idi ve masaustunde yazi okunmuyordu. Native WebView davranisi ayni.
  const initialPreviewZoom = () => {
    if (Platform.OS !== "web") return 50;
    const available = Dimensions.get("window").width - 48;
    return Math.max(30, Math.min(100, Math.floor((available / 794) * 100 / 5) * 5));
  };

  const handleView = async (record: QuoteRecord) => {
    const pdfData = await resolvePdfData(record);
    setPdfPreviewHtml(generateHtml(pdfData));
    setPdfPreviewData(pdfData);
    setPdfZoom(initialPreviewZoom());
    setPdfPreviewVisible(true);
  };

  const handleDownloadPDF = async () => {
    if (!pdfPreviewData) {
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorPdfData") });
      return;
    }
    await performDownloadPDF(pdfPreviewData);
  };

  const handleDelete = async (record: QuoteRecord) => {
    try {
      await quoteApi.delete(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch {
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorDelete") });
    }
  };

  const handleShare = async (record: QuoteRecord) => {
    try {
      const pdfData = await resolvePdfData(record);
      const html = generateHtml(pdfData);
      const fileName = [t("qot.pdfFileName"), record.customer, record.tarih].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "-").trim();
      if (Platform.OS === "web") {
        await shareWebPdf(html, fileName);
      } else {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
          margins: { top: 24, bottom: 24, left: 24, right: 24 },
        });
        await sharePdfFile(uri, fileName, {
          mimeType: "application/pdf",
          dialogTitle: t("qot.pdfDialogTitle"),
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorPdfCreate") + (error as any).message });
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

  const updateNewCustomerForm = (key: keyof NewCustomerFormData, value: string) =>
    setNewCustomerForm((prev) => ({ ...prev, [key]: value }));

  const resetNewCustomerForm = () => setNewCustomerForm({ ...initialNewCustomerForm });

  const createNewCustomer = () => {
    if (!newCustomerForm.companyName.trim()) {
      setResultAlert({ visible: true, type: "warning", title: t("qot.warning"), message: t("qot.errorCompanyRequired") });
      return;
    }
    setLoading(true);
    customerApi
      .create(newCustomerForm)
      .then((res) => {
        const yeni = res.data;
        setCustomerList((prev) => [...prev, yeni]);
        selectCustomer(yeni);
        resetNewCustomerForm();
        setNewCustomerModal(false);
      })
      .catch(() => {
        setResultAlert({ visible: true, type: "error", title: t("qot.error"), message: t("qot.errorCustomerAdd") });
      })
      .finally(() => setLoading(false));
  };

  const resetFilters = () => {
    setFilterDate("");
    setFilterCustomer("");
    setFilter("all");
    setStatusFilter("all");
  };

  const value: QuoteContextValue = {
    loading,
    refreshRecords: fetchRecords,
    form,
    updateForm,
    updateLine,
    addLine,
    removeLine,
    requiredErrors,
    scrollRef,
    isEditing,
    handleCancelEditing,
    handleClear,
    handleSave,
    showForm,
    setShowForm,
    openNewQuote,
    closeFormScreen,
    isFormDirty,
    errorScrollNonce,
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
    filteredRecords,
    statusFilter,
    setStatusFilter,
    statusCounts,
    setQuoteStatus,
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
    handleDuplicate,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    resultAlert,
    setResultAlert,
    pdfPreviewVisible,
    setPdfPreviewVisible,
    pdfPreviewHtml,
    pdfZoom,
    setPdfZoom,
    handleDownloadPDF,
  };

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}
