import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";

export default function CompanyCard() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    company,
    isAdmin,
    editingCompany,
    saving,
    startEditingCompany,
    cancelEditingCompany,
    handleUpdateCompany,
    editCompanyName,
    setEditCompanyName,
    editCompanyAddress,
    setEditCompanyAddress,
    editCompanyPhone,
    setEditCompanyPhone,
    editCompanyEmail,
    setEditCompanyEmail,
    editCompanyTaxNumber,
    setEditCompanyTaxNumber,
    editCompanyLogo,
    setEditCompanyLogo,
    handleCopyInviteCode,
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

  if (!company) return null;

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setEditCompanyLogo(`data:image/png;base64,${result.assets[0].base64}`);
    }
  };

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginTop: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <Ionicons name="business-outline" size={20} color={colors.primary} />
          <Text style={{ color: colors.text, fontWeight: "600" }}>{t("prf.companyInfo")}</Text>
        </View>
        {isAdmin && (
          <View className="flex-row items-center gap-2">
            {editingCompany ? (
              <>
                <TouchableOpacity onPress={cancelEditingCompany} disabled={saving}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateCompany} disabled={saving}>
                  <Ionicons
                    name={saving ? "hourglass-outline" : "checkmark-circle"}
                    size={22}
                    color={saving ? colors.textMuted : colors.success}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={startEditingCompany}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View className="flex-row items-center gap-4 mb-4">
        {editingCompany ? (
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgInput, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        ) : company.logoUrl ? (
          <Image
            source={{ uri: company.logoUrl }}
            style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgInput }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
        )}
        <View className="flex-1">
          {editingCompany ? (
            <TextInput
              style={inputStyle}
              value={editCompanyName}
              onChangeText={setEditCompanyName}
              editable={!saving}
              placeholder={t("prf.companyName")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{company.name}</Text>
          )}
        </View>
      </View>

      <View className="gap-3">
        {isAdmin && company.invitationCode && (
          <View>
            <Text style={labelStyle}>{t("prf.invitationCode")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary + "4D" }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontFamily: "monospace", fontWeight: "600" }}>{company.invitationCode}</Text>
              <TouchableOpacity onPress={handleCopyInviteCode} style={{ marginLeft: 8 }}>
                <Ionicons name="copy-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("prf.invitationHint")}</Text>
          </View>
        )}
        <View>
          <Text style={labelStyle}>{t("prf.address")}</Text>
          {editingCompany ? (
            <TextInput
              style={inputStyle}
              value={editCompanyAddress}
              onChangeText={setEditCompanyAddress}
              editable={!saving}
              placeholder={t("prf.address")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={{ color: colors.text, fontSize: 14 }}>{company.address}</Text>
          )}
        </View>
        <View>
          <Text style={labelStyle}>{t("prf.companyPhone")}</Text>
          {editingCompany ? (
            <TextInput
              style={inputStyle}
              value={editCompanyPhone}
              onChangeText={setEditCompanyPhone}
              editable={!saving}
              keyboardType="phone-pad"
              placeholder={t("prf.companyPhone")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={{ color: colors.text, fontSize: 14 }}>{company.phone}</Text>
          )}
        </View>
        <View>
          <Text style={labelStyle}>{t("prf.companyEmail")}</Text>
          {editingCompany ? (
            <TextInput
              style={inputStyle}
              value={editCompanyEmail}
              onChangeText={setEditCompanyEmail}
              editable={!saving}
              keyboardType="email-address"
              placeholder={t("prf.companyEmail")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={{ color: colors.text, fontSize: 14 }}>{company.email}</Text>
          )}
        </View>
        <View>
          <Text style={labelStyle}>{t("prf.taxNumber")}</Text>
          {editingCompany ? (
            <TextInput
              style={inputStyle}
              value={editCompanyTaxNumber}
              onChangeText={setEditCompanyTaxNumber}
              editable={!saving}
              keyboardType="number-pad"
              placeholder={t("prf.taxNumber")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={{ color: colors.text, fontSize: 14 }}>{company.taxNumber || "-"}</Text>
          )}
        </View>
        {editingCompany && (
          <View>
            <Text style={labelStyle}>{t("prf.logo")}</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary + "4D", flexDirection: "row", alignItems: "center", gap: 8 }}
                onPress={pickLogo}
                disabled={saving}
              >
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  {editCompanyLogo ? t("prf.logoSelected") : t("prf.logoSelect")}
                </Text>
              </TouchableOpacity>
              {editCompanyLogo && (
                <TouchableOpacity onPress={() => setEditCompanyLogo(null)} disabled={saving}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            {editCompanyLogo && (
              <Image source={{ uri: editCompanyLogo }} style={{ width: "100%", height: 64, borderRadius: 8, marginTop: 8, backgroundColor: colors.bgInput }} resizeMode="contain" />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
