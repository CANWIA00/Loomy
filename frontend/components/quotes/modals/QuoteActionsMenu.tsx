import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useQuotes } from "../QuoteContext";
import type { QuoteRecord } from "../../../apiclient/quotes";

interface Props {
  record: QuoteRecord | null;
  visible: boolean;
  onClose: () => void;
}

export default function QuoteActionsMenu({ record, visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { handleShare, handleView, openQuotePDF, handleEdit, handleDuplicate, setDeleteAlert } = useQuotes();

  const actions: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; onPress: () => void }[] = record
    ? [
        { key: "preview", label: t("qot.preview"), icon: "eye-outline", color: colors.primary, onPress: () => { onClose(); handleView(record); } },
        { key: "edit", label: t("common.edit"), icon: "create-outline", color: colors.teal, onPress: () => { onClose(); handleEdit(record); } },
        { key: "duplicate", label: t("qot.copy"), icon: "copy-outline", color: colors.textSecondary, onPress: () => { onClose(); handleDuplicate(record); } },
        { key: "share", label: t("qot.share"), icon: "share-social-outline", color: colors.purple, onPress: () => { onClose(); handleShare(record); } },
        { key: "download", label: t("qot.downloadPdf"), icon: "download-outline", color: colors.warning, onPress: () => { onClose(); openQuotePDF(record); } },
        { key: "delete", label: t("common.delete"), icon: "trash-outline", color: colors.danger, onPress: () => { onClose(); setDeleteAlert({ visible: true, record }); } },
      ]
    : [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 justify-center items-center bg-black/50 px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={{ backgroundColor: colors.bgCard }} className="rounded-2xl w-full max-w-xs p-3">
          <Text style={{ color: colors.text }} className="font-bold text-sm mb-1" numberOfLines={1}>
            {record?.customer}
          </Text>
          <Text style={{ color: colors.textMuted }} className="text-xs mb-2" numberOfLines={1}>
            {t("common.actions")}
          </Text>

          <View style={{ borderColor: colors.border }} className="border-t mb-1" />

          {actions.map((a) => (
            <TouchableOpacity
              key={a.key}
              className="flex-row items-center px-3 py-3 rounded-lg"
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Ionicons name={a.icon} size={18} color={a.color} />
              <Text className="text-sm ml-3" style={{ color: colors.text }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={{ backgroundColor: colors.bgInput }}
            className="mt-2 h-10 rounded-lg items-center justify-center"
            onPress={onClose}
          >
            <Text style={{ color: colors.textSecondary }} className="font-medium text-sm">{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}