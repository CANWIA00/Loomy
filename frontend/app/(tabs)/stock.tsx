import { View, Text } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import StockScreen from "../../components/stock/StockScreen";

export default function StockTab() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (user?.role !== "ADMIN") {
    return (
      <View style={{ backgroundColor: colors.bg }} className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("stock.title")}</Text>
        <Text className="text-sm mt-2 text-center" style={{ color: colors.textMuted }}>
          {t("stock.accessDenied")}
        </Text>
      </View>
    );
  }

  return <StockScreen />;
}