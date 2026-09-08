import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";

export default function AdminCard() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useProfil();

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderColor: colors.border, borderWidth: 1, marginTop: 16 }} className="p-4">
      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.purple + "18" }}>
          <Ionicons name="key-outline" size={18} color={colors.purple} />
        </View>
        <View className="flex-1">
          <Text style={{ color: colors.text, fontWeight: "700" }} className="text-[15px]">{t("prf.adminPrivileges")}</Text>
          <Text style={{ color: colors.textMuted }} className="text-xs leading-5 mt-0.5">{t("prf.adminDesc")}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between rounded-xl px-3.5 py-2.5 mt-3" style={{ backgroundColor: colors.purple + "12", borderColor: colors.purple + "25", borderWidth: 1 }}>
        <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">{t("prf.role")}</Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="shield-checkmark" size={14} color={colors.purple} />
          <Text style={{ color: colors.purple, fontWeight: "700" }} className="text-sm">{user?.role}</Text>
        </View>
      </View>
    </View>
  );
}