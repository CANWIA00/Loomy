import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";

export default function DangerZone() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { handleDeleteAccount, handleLogout } = useProfil();

  return (
    <View
      className="rounded-2xl p-4 mt-6"
      style={{ backgroundColor: colors.danger + "0D", borderColor: colors.danger + "25", borderWidth: 1 }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: "700" }} className="text-sm">{t("prf.dangerZone")}</Text>
      </View>

      <TouchableOpacity onPress={handleDeleteAccount}>
        <View className="flex-row items-center gap-3 rounded-xl px-3 py-3" style={{ backgroundColor: colors.danger + "12" }}>
          <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.danger + "18" }}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </View>
          <Text style={{ color: colors.danger, fontWeight: "600" }} className="text-sm flex-1">{t("prf.deleteAccount")}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.danger + "99"} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout}>
        <View className="flex-row items-center gap-3 rounded-xl px-3 py-3 mt-2.5" style={{ backgroundColor: colors.bgCard }}>
          <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.warning + "18" }}>
            <Ionicons name="log-out-outline" size={16} color={colors.warning} />
          </View>
          <Text style={{ color: colors.text, fontWeight: "600" }} className="text-sm flex-1">{t("prf.logout")}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </View>
  );
}