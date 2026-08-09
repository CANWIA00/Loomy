import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useDevDashboard } from "./DevDashboardContext";
import { formatDate } from "./types";

export default function KeysTab() {
  const { colors } = useTheme();
  const {
    filteredKeys,
    keySearch,
    setKeySearch,
    keyFilter,
    setKeyFilter,
    setCreateKeyCount,
    setCreateKeyModal,
    copyToClipboard,
    handleToggleKeyUsed,
    handleToggleKeyActive,
    handleDeleteKey,
  } = useDevDashboard();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.textMuted }} className="text-sm">
          {filteredKeys.length} anahtar
        </Text>
        <TouchableOpacity
          className="h-10 px-4 rounded-lg items-center justify-center flex-row gap-2"
          style={{ backgroundColor: colors.primary }}
          onPress={() => {
            setCreateKeyCount("5");
            setCreateKeyModal(true);
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold text-sm">Yeni Anahtar</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <TextInput
          className="h-11 rounded-lg px-4 text-base"
          style={{
            backgroundColor: colors.bgCard,
            color: colors.text,
            borderColor: colors.border,
            borderWidth: 1,
          }}
          placeholder="Anahtar ara..."
          placeholderTextColor={colors.textMuted}
          value={keySearch}
          onChangeText={setKeySearch}
        />
      </View>

      <View className="flex-row flex-wrap gap-2 mb-4">
        {([
          { key: "all", label: "Hepsi" },
          { key: "used", label: "Kullanılan" },
          { key: "active", label: "Aktif" },
          { key: "available", label: "Kullanılabilir" },
        ] as const).map((f) => {
          const activeFilter = keyFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              className="px-4 h-9 rounded-lg items-center justify-center"
              style={{
                backgroundColor: activeFilter ? colors.primary : colors.bgCard2,
                borderColor: colors.border,
                borderWidth: activeFilter ? 0 : 1,
              }}
              onPress={() => setKeyFilter(f.key)}
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: activeFilter ? "white" : colors.textSecondary }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="rounded-2xl border overflow-hidden" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
        {filteredKeys.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="key-outline" size={36} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }} className="text-sm mt-3">
              Anahtar bulunamadı
            </Text>
          </View>
        ) : (
          filteredKeys.map((k, idx) => (
            <View
              key={k.id}
              className="flex-row items-center px-4 py-3"
              style={idx < filteredKeys.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.borderAlt } : undefined}
            >
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: colors.text }} className="font-mono font-semibold">
                    {k.keyValue}
                  </Text>
                  {!k.isActive && (
                    <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.danger + "18" }}>
                      <Text style={{ color: colors.danger, fontSize: 10, fontWeight: "700" }}>PASİF</Text>
                    </View>
                  )}
                  {k.isUsed && (
                    <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.success + "18" }}>
                      <Text style={{ color: colors.success, fontSize: 10, fontWeight: "700" }}>KULLANILDI</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textMuted }} className="text-xs mt-1">
                  {k.isUsed && k.company
                    ? `Kullanan: ${k.company.name} · ${formatDate(k.usedAt)}`
                    : `Oluşturulma: ${formatDate(k.createdAt)}`}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgCard2 }}
                  onPress={() => copyToClipboard(k.keyValue)}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgCard2 }}
                  onPress={() => handleToggleKeyUsed(k)}
                >
                  <Ionicons name={k.isUsed ? "link-outline" : "checkmark-done"} size={16} color={colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgCard2 }}
                  onPress={() => handleToggleKeyActive(k)}
                >
                  <Ionicons name={k.isActive ? "power" : "power-outline"} size={18} color={k.isActive ? colors.teal : colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.danger + "15" }}
                  onPress={() => handleDeleteKey(k)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
