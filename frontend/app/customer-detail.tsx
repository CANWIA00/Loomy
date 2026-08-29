import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Platform, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { WebView } from "react-native-webview";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import ScreenHeader from "../components/ScreenHeader";
import CustomAlert from "../components/CustomAlert";
import { customerApi, type Customer } from "../api/customers";
import { serviceApi, type ServiceRecord } from "../api/services";
import { quoteApi, type QuoteRecord } from "../api/quotes";
import { paymentApi, type PaymentRecord } from "../api/payments";
import { profileApi } from "../api/profile";
import { generateServicePDFHtml } from "../components/ServicePDF";
import { generateQuotePDFHtml } from "../components/QuotePDF";
import { generateCustomerHistoryPDFHtml, type CustomerHistoryPdfData } from "../components/CustomerHistoryPDF";
import { shareWebPdf, downloadWebPdf } from "../utils/webPdf";
import { embedImage } from "../utils/pdfAssets";
import type { PdfData } from "../components/services/types";
import type { QuotePdfData } from "../components/quotes/types";

type DetailPayload =
  | { kind: "service"; record: ServiceRecord }
  | { kind: "quote"; record: QuoteRecord };

const quoteTotal = (q: QuoteRecord) =>
  (q.lines || []).reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | number }) {
  const { colors } = useTheme();
  const hasValue = value !== undefined && value !== null && String(value).length > 0 && String(value) !== "-";
  return (
    <View className="flex-row">
      <Ionicons name={icon as any} size={16} color={colors.textMuted} style={{ width: 22, marginTop: 2 }} />
      <View className="flex-1 ml-1">
        <Text className="text-xs" style={{ color: colors.textMuted }}>{label}</Text>
        <Text className="text-sm font-medium" style={{ color: hasValue ? colors.text : colors.textMuted }}>
          {hasValue ? value : "-"}
        </Text>
      </View>
    </View>
  );
}

function ChipList({ title, items }: { title: string; items?: string[] }) {
  const { colors } = useTheme();
  if (!items || items.length === 0) return null;
  return (
    <View>
      <Text className="text-xs" style={{ color: colors.textMuted }}>{title}</Text>
      <View className="flex-row flex-wrap gap-1.5 mt-1">
        {items.map((it, i) => (
          <View key={i} className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.primary + "15" }}>
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>{it}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RecordDetailModal({
  payload,
  onClose,
  onEdit,
  onDelete,
}: {
  payload: DetailPayload | null;
  onClose: () => void;
  onEdit: (p: DetailPayload) => void;
  onDelete: (p: DetailPayload) => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={!!payload} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl w-11/12 max-w-lg max-h-[85%]" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: colors.borderAlt }}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {payload?.kind === "service" ? t("cst.serviceReports") : t("cst.quotes")}
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel={t("cst.close")}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView className="px-5 pt-3" contentContainerStyle={{ paddingBottom: 8 }}>
            {payload?.kind === "service" && (
              <View className="gap-3">
                <DetailRow icon="calendar-outline" label={t("cst.recordDate")} value={payload.record.tarih} />
                <DetailRow icon="construct-outline" label={t("cst.serviceType")} value={payload.record.service} />
                <DetailRow icon="business-outline" label={t("cst.companyName")} value={payload.record.customer} />
                <DetailRow icon="location-outline" label={t("cst.address")} value={payload.record.adres} />
                <DetailRow icon="call-outline" label={t("cst.phone")} value={payload.record.telefon} />
                <DetailRow icon="time-outline" label={t("cst.startTime")} value={payload.record.baslangic} />
                <DetailRow icon="time-outline" label={t("cst.endTime")} value={payload.record.bitis} />
                <DetailRow icon="cash-outline" label={t("cst.fee")} value={payload.record.ucret} />
                <DetailRow icon="person-outline" label={t("cst.technician")} value={payload.record.teknisyen} />
                <ChipList title={t("cst.servicesPerformed")} items={payload.record.hizmetler} />
                <ChipList title={t("cst.technicalInfo")} items={payload.record.teknik} />
                {payload.record.detaylar ? (
                  <DetailRow icon="document-text-outline" label={t("cst.details")} value={payload.record.detaylar} />
                ) : null}
              </View>
            )}

            {payload?.kind === "quote" && (
              <View className="gap-3">
                <DetailRow icon="calendar-outline" label={t("cst.recordDate")} value={payload.record.tarih} />
                <DetailRow icon="checkmark-circle-outline" label={t("cst.validUntil")} value={payload.record.validUntil} />
                <DetailRow icon="business-outline" label={t("cst.companyName")} value={payload.record.customer} />
                <DetailRow icon="person-outline" label={t("cst.contactPerson")} value={payload.record.contactPerson} />
                <DetailRow icon="call-outline" label={t("cst.phone")} value={payload.record.telefon} />
                <DetailRow icon="print-outline" label={t("cst.fax")} value={payload.record.fax} />
                <DetailRow icon="mail-outline" label={t("cst.email")} value={payload.record.email} />
                <DetailRow icon="globe-outline" label={t("cst.website")} value={payload.record.website} />
                <DetailRow icon="location-outline" label={t("cst.address")} value={payload.record.adres} />
                <DetailRow icon="card-outline" label={t("cst.subscriberNo")} value={payload.record.subscriberNo} />

                <View className="mt-1">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>{t("cst.quoteItems")}</Text>
                  <View className="mt-1 border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
                    <View className="flex-row py-2 px-3" style={{ backgroundColor: colors.bgInput }}>
                      <Text className="flex-1 text-xs font-semibold" style={{ color: colors.text }}>{t("qot.product")}</Text>
                      <Text className="w-14 text-xs font-semibold text-right" style={{ color: colors.text }}>{t("qot.quantity")}</Text>
                      <Text className="w-20 text-xs font-semibold text-right" style={{ color: colors.text }}>{t("qot.unitPrice")}</Text>
                      <Text className="w-20 text-xs font-semibold text-right" style={{ color: colors.text }}>{t("qot.total")}</Text>
                    </View>
                    {payload.record.lines.map((l, i) => (
                      <View key={i} className="flex-row py-2 px-3 border-t" style={{ borderColor: colors.borderAlt }}>
                        <Text className="flex-1 text-xs" style={{ color: colors.text }} numberOfLines={1}>{l.name}</Text>
                        <Text className="w-14 text-xs text-right" style={{ color: colors.textSecondary }}>{l.quantity}</Text>
                        <Text className="w-20 text-xs text-right" style={{ color: colors.textSecondary }}>{l.unitPrice}</Text>
                        <Text className="w-20 text-xs text-right" style={{ color: colors.text }}>
                          {((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </Text>
                      </View>
                    ))}
                    <View className="flex-row justify-end py-2 px-3 border-t" style={{ borderColor: colors.border }}>
                      <Text className="text-sm font-bold" style={{ color: colors.text }}>{t("cst.quoteTotal")}: </Text>
                      <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                        {quoteTotal(payload.record).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </Text>
                    </View>
                  </View>
                </View>

                {payload.record.notlar ? (
                  <DetailRow icon="document-text-outline" label={t("cst.notes")} value={payload.record.notlar} />
                ) : null}
              </View>
            )}
          </ScrollView>
          {payload ? (
            <View className="flex-row gap-3 border-t px-5 py-4" style={{ borderColor: colors.borderAlt }}>
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
                <Text className="text-sm font-semibold" style={{ color: colors.textMuted }}>{t("cst.close")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(payload)}
                className="flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.danger + "15" }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                <Text className="text-sm font-semibold" style={{ color: colors.danger }}>{t("cst.delete")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEdit(payload)}
                className="flex-1 h-11 rounded-xl items-center justify-center flex-row gap-2"
                style={{ backgroundColor: colors.primary + "15" }}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>{t("cst.edit")}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function PreviewPdfModal({
  visible,
  html,
  zoom,
  setZoom,
  onClose,
  onDownload,
}: {
  visible: boolean;
  html: string;
  zoom: number;
  setZoom: (z: number) => void;
  onClose: () => void;
  onDownload: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.serviceForm")}</Text>
          <TouchableOpacity
            className="h-9 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={onClose}
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
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center center",
                  flexShrink: 0,
                } as any}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: "#e5e5e5" }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 12 }}
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
                  source={{ html }}
                  style={{ width: "100%", height: Math.max((Dimensions.get("window").width - 24) * 1.414, 700), backgroundColor: "white" }}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          )}
        </View>
        <View className="px-4 py-3 border-t" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center justify-center gap-4 mb-3">
            <TouchableOpacity
              onPress={() => setZoom(Math.max(20, zoom - 10))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold min-w-[50px] text-center" style={{ color: colors.text }}>%{zoom}</Text>
            <TouchableOpacity
              onPress={() => setZoom(Math.min(150, zoom + 10))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full h-12 rounded-xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: colors.primary }}
            onPress={onDownload}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="font-semibold" style={{ color: "white" }}>{t("svc.downloadPdf")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SectionHeader({ icon, title, count }: { icon: string; title: string; count: number }) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text className="text-base font-bold" style={{ color: colors.text }}>{title}</Text>
      <Text className="text-xs" style={{ color: colors.textMuted }}>({count})</Text>
    </View>
  );
}

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const isAdmin = useAuth().user?.role === "ADMIN";
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const id = params.id || "";
  const name = params.name || "";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);

  const companyLogoRef = useRef<string | null>(null);
  const companyStampRef = useRef<string | null>(null);
  const technicianSignatureRef = useRef<any>(null);
  const companyInfoRef = useRef<{ name: string; address: string; phone: string; email: string; fax: string; website: string; taxNumber: string }>({
    name: "", address: "", phone: "", email: "", fax: "", website: "", taxNumber: "",
  });

  const [preview, setPreview] = useState<{ html: string; data: PdfData | QuotePdfData } | null>(null);
  const [previewZoom, setPreviewZoom] = useState(60);
  const [toggleAlert, setToggleAlert] = useState<{ visible: boolean; record: PaymentRecord | null }>({ visible: false, record: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      let c: Customer | null = null;
      try {
        if (id) c = (await customerApi.getById(id)).data;
      } catch {}
      if (!c) {
        c = {
          id, companyName: name || "?", subscriberNo: "", address: "", email: "",
          phone: "", contactPerson: "", contactPhone: "",
        } as Customer;
      }
      setCustomer(c);

      try {
        const profile = (await profileApi.getProfile()).data;
        if (profile) {
          const company = profile.company;
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
          const sig = profile.user?.signature;
          if (sig) {
            try {
              technicianSignatureRef.current = typeof sig === "string" ? JSON.parse(sig) : sig;
            } catch {}
          }
        }
      } catch {}

      const customersMatch = (recordCustomer?: string) => {
        if (c && c.id) {
          if (id && recordCustomer === id) return true;
        }
        const nm = (recordCustomer || "").toLowerCase().trim();
        const target = (c?.companyName || "").toLowerCase().trim();
        return !!nm && !!target && (nm === target || nm.includes(target) || target.includes(nm));
      };

      const [svcRes, qRes, payRes] = await Promise.all([
        serviceApi.getAll(0, 100),
        quoteApi.getAll(0, 100),
        paymentApi.getAll(0, 200),
      ]);

      const svc = (svcRes.data.content as ServiceRecord[]).filter((r) =>
        (id && r.customerId === id) || customersMatch(r.customer));
      const qts = (qRes.data.content as QuoteRecord[]).filter((r) =>
        (id && r.customerId === id) || customersMatch(r.customer));
      const pays = (payRes.data.content as PaymentRecord[]).filter((r) =>
        (id && r.customerId === id) || customersMatch(r.customer));

      setServices(svc);
      setQuotes(qts);
      setPayments(pays);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, name]);

  useEffect(() => { load(); }, [load]);

  const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleEditRecord = (p: DetailPayload) => {
    setDetail(null);
    if (p.kind === "service") {
      router.push({ pathname: "/services", params: { edit: String(p.record.id) } });
    } else {
      router.push({ pathname: "/quotes", params: { edit: String(p.record.id) } });
    }
  };

  const handleDeleteRecord = (p: DetailPayload) => {
    Alert.alert(t("cst.delete"), t("cst.confirmDeleteRecord"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("cst.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (p.kind === "service") {
              await serviceApi.delete(p.record.id);
              setServices((prev) => prev.filter((r) => r.id !== p.record.id));
            } else {
              await quoteApi.delete(p.record.id);
              setQuotes((prev) => prev.filter((r) => r.id !== p.record.id));
            }
            setDetail(null);
            Alert.alert(t("common.success"), t("cst.recordDeleted"));
          } catch {
            Alert.alert(t("common.warning"), t("svc.errorDelete"));
          }
        },
      },
    ]);
  };

  const pdfLang = locale.startsWith("tr") ? "tr" : "en";

  const resolveServicePdf = async (s: ServiceRecord): Promise<PdfData> => {
    const base: PdfData = {
      customerName: s.customer,
      documentDate: s.tarih,
      serviceAddress: s.adres,
      phone: s.telefon,
      services: s.hizmetler || [],
      technical: s.teknik || [],
      fee: s.ucret,
      technician: s.teknisyen,
      startTime: s.baslangic,
      endTime: s.bitis,
      details: s.detaylar,
      internalIp: s.dahiliIp,
      externalIp: s.hariciIp,
      customChips: s.customChips || {},
      customValues: s.customValues || {},
      signature: s.signature || null,
      technicianSignature: s.technicianSignature || technicianSignatureRef.current || null,
      companyLogo: companyLogoRef.current,
      companyStamp: companyStampRef.current,
      templateName: s.templateName || null,
      templateConfig: s.templateConfig || null,
    };
    const [logo, stamp] = await Promise.all([embedImage(base.companyLogo), embedImage(base.companyStamp)]);
    return { ...base, companyLogo: logo, companyStamp: stamp };
  };

  const resolveQuotePdf = async (q: QuoteRecord): Promise<QuotePdfData> => {
    const base: QuotePdfData = {
      customerName: q.customer,
      contactPerson: q.contactPerson,
      documentDate: q.tarih,
      validUntil: q.validUntil,
      email: q.email,
      phone: q.telefon,
      fax: q.fax,
      website: q.website,
      address: q.adres,
      subscriberNo: q.subscriberNo,
      notes: q.notlar,
      lines: q.lines || [],
      companyName: companyInfoRef.current.name,
      companyAddress: companyInfoRef.current.address,
      companyPhone: companyInfoRef.current.phone,
      companyEmail: companyInfoRef.current.email,
      companyFax: companyInfoRef.current.fax,
      companyWebsite: companyInfoRef.current.website,
      companyTaxNumber: companyInfoRef.current.taxNumber,
      companyLogo: companyLogoRef.current,
      companyStamp: companyStampRef.current,
    };
    const [logo, stamp] = await Promise.all([embedImage(base.companyLogo), embedImage(base.companyStamp)]);
    return { ...base, companyLogo: logo, companyStamp: stamp };
  };

  const publishPdf = async (html: string, fileName: string, dialogTitle: string, download: boolean) => {
    try {
      if (Platform.OS === "web") {
        if (download) await downloadWebPdf(html, fileName);
        else await shareWebPdf(html, fileName);
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle, UTI: "com.adobe.pdf" });
      }
    } catch (error) {
      Alert.alert(t("common.warning"), t("svc.errorPdfCreate") + (error as any).message);
    }
  };

  const handleShareService = async (s: ServiceRecord) => {
    const data = await resolveServicePdf(s);
    const html = generateServicePDFHtml(data, t, pdfLang);
    const fileName = `${s.customer || "servis"} - ${s.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
    await publishPdf(html, fileName, t("svc.pdfDialogTitle"), false);
  };

  const handleDownloadService = async (s: ServiceRecord) => {
    const data = await resolveServicePdf(s);
    const html = generateServicePDFHtml(data, t, pdfLang);
    const fileName = `${s.customer || "servis"} - ${s.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
    await publishPdf(html, fileName, t("svc.pdfDialogTitle"), true);
  };

  const handleViewService = async (s: ServiceRecord) => {
    const data = await resolveServicePdf(s);
    const html = generateServicePDFHtml(data, t, pdfLang);
    setPreview({ html, data });
    setPreviewZoom(60);
  };

  const handleShareQuote = async (q: QuoteRecord) => {
    const data = await resolveQuotePdf(q);
    const html = generateQuotePDFHtml(data, t, pdfLang);
    const fileName = `${q.customer || "teklif"} - ${q.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
    await publishPdf(html, fileName, t("qot.pdfDialogTitle"), false);
  };

  const handleDownloadQuote = async (q: QuoteRecord) => {
    const data = await resolveQuotePdf(q);
    const html = generateQuotePDFHtml(data, t, pdfLang);
    const fileName = `${q.customer || "teklif"} - ${q.tarih}`.replace(/[\\/:*?"<>|]+/g, "-");
    await publishPdf(html, fileName, t("qot.pdfDialogTitle"), true);
  };

  const handleViewQuote = async (q: QuoteRecord) => {
    const data = await resolveQuotePdf(q);
    const html = generateQuotePDFHtml(data, t, pdfLang);
    setPreview({ html, data });
    setPreviewZoom(60);
  };

  const handlePreviewDownload = async () => {
    if (!preview) return;
    const { html, data } = preview;
    const isService = "serviceAddress" in data;
    const customer = isService ? (data as PdfData).customerName : (data as QuotePdfData).customerName;
    const date = isService ? (data as PdfData).documentDate : (data as QuotePdfData).documentDate;
    const fileName = `${customer || (isService ? "servis" : "teklif")} - ${date || ""}`.replace(/[\\/:*?"<>|]+/g, "-");
    const dialogTitle = isService ? t("svc.pdfDialogTitle") : t("qot.pdfDialogTitle");
    await publishPdf(html, fileName, dialogTitle, true);
  };

  const handleTogglePayment = async (pm: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(pm.id, !pm.paid);
      setPayments((prev) => prev.map((p) => (p.id === pm.id ? { ...p, paid: !p.paid } : p)));
    } catch {
      Alert.alert(t("common.warning"), t("pay.errorUpdate"));
    }
  };

  const resolveHistoryPdf = async (): Promise<CustomerHistoryPdfData> => {
    const logo = await embedImage(companyLogoRef.current);
    return {
      companyName: companyInfoRef.current.name,
      companyLogo: logo,
      customerName: customer?.companyName || name || "?",
      customerPhone: customer?.phone || customer?.contactPhone || "",
      customerAddress: customer?.address || "",
      customerSubscriberNo: customer?.subscriberNo || "",
      documentDate: new Date().toLocaleDateString(locale),
      services: services.map((s) => ({
        tarih: s.tarih,
        service: s.service || s.customer,
        teknisyen: s.teknisyen,
        fee: s.ucret,
      })),
      quotes: quotes.map((q) => ({
        tarih: q.tarih,
        customer: q.customer,
        total: quoteTotal(q),
        validUntil: q.validUntil,
      })),
      payments: payments.map((p) => ({
        tarih: p.tarih,
        serviceType: p.serviceType || p.customer,
        amount: p.amount,
        paid: p.paid,
      })),
    };
  };

  const runHistoryPdf = async (download: boolean) => {
    try {
      const data = await resolveHistoryPdf();
      const html = generateCustomerHistoryPDFHtml(data, t, pdfLang);
      const fileName = `${data.customerName || "musteri"} - gecmis`.replace(/[\\/:*?"<>|]+/g, "-");
      await publishPdf(html, fileName, t("cst.historyTitle"), download);
    } catch (error) {
      Alert.alert(t("common.warning"), t("svc.errorPdfCreate") + (error as any).message);
    }
  };

  return (
    <>
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader
            title={customer?.companyName || name || t("cst.detail")}
            subtitle={t("cst.detail")}
          />
          {loading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-sm mt-3" style={{ color: colors.textMuted }}>{t("cst.loadingRecords")}</Text>
              </View>
            ) : error ? (
              <Text className="text-sm text-center mt-10" style={{ color: colors.danger }}>{t("cst.errorLoadRecords")}</Text>
            ) : (
              <>
                {customer && (
                  <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: colors.bgCard }}>
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
                        <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                          {(customer.companyName || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold" style={{ color: colors.text }}>{customer.companyName}</Text>
                        <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{customer.contactPerson}</Text>
                      </View>
                    </View>
                    <Text className="text-xs font-semibold mb-1" style={{ color: colors.textMuted }}>{t("cst.customerInfo")}</Text>
                    <View className="gap-2">
                      {(customer.phone || customer.contactPhone) ? (
                        <DetailRow icon="call-outline" label={t("cst.phone")} value={customer.phone || customer.contactPhone} />
                      ) : null}
                      {customer.subscriberNo ? (
                        <DetailRow icon="card-outline" label={t("cst.subscriberNo")} value={customer.subscriberNo} />
                      ) : null}
                      {customer.email ? (<DetailRow icon="mail-outline" label={t("cst.email")} value={customer.email} />) : null}
                      {customer.website ? (<DetailRow icon="globe-outline" label={t("cst.website")} value={customer.website} />) : null}
                      {customer.address ? (<DetailRow icon="location-outline" label={t("cst.address")} value={customer.address} />) : null}
                    </View>
                  </View>
                )}

                <View className="flex-row items-center gap-3 mb-6">
                  <View className="flex-1 flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
                      <Ionicons name="time-outline" size={16} color={colors.primary} />
                    </View>
                    <Text className="text-base font-bold" style={{ color: colors.text }}>{t("cst.historyTitle")}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => runHistoryPdf(false)}
                    className="h-9 px-3 rounded-lg flex-row items-center gap-1.5"
                    style={{ backgroundColor: colors.bgCard, borderColor: colors.borderAlt, borderWidth: 1 }}
                  >
                    <Ionicons name="share-social-outline" size={16} color={colors.purple} />
                    <Text className="text-xs font-semibold" style={{ color: colors.text }}>{t("svc.share")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => runHistoryPdf(true)}
                    className="h-9 px-3 rounded-lg flex-row items-center gap-1.5"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text className="text-xs font-semibold" style={{ color: "#fff" }}>{t("cst.historyDownload")}</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-6">
                  <SectionHeader icon="construct-outline" title={t("cst.serviceReports")} count={services.length} />
                  {services.length === 0 ? (
                    <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noServiceReports")}</Text>
                  ) : (
                    <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.borderAlt }}>
                      {services.map((s, i) => (
                        <View
                          key={s.id}
                          className="flex-row items-center px-4 py-2.5"
                          style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderAlt, backgroundColor: colors.bgCard }}
                        >
                          <TouchableOpacity
                            className="flex-1 flex-row items-center py-0.5"
                            activeOpacity={0.7}
                            onPress={() => setDetail({ kind: "service", record: s })}
                          >
                            <View className="flex-1">
                              <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{s.service || s.customer}</Text>
                              <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{s.tarih}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                          <View className="flex-row items-center gap-3 ml-3">
                            <TouchableOpacity onPress={() => handleShareService(s)}>
                              <Ionicons name="share-social-outline" size={20} color={colors.purple} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleViewService(s)}>
                              <Ionicons name="eye-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDownloadService(s)}>
                              <Ionicons name="download-outline" size={20} color={colors.warning} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {isAdmin && (
                  <View className="mb-6">
                    <SectionHeader icon="document-text-outline" title={t("cst.quotes")} count={quotes.length} />
                    {quotes.length === 0 ? (
                      <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noQuoteRecords")}</Text>
                    ) : (
                      <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.borderAlt }}>
                        {quotes.map((q, i) => (
                          <View
                            key={q.id}
                            className="flex-row items-center px-4 py-2.5"
                            style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderAlt, backgroundColor: colors.bgCard }}
                          >
                            <TouchableOpacity
                              className="flex-1 flex-row items-center py-0.5"
                              activeOpacity={0.7}
                              onPress={() => setDetail({ kind: "quote", record: q })}
                            >
                              <View className="flex-1">
                                <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{q.customer}</Text>
                                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{q.tarih}</Text>
                              </View>
                              <Text className="text-xs font-semibold mr-1" style={{ color: colors.primary }}>{money(quoteTotal(q))} ₺</Text>
                              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                            <View className="flex-row items-center gap-3 ml-3">
                              <TouchableOpacity onPress={() => handleShareQuote(q)}>
                                <Ionicons name="share-social-outline" size={20} color={colors.purple} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleViewQuote(q)}>
                                <Ionicons name="eye-outline" size={20} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDownloadQuote(q)}>
                                <Ionicons name="download-outline" size={20} color={colors.warning} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {isAdmin && (
                  <View className="mb-4">
                    <SectionHeader icon="card-outline" title={t("cst.payments")} count={payments.length} />
                    {payments.length === 0 ? (
                      <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noPayments")}</Text>
                    ) : (
                      <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.borderAlt }}>
                        {payments.map((pm, i) => (
                          <View
                            key={pm.id}
                            className="flex-row items-center px-4 py-3"
                            style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderAlt, backgroundColor: colors.bgCard }}
                          >
                            <View className="flex-1">
                              <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{pm.serviceType || pm.customer}</Text>
                              <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{pm.tarih}</Text>
                            </View>
                            <Text className="text-xs font-semibold mr-3" style={{ color: colors.text }}>{money(pm.amount)} ₺</Text>
                            <TouchableOpacity
                              onPress={() => setToggleAlert({ visible: true, record: pm })}
                              className="px-3 py-1.5 rounded-full"
                              style={{ backgroundColor: (pm.paid ? colors.success : colors.warning) + "20" }}
                            >
                              <Text className="text-[10px] font-semibold" style={{ color: pm.paid ? colors.success : colors.warning }}>
                                {pm.paid ? t("cst.paid") : t("cst.pending")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

      <RecordDetailModal
        payload={detail}
        onClose={() => setDetail(null)}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
      />
      <PreviewPdfModal
        visible={!!preview}
        html={preview?.html || ""}
        zoom={previewZoom}
        setZoom={setPreviewZoom}
        onClose={() => setPreview(null)}
        onDownload={handlePreviewDownload}
      />
      <CustomAlert
        visible={toggleAlert.visible}
        type="confirm"
        title={toggleAlert.record?.paid ? t("dash.confirmRevert") : t("dash.confirmMarkPaid")}
        message={toggleAlert.record?.paid
          ? t("dash.confirmRevertMsg", { name: toggleAlert.record?.customer || "" })
          : t("dash.confirmMarkPaidMsg", { name: toggleAlert.record?.customer || "" })
        }
        onClose={() => setToggleAlert({ visible: false, record: null })}
        onConfirm={() => {
          if (toggleAlert.record) handleTogglePayment(toggleAlert.record);
        }}
        confirmText={t("common.confirm")}
      />
    </>
  );
}
