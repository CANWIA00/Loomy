import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { QUOTE_STATUSES, type QuoteRecord, type QuoteStatus } from "../../apiclient/quotes";
import { useQuotes } from "./QuoteContext";

const ICONS: Record<QuoteStatus, keyof typeof Ionicons.glyphMap> = {
  PENDING: "time-outline",
  ACCEPTED: "checkmark-circle-outline",
  REJECTED: "close-circle-outline",
};

export function useStatusColor() {
  const { colors } = useTheme();
  return (s: QuoteStatus) => (s === "ACCEPTED" ? colors.success : s === "REJECTED" ? colors.danger : colors.warning);
}

/**
 * Kompakt durum gosterimi: renkli nokta + kisa etiket (+ ▾). Satir/tutar yaninda
 * yer kaplamadan durur; onPress verilirse dokununca durum secici acilir.
 */
export function QuoteStatusInline({ status = "PENDING", onPress }: { status?: QuoteStatus; onPress?: () => void }) {
  const { t } = useLanguage();
  const colorOf = useStatusColor();
  const color = colorOf(status);
  const content = (
    <View className="flex-row items-center">
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-xs font-semibold ml-1.5" style={{ color }}>{t(`qot.statusShort.${status}`)}</Text>
      {onPress && <Ionicons name="chevron-down" size={12} color={color} style={{ marginLeft: 2 }} />}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t("qot.changeStatus")}: ${t(`qot.status.${status}`)}`}
      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
    >
      {content}
    </TouchableOpacity>
  );
}

/** Teklif durumunu secmek icin kucuk pencere. */
export function QuoteStatusMenu({ record, visible, onClose }: { record: QuoteRecord | null; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { setQuoteStatus } = useQuotes();
  const colorOf = useStatusColor();
  const current = record?.status || "PENDING";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 justify-center items-center bg-black/50 px-6" activeOpacity={1} onPress={onClose}>
        <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-full max-w-xs p-3">
          <Text style={{ color: colors.text }} className="font-bold text-sm" numberOfLines={1}>{t("qot.changeStatus")}</Text>
          <Text style={{ color: colors.textMuted }} className="text-xs mb-2" numberOfLines={1}>
            {record?.customer}{record?.title ? ` · ${record.title}` : ""}
          </Text>
          <View style={{ borderColor: colors.border }} className="border-t mb-1" />
          {QUOTE_STATUSES.map((s) => {
            const color = colorOf(s);
            const selected = current === s;
            return (
              <TouchableOpacity
                key={s}
                className="flex-row items-center px-3 py-3 rounded-lg"
                style={selected ? { backgroundColor: color + "14" } : undefined}
                onPress={() => {
                  onClose();
                  if (record) setQuoteStatus(record, s);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Ionicons name={ICONS[s]} size={18} color={color} />
                <Text className="text-sm ml-3 flex-1" style={{ color: colors.text }}>{t(`qot.status.${s}`)}</Text>
                {selected && <Ionicons name="checkmark" size={18} color={color} />}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={{ backgroundColor: colors.bgInput }} className="mt-2 h-10 rounded-lg items-center justify-center" onPress={onClose}>
            <Text style={{ color: colors.textSecondary }} className="font-medium text-sm">{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/** Filtre cubugundaki durum secimi: select box gorunumu, secenekler sayilariyla. */
export function QuoteStatusFilterSelect() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { statusFilter, setStatusFilter, statusCounts } = useQuotes();
  const colorOf = useStatusColor();
  const [open, setOpen] = useState(false);
  const total = statusCounts.PENDING + statusCounts.ACCEPTED + statusCounts.REJECTED;
  const options: (QuoteStatus | "all")[] = ["all", ...QUOTE_STATUSES];
  const labelOf = (s: QuoteStatus | "all") => (s === "all" ? t("qot.statusFilterAll") : t(`qot.status.${s}`));

  return (
    <>
      <TouchableOpacity
        className="flex-row items-center h-8 border rounded-lg px-2.5"
        style={{ backgroundColor: colors.bg, borderColor: statusFilter === "all" ? colors.border : colorOf(statusFilter) }}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t("qot.statusFilterLabel")}: ${labelOf(statusFilter)}`}
      >
        {statusFilter !== "all" && (
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colorOf(statusFilter), marginRight: 6 }} />
        )}
        <Text className="text-xs" style={{ color: colors.textMuted }}>{t("qot.statusFilterLabel")}: </Text>
        <Text className="text-xs font-medium" style={{ color: colors.text }}>{labelOf(statusFilter)}</Text>
        <Ionicons name="chevron-down" size={13} color={colors.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity className="flex-1 justify-center items-center bg-black/50 px-6" activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-full max-w-xs p-3">
            <Text style={{ color: colors.text }} className="font-bold text-sm mb-2">{t("qot.statusFilterLabel")}</Text>
            <View style={{ borderColor: colors.border }} className="border-t mb-1" />
            {options.map((s) => {
              const selected = statusFilter === s;
              const color = s === "all" ? colors.primary : colorOf(s);
              const count = s === "all" ? total : statusCounts[s];
              return (
                <TouchableOpacity
                  key={s}
                  className="flex-row items-center px-3 py-3 rounded-lg"
                  style={selected ? { backgroundColor: color + "14" } : undefined}
                  onPress={() => { setStatusFilter(s); setOpen(false); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {s === "all" ? (
                    <Ionicons name="list-outline" size={16} color={color} />
                  ) : (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginHorizontal: 4 }} />
                  )}
                  <Text className="text-sm ml-3 flex-1" style={{ color: colors.text }}>{labelOf(s)}</Text>
                  <Text className="text-xs font-semibold mr-2" style={{ color: colors.textMuted }}>{count}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
