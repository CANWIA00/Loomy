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
    <>
      <TouchableOpacity style={{ marginTop: 24 }} onPress={handleDeleteAccount}>
        <View style={{ backgroundColor: colors.danger + "15", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "600" }}>{t("prf.deleteAccount")}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 12 }} onPress={handleLogout}>
        <View style={{ backgroundColor: colors.danger + "15", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
          <View className="flex-row items-center gap-2">
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "600" }}>{t("prf.logout")}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}
