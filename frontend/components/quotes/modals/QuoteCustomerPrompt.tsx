import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useQuotes } from "../QuoteContext";

/**
 * Musteri kaydi olmayan teklif kabul edilirken / servis formu acilirken sorulur:
 * teklifteki bilgilerle musteri kaydi acilsin mi?
 */
export default function QuoteCustomerPrompt() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { customerPrompt, customerPromptSaving, resolveCustomerPrompt } = useQuotes();
  const r = customerPrompt?.record;

  // Musteri kaydina aktarilacak bilgiler (bos olanlar gosterilmez)
  const info: { icon: keyof typeof Ionicons.glyphMap; value: string }[] = r
    ? ([
        { icon: "person-outline", value: r.contactPerson },
        { icon: "call-outline", value: r.telefon },
        { icon: "mail-outline", value: r.email },
        { icon: "location-outline", value: r.adres },
      ] as { icon: keyof typeof Ionicons.glyphMap; value: string }[]).filter((x) => x.value?.trim())
    : [];

  const continueLabel = customerPrompt?.action === "service" ? t("qot.customerPromptSkipService") : t("qot.customerPromptSkipAccept");

  return (
    <Modal visible={!!customerPrompt} transparent animationType="fade" onRequestClose={() => resolveCustomerPrompt("cancel")}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
        <View className="rounded-2xl p-5 w-full max-w-sm" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "22" }}>
              <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            </View>
            <Text className="text-base font-bold ml-3 flex-1" style={{ color: colors.text }}>{t("qot.customerPromptTitle")}</Text>
          </View>

          <Text className="text-sm mb-3 leading-5" style={{ color: colors.textSecondary }}>
            {t("qot.customerPromptMessage", { name: r?.customer || "" })}
          </Text>

          <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: colors.bg, borderColor: colors.border, borderWidth: 1 }}>
            <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={2}>{r?.customer}</Text>
            {info.map((x) => (
              <View key={x.icon} className="flex-row items-center mt-1.5">
                <Ionicons name={x.icon} size={13} color={colors.textMuted} />
                <Text className="text-xs ml-2 flex-1" style={{ color: colors.textSecondary }} numberOfLines={2}>{x.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            className="h-11 rounded-lg items-center justify-center flex-row"
            style={{ backgroundColor: colors.primary, opacity: customerPromptSaving ? 0.7 : 1 }}
            onPress={() => resolveCustomerPrompt("save")}
            disabled={customerPromptSaving}
            accessibilityRole="button"
          >
            {customerPromptSaving ? <ActivityIndicator size="small" color="white" /> : (
              <>
                <Ionicons name="checkmark" size={16} color="white" />
                <Text className="font-semibold text-sm ml-1.5" style={{ color: "white" }}>{t("qot.customerPromptSave")}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="h-11 rounded-lg items-center justify-center mt-2"
            style={{ backgroundColor: colors.bgInput }}
            onPress={() => resolveCustomerPrompt("skip")}
            disabled={customerPromptSaving}
            accessibilityRole="button"
          >
            <Text className="font-medium text-sm" style={{ color: colors.text }}>{continueLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="h-10 items-center justify-center mt-1"
            onPress={() => resolveCustomerPrompt("cancel")}
            disabled={customerPromptSaving}
            accessibilityRole="button"
          >
            <Text className="text-sm" style={{ color: colors.textMuted }}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
