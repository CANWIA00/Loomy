import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { customerApi, type Customer } from "../api/customers";
import { serviceApi, type ServiceRecord } from "../api/services";
import { quoteApi, type QuoteRecord } from "../api/quotes";

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
}: { payload: DetailPayload | null; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Modal visible={!!payload} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-5 w-11/12 max-w-lg max-h-[85%]" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <ScrollView>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {payload?.kind === "service" ? t("cst.serviceReports") : t("cst.quotes")}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

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
        </View>
      </View>
    </Modal>
  );
}

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const id = params.id || "";
  const name = params.name || "";

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);

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

      const customersMatch = (recordCustomer?: string) => {
        if (c && c.id) {
          if (id && recordCustomer === id) return true;
        }
        const nm = (recordCustomer || "").toLowerCase().trim();
        const target = (c?.companyName || "").toLowerCase().trim();
        return !!nm && !!target && (nm === target || nm.includes(target) || target.includes(nm));
      };

      const [svcRes, qRes] = await Promise.all([
        serviceApi.getAll(0, 100),
        quoteApi.getAll(0, 100),
      ]);

      const svc = (svcRes.data.content as ServiceRecord[]).filter((r) =>
        (id && r.customerId === id) || customersMatch(r.customer));
      const qts = (qRes.data.content as QuoteRecord[]).filter((r) =>
        (id && r.customerId === id) || customersMatch(r.customer));

      setServices(svc);
      setQuotes(qts);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id, name]);

  useEffect(() => { load(); }, [load]);

  const money = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b" style={{ borderColor: colors.border }}>
          <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-bold ml-1" style={{ color: colors.text }} numberOfLines={1}>
            {customer?.companyName || name || t("cst.detail")}
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} indicatorStyle={colors.indicatorBg as any}>
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

              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
                    <Ionicons name="construct-outline" size={16} color={colors.primary} />
                  </View>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>{t("cst.serviceReports")}</Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>({services.length})</Text>
                </View>
                {services.length === 0 ? (
                  <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noServiceReports")}</Text>
                ) : (
                  <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.borderAlt }}>
                    {services.map((s, i) => (
                      <TouchableOpacity
                        key={s.id}
                        className="flex-row items-center px-4 py-3"
                        style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderAlt, backgroundColor: colors.bgCard }}
                        onPress={() => setDetail({ kind: "service", record: s })}
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{s.service || s.customer}</Text>
                          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{s.tarih}</Text>
                        </View>
                        <Text className="text-xs mr-2" style={{ color: s.odendi ? colors.success : colors.warning }}>
                          {s.odendi ? t("cst.paid") : t("cst.pending")}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
                    <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                  </View>
                  <Text className="text-base font-bold" style={{ color: colors.text }}>{t("cst.quotes")}</Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>({quotes.length})</Text>
                </View>
                {quotes.length === 0 ? (
                  <Text className="text-sm" style={{ color: colors.textMuted }}>{t("cst.noQuoteRecords")}</Text>
                ) : (
                  <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.borderAlt }}>
                    {quotes.map((q, i) => (
                      <TouchableOpacity
                        key={q.id}
                        className="flex-row items-center px-4 py-3"
                        style={{ borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderAlt, backgroundColor: colors.bgCard }}
                        onPress={() => setDetail({ kind: "quote", record: q })}
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{q.customer}</Text>
                          <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{q.tarih}</Text>
                        </View>
                        <Text className="text-xs font-semibold mr-2" style={{ color: colors.primary }}>{money(quoteTotal(q))} ₺</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      <RecordDetailModal payload={detail} onClose={() => setDetail(null)} />
    </>
  );
}
