import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";
import SignaturePreview from "./SignaturePreview";

export default function UserInfoCard() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    user,
    isAdmin,
    editingUser,
    saving,
    startEditingUser,
    cancelEditingUser,
    handleUpdateUser,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    setSignatureModalVisible,
  } = useProfil();

  const inputStyle = {
    backgroundColor: colors.bgInput,
    color: colors.text,
    fontSize: 14,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary + "4D",
  };
  const labelStyle = {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500" as const,
    marginBottom: 4,
  };

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Ionicons name="person-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.info")}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {editingUser ? (
            <>
              <TouchableOpacity onPress={cancelEditingUser} disabled={saving}>
                <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateUser} disabled={saving}>
                <Ionicons
                  name={saving ? "hourglass-outline" : "checkmark-circle"}
                  size={22}
                  color={saving ? colors.textMuted : colors.success}
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={startEditingUser}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1 gap-4">
          <View>
            <Text style={labelStyle}>{t("prf.name")}</Text>
            {editingUser ? (
              <TextInput
                style={inputStyle}
                value={editName}
                onChangeText={setEditName}
                editable={!saving}
              />
            ) : (
              <Text style={{ color: colors.text, fontSize: 14 }}>{user?.name}</Text>
            )}
          </View>
          <View>
            <Text style={labelStyle}>{t("prf.email")}</Text>
            <Text style={{ color: colors.text, fontSize: 14 }}>{user?.email}</Text>
          </View>
          <View>
            <Text style={labelStyle}>{t("prf.phone")}</Text>
            {editingUser ? (
              <TextInput
                style={inputStyle}
                value={editPhone}
                onChangeText={setEditPhone}
                editable={!saving}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={{ color: colors.text, fontSize: 14 }}>{user?.phone || "-"}</Text>
            )}
          </View>
          <View>
            <Text style={labelStyle}>{t("prf.role")}</Text>
            <View className="flex-row items-center gap-2">
              <Text style={{ color: colors.text, fontSize: 14 }}>{user?.role}</Text>
              {isAdmin && (
                <View style={{ backgroundColor: colors.primary + "15", borderColor: colors.primary + "4D", borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "500" }}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          <View>
            <Text style={labelStyle}>{t("prf.signature")}</Text>
            {user?.signature ? (
              <View className="flex-row items-center gap-2 mt-1">
                <SignaturePreview signature={user.signature} onPress={() => setSignatureModalVisible(true)} />
                <TouchableOpacity onPress={() => setSignatureModalVisible(true)}>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setSignatureModalVisible(true)}
                className="flex-row items-center gap-1.5 mt-1"
              >
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 12 }}>{t("prf.addSignature")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
