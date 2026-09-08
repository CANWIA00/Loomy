import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";

export default function UserHeader() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user, isAdmin } = useProfil();

  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  const roleText = isAdmin ? t("prf.roleAdmin") : t("prf.roleUser");

  return (
    <View
      className="rounded-2xl p-5 mb-6"
      style={{ backgroundColor: colors.primary + "0D", borderColor: colors.primary + "22", borderWidth: 1 }}
    >
      <View className="flex-row items-center gap-4">
        <View>
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 3,
              borderColor: colors.primary + "33",
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 30, fontWeight: "800" }}>{initial}</Text>
          </View>
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 23,
                height: 23,
                borderRadius: 12,
                backgroundColor: isAdmin ? colors.purple : colors.teal,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={13} color="#fff" />
            </View>
          </View>
        </View>

        <View className="flex-1">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
            {t("prf.greeting")}
          </Text>
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight" numberOfLines={1}>
            {user?.name}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary }} className="text-xs" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-2 mt-4 flex-wrap">
        <View
          className="flex-row items-center gap-1.5 rounded-full pl-4 pr-3.5 py-1.5"
          style={{ backgroundColor: isAdmin ? colors.purple + "18" : colors.teal + "18" }}
        >
          <Ionicons name={isAdmin ? "shield-checkmark-outline" : "person-outline"} size={13} color={isAdmin ? colors.purple : colors.teal} />
          <Text className="text-xs font-bold" style={{ color: isAdmin ? colors.purple : colors.teal }}>
            {roleText}
          </Text>
        </View>
        {user?.phone ? (
          <View className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5" style={{ backgroundColor: colors.bgCard }}>
            <Ionicons name="call-outline" size={13} color={colors.primary} />
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>{user.phone}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}