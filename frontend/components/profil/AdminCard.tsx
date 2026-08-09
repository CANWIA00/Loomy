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
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginTop: 16 }}>
      <View className="flex-row items-center gap-3 mb-4">
        <Ionicons name="key-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.adminPrivileges")}</Text>
      </View>
      <View style={{ backgroundColor: colors.bgInput, borderRadius: 12, padding: 12 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "500", marginBottom: 4 }}>{t("prf.role")}</Text>
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{user?.role}</Text>
      </View>
    </View>
  );
}
