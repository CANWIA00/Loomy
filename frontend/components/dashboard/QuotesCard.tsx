import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function QuotesCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push("/quotes" as any)}
    >
      <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard }}>
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text style={{ color: colors.text }} className="text-lg font-bold">{t("dash.quotes")}</Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">
              {t("dash.quotes.desc")}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center flex-row"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/quotes" as any)}
            >
              <Ionicons name="add" size={14} color="white" />
              <Text style={{ color: "white" }} className="text-xs font-medium ml-1">{t("dash.newQuote")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push("/quotes" as any)}
            >
              <Text style={{ color: "white" }} className="text-xs font-medium">{t("dash.manage")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
