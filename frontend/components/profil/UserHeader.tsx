import { Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useProfil } from "./ProfilContext";

export default function UserHeader() {
  const { colors } = useTheme();
  const { user } = useProfil();

  return (
    <View className="items-center mb-6">
      <View style={{ width: 80, height: 80, borderRadius: 999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
          {user?.name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>{user?.name}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{user?.email}</Text>
    </View>
  );
}
