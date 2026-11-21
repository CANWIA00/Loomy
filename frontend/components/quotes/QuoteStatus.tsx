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

/** Renkli durum rozeti; onPress verilirse dokunularak durum degistirilir. */
export function QuoteStatusBadge({ status = "PENDING", onPress }: { status?: QuoteStatus; onPress?: () => void }) {
  const { t } = useLanguage();
  const colorOf = useStatusColor();
  const color = colorOf(status);
  const content = (
    <View className="flex-row items-center self-start px-2 h-6 rounded-full" style={{ backgroundColor: color + "1F" }}>
      <Ionicons name={ICONS[status]} size={13} color={color} />
      <Text className="text-[11px] font-semibold ml-1" style={{ color }}>{t(`qot.status.${status}`)}</Text>
      {onPress && <Ionicons name="chevron-down" size={11} color={color} style={{ marginLeft: 2 }} />}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t("qot.changeStatus")}: ${t(`qot.status.${status}`)}`}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      className="self-start"
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
