import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";

export default function DashboardTab() {
  const { colors } = useTheme();
  const { stats, companies, keys, paymentStats, setTab } = useDevDashboard();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.text }} className="text-lg font-bold">
          Genel Bakış
        </Text>
        <Text style={{ color: colors.textMuted }} className="text-sm">
          {companies.length} müşteri · {keys.length} anahtar
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-3 mb-5">
        {[
          { label: "Müşteri", value: stats?.companies ?? companies.length, icon: "business", color: colors.primary },
          { label: "Kayıtlı Kullanıcı", value: stats?.users ?? 0, icon: "people", color: colors.teal },
          { label: "Müşteri Kaydı", value: stats?.customers ?? 0, icon: "file-tray-full", color: colors.warning },
          { label: "Servis", value: stats?.services ?? 0, icon: "build", color: colors.success },
        ].map((s) => (
          <TouchableOpacity
            key={s.label}
            className="rounded-2xl p-4 flex-1 min-w-[150px]"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}
            onPress={() => setTab("customers")}
          >
            <View className="w-10 h-10 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: s.color + "18" }}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={{ color: colors.text }} className="text-2xl font-bold">
              {s.value}
            </Text>
            <Text style={{ color: colors.textMuted }} className="text-xs mt-0.5">
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: colors.text }} className="text-base font-bold">
            Ödemelerim
          </Text>
          <TouchableOpacity onPress={() => setTab("payments")}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: "Ödeme Alındı", value: paymentStats.paid, icon: "checkmark-circle", color: colors.success },
            { label: "Gecikmiş Ödeme", value: paymentStats.overdue, icon: "alert-circle", color: colors.danger },
            { label: "Ödeme Alınmadı", value: paymentStats.neverPaid, icon: "time", color: colors.warning },
            { label: "Yakında Doluyor (≤14 gün)", value: paymentStats.expiringSoon, icon: "hourglass", color: colors.teal },
          ].map((s) => (
            <View key={s.label} className="rounded-xl p-3 flex-1 min-w-[150px]" style={{ backgroundColor: colors.bgCard2 }}>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name={s.icon as any} size={14} color={s.color} />
                <Text style={{ color: colors.textMuted }} className="text-xs">
                  {s.label}
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-bold">
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="rounded-2xl p-4" style={{ backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text style={{ color: colors.text }} className="text-base font-bold">
            Admin Anahtarları
          </Text>
          <TouchableOpacity onPress={() => setTab("keys")}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {[
            { label: "Toplam Anahtar", value: stats?.adminKeys ?? keys.length, icon: "key", color: colors.primary },
            { label: "Kullanılan", value: stats?.usedKeys ?? 0, icon: "checkmark-done", color: colors.success },
            { label: "Aktif", value: stats?.activeKeys ?? 0, icon: "shield-checkmark", color: colors.teal },
            { label: "Kullanılabilir", value: (stats?.activeKeys ?? 0) - (stats?.usedKeys ?? 0), icon: "unlock", color: colors.warning },
          ].map((s) => (
            <View key={s.label} className="rounded-xl p-3 flex-1 min-w-[150px]" style={{ backgroundColor: colors.bgCard2 }}>
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ionicons name={s.icon as any} size={14} color={s.color} />
                <Text style={{ color: colors.textMuted }} className="text-xs">
                  {s.label}
                </Text>
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-bold">
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
