import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { InvoiceRecord } from "../../apiclient/stock";
import { formatMoney, formatQty, formatDate } from "./format";

interface Props {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  if (!value) return null;
  return (
    <View className="flex-row items-start justify-between py-1.5">
      <Text className="text-xs mr-2" style={{ color: colors.textMuted }}>{label}</Text>
      <Text className="text-xs flex-1 text-right" style={{ color: colors.text }}>{value}</Text>
    </View>
  );
}

export default function InvoiceDetailModal({ visible, invoice, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (!invoice) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-5 w-full max-w-md" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, maxHeight: "88%" }}>
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>{invoice.invoiceNo}</Text>
              {invoice.invoiceType ? (
                <Text className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{invoice.invoiceType}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.textMuted }} className="text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="rounded-xl px-3 py-2.5 mb-3" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
              <Row label={t("stock.invoiceDate")} value={formatDate(invoice.date)} />
              {invoice.supplierName ? (
                <Row label={t("stock.supplier")} value={`${invoice.supplierName}${invoice.supplierTaxNumber ? ` · ${invoice.supplierTaxNumber}` : ""}`} />
              ) : null}
              <Row label={t("stock.address")} value={invoice.supplierAddress || ""} />
              <Row label={t("stock.amount")} value={invoice.totalAmount != null ? formatMoney(invoice.totalAmount, invoice.currency) : ""} />
              <Row label={t("stock.vat")} value={invoice.vatAmount != null ? formatMoney(invoice.vatAmount, invoice.currency) : ""} />
              {invoice.rawName ? (
                <Row label={t("stock.chooseFile")} value={invoice.rawName} />
              ) : null}
            </View>

            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              {t("stock.line")} ({invoice.lines.length})
            </Text>
            {invoice.lines.map((line) => (
              <View key={line.id} className="rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm font-medium flex-1 mr-2" style={{ color: colors.text }} numberOfLines={1}>{line.name}</Text>
                  <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                    {formatQty(line.quantity)} {line.unit}
                  </Text>
                </View>
                {line.unitPrice != null ? (
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {t("stock.unitPrice")}: {formatMoney(line.unitPrice, invoice.currency)}
                  </Text>
                ) : null}
                {line.lineAmount != null ? (
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {t("stock.amount")}: {formatMoney(line.lineAmount, invoice.currency)}
                  </Text>
                ) : null}
                {line.vatRate != null && line.vatRate > 0 ? (
                  <>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {t("stock.vat")}: %{formatQty(line.vatRate)}
                    </Text>
                    {line.lineAmount != null ? (
                      <Text className="text-xs" style={{ color: colors.textMuted }}>
                        {t("stock.vat")} {t("stock.amount").toLowerCase()}: {formatMoney(line.lineAmount * line.vatRate / 100, invoice.currency)}
                      </Text>
                    ) : null}
                  </>
                ) : null}
                {line.stockItem ? (
                  <Text className="text-[10px] mt-1" style={{ color: colors.teal }}>
                    {line.stockItem.name} · {formatQty(line.stockItem.quantity)} {line.stockItem.unit}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}