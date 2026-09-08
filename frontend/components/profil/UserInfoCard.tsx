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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary + "4D",
    marginTop: 6,
  };

  const fields = [
    {
      key: "name",
      label: t("prf.name"),
      icon: "person-outline" as const,
      color: colors.primary,
      value: user?.name,
      wide: false,
      renderEdit: () => (
        <TextInput style={inputStyle} value={editName} onChangeText={setEditName} editable={!saving} />
      ),
    },
    {
      key: "email",
      label: t("prf.email"),
      icon: "mail-outline" as const,
      color: colors.teal,
      value: user?.email,
      wide: false,
      renderEdit: null,
    },
    {
      key: "phone",
      label: t("prf.phone"),
      icon: "call-outline" as const,
      color: colors.purple,
      value: user?.phone || "-",
      wide: false,
      renderEdit: () => (
        <TextInput
          style={inputStyle}
          value={editPhone}
          onChangeText={setEditPhone}
          editable={!saving}
          keyboardType="phone-pad"
        />
      ),
    },
    {
      key: "signature",
      label: t("prf.mySignature"),
      icon: "pencil-outline" as const,
      color: colors.danger,
      value: "signature",
      wide: true,
      renderEdit: null,
    },
  ];

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderColor: colors.border, borderWidth: 1 }} className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.primary + "18" }}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: "700" }} className="text-[15px]">{t("prf.info")}</Text>
            <Text style={{ color: colors.textMuted }} className="text-xs">{t("prf.personalDesc")}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {editingUser ? (
            <>
              <TouchableOpacity onPress={cancelEditingUser} disabled={saving} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.danger + "15" }}>
                <Ionicons name="close" size={18} color={colors.danger} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateUser} disabled={saving} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.success + "15" }}>
                <Ionicons name="checkmark" size={18} color={colors.success} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={startEditingUser} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + "15" }}>
              <Ionicons name="pencil-outline" size={17} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-3">
        {fields.map((field) => (
          <View
            key={field.key}
            className="rounded-2xl p-3.5"
            style={[
              { backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 },
              field.wide ? { width: "100%", minWidth: "100%" } : { flexGrow: 1, flexBasis: 0, minWidth: 150 },
            ]}
          >
            <View className="flex-row items-center gap-2 mb-0.5">
              <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: field.color + "18" }}>
                <Ionicons name={field.icon} size={14} color={field.color} />
              </View>
              <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                {field.label}
              </Text>
            </View>
            {field.key === "signature" ? (
              user?.signature ? (
                <View className="flex-row items-center gap-2 mt-1">
                  <View className="flex-1">
                    <SignaturePreview signature={user.signature} onPress={() => setSignatureModalVisible(true)} />
                  </View>
                  <TouchableOpacity onPress={() => setSignatureModalVisible(true)} className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: colors.danger + "15" }}>
                    <Ionicons name="pencil-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setSignatureModalVisible(true)} className="flex-row items-center gap-2 mt-1.5 h-9 rounded-lg px-3" style={{ backgroundColor: colors.danger + "15" }}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontSize: 12, fontWeight: "600" }}>{t("prf.addSignature")}</Text>
                </TouchableOpacity>
              )
            ) : (
              <View>
                {field.renderEdit && editingUser ? (
                  field.renderEdit()
                ) : (
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }} numberOfLines={1}>
                    {field.value}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}