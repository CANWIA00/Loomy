import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useProfil } from "./ProfilContext";
import { removeWhiteBackground } from "../../utils/image";
import SvgAwareImage from "../SvgAwareImage";

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
    editCompanyGsm,
    setEditCompanyGsm,
    editCompanyEmail,
    setEditCompanyEmail,
    editCompanyFax,
    setEditCompanyFax,
    editCompanyWebsite,
    setEditCompanyWebsite,
    editCompanyTaxNumber,
    setEditCompanyTaxNumber,
    editCompanyLogo,
    setEditCompanyLogo,
    editCompanyStamp,
    setEditCompanyStamp,
    handleCopyInviteCode,
  } = useProfil();

  if (!company) return null;

  const inputStyle = {
    backgroundColor: colors.bgInput,
    color: colors.text,
    fontSize: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary + "4D",
    marginTop: 8,
  };

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

  const pickStamp = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const processed = await removeWhiteBackground(`data:image/png;base64,${result.assets[0].base64}`);
      setEditCompanyStamp(processed);
    }
  };

  const fields = [
    {
      key: "address",
      label: t("prf.address"),
      icon: "location-outline" as const,
      color: colors.primary,
      value: company.address,
      editValue: editCompanyAddress,
      setEditValue: setEditCompanyAddress,
    },
    {
      key: "phone",
      label: t("prf.companyPhone"),
      icon: "call-outline" as const,
      color: colors.teal,
      value: company.phone,
      editValue: editCompanyPhone,
      setEditValue: setEditCompanyPhone,
      keyboardType: "phone-pad" as const,
    },
    {
      key: "gsm",
      label: t("prf.companyGsm"),
      icon: "phone-portrait-outline" as const,
      color: colors.purple,
      value: company.gsm || "-",
      editValue: editCompanyGsm,
      setEditValue: setEditCompanyGsm,
      keyboardType: "phone-pad" as const,
    },
    {
      key: "email",
      label: t("prf.companyEmail"),
      icon: "mail-outline" as const,
      color: colors.pink,
      value: company.email,
      editValue: editCompanyEmail,
      setEditValue: setEditCompanyEmail,
      keyboardType: "email-address" as const,
    },
    {
      key: "fax",
      label: t("prf.companyFax"),
      icon: "print-outline" as const,
      color: colors.warning,
      value: company.fax || "-",
      editValue: editCompanyFax,
      setEditValue: setEditCompanyFax,
      keyboardType: "phone-pad" as const,
    },
    {
      key: "website",
      label: t("prf.companyWebsite"),
      icon: "globe-outline" as const,
      color: colors.teal,
      value: company.website || "-",
      editValue: editCompanyWebsite,
      setEditValue: setEditCompanyWebsite,
      keyboardType: "url" as const,
    },
    {
      key: "tax",
      label: t("prf.taxNumber"),
      icon: "receipt-outline" as const,
      color: colors.danger,
      value: company.taxNumber || "-",
      editValue: editCompanyTaxNumber,
      setEditValue: setEditCompanyTaxNumber,
      keyboardType: "number-pad" as const,
    },
  ];

  return (
    <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, borderColor: colors.border, borderWidth: 1, marginTop: 16 }} className="p-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: colors.purple + "18" }}>
            <Ionicons name="business-outline" size={18} color={colors.purple} />
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.text, fontWeight: "700" }} className="text-[15px]">{t("prf.companyInfo")}</Text>
            <Text style={{ color: colors.textMuted }} className="text-xs">{t("prf.companyDesc")}</Text>
          </View>
        </View>
        {isAdmin && !editingCompany && (
          <TouchableOpacity
            className="flex-row items-center px-3 py-1.5 rounded-lg gap-1.5"
            style={{ backgroundColor: colors.primary + "15" }}
            onPress={startEditingCompany}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>{t("common.edit")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row items-center gap-4 mb-4">
        {editingCompany ? (
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.bgInput, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        ) : company.logoUrl ? (
          <SvgAwareImage
            uri={company.logoUrl}
            style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.bgInput }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.purple + "18", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="business" size={24} color={colors.purple} />
          </View>
        )}
        <View className="flex-1">
          {editingCompany ? (
            <TextInput
              style={{ ...inputStyle, marginTop: 0 }}
              value={editCompanyName}
              onChangeText={setEditCompanyName}
              editable={!saving}
              placeholder={t("prf.companyName")}
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>{company.name}</Text>
              {isAdmin && company.invitationCode ? (
                <TouchableOpacity className="flex-row items-center gap-1.5 mt-1.5 self-start" onPress={handleCopyInviteCode}>
                  <View className="flex-row items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ backgroundColor: colors.primary + "15", borderColor: colors.primary + "30", borderWidth: 1 }}>
                    <Ionicons name="copy-outline" size={12} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "monospace", fontWeight: "700" }}>{company.invitationCode}</Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>

      {!editingCompany && company.stampUrl ? (
        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1">
            <Text style={{ color: colors.textMuted }} className="text-[11px] font-bold uppercase tracking-wide mb-1.5">{t("prf.stamp")}</Text>
            <SvgAwareImage
              uri={company.stampUrl}
              style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: colors.bgInput }}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : null}

      {isAdmin && company.invitationCode && !editingCompany && (
        <View className="rounded-xl px-3.5 py-2.5 mb-4" style={{ backgroundColor: colors.primary + "0D", borderColor: colors.primary + "22", borderWidth: 1 }}>
          <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">{t("prf.invitationHint")}</Text>
        </View>
      )}

      <View className="flex-row flex-wrap gap-3">
        {fields.map((field) => (
          <View
            key={field.key}
            className="rounded-2xl p-3.5"
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, flexGrow: 1, flexBasis: 0, minWidth: 150 }}
          >
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: field.color + "18" }}>
                <Ionicons name={field.icon} size={14} color={field.color} />
              </View>
              <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                {field.label}
              </Text>
            </View>
            {editingCompany ? (
              <TextInput
                style={inputStyle}
                value={field.editValue}
                onChangeText={field.setEditValue}
                editable={!saving}
                keyboardType={field.keyboardType as any}
                placeholder={field.label}
                placeholderTextColor={colors.textMuted}
                autoCapitalize={field.key === "website" ? "none" : undefined}
                autoCorrect={field.key !== "website"}
              />
            ) : (
              <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: "500", marginTop: 8 }} numberOfLines={1}>
                {field.value}
              </Text>
            )}
          </View>
        ))}
      </View>

      {editingCompany && (
        <View className="flex-row flex-wrap gap-3 mt-4">
          <View className="rounded-2xl p-3.5 flex-1 min-w-[150px]" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: colors.teal + "18" }}>
                <Ionicons name="image-outline" size={14} color={colors.teal} />
              </View>
              <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>{t("prf.logo")}</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: colors.bgInput, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary + "4D", flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={pickLogo}
              disabled={saving}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {editCompanyLogo ? t("prf.logoSelected") : t("prf.logoSelect")}
              </Text>
            </TouchableOpacity>
            {editCompanyLogo && (
              <SvgAwareImage uri={editCompanyLogo} style={{ width: "100%", height: 56, borderRadius: 8, marginTop: 8, backgroundColor: colors.bgInput }} resizeMode="contain" />
            )}
          </View>

          <View className="rounded-2xl p-3.5 flex-1 min-w-[150px]" style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: colors.danger + "18" }}>
                <Ionicons name="image-outline" size={14} color={colors.danger} />
              </View>
              <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>{t("prf.stamp")}</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: colors.bgInput, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.primary + "4D", flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={pickStamp}
              disabled={saving}
            >
              <Ionicons name="image-outline" size={18} color={colors.primary} />
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                {editCompanyStamp ? t("prf.stampSelected") : t("prf.stampSelect")}
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-2 mt-2">
              {(editCompanyStamp || company.stampUrl) ? (
                <SvgAwareImage
                  uri={(editCompanyStamp || company.stampUrl) as string}
                  style={{ width: 72, height: 72, borderRadius: 8, backgroundColor: colors.bgInput }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ height: 72, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: colors.textMuted + "55", backgroundColor: colors.bgInput, alignItems: "center", justifyContent: "center", flex: 1 }}>
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                </View>
              )}
              {editCompanyStamp && (
                <TouchableOpacity onPress={() => setEditCompanyStamp(null)} disabled={saving}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {editingCompany && (
        <View className="flex-row gap-3 mt-5">
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 13, alignItems: "center" }}
            onPress={cancelEditingCompany}
            disabled={saving}
          >
            <Text style={{ color: colors.danger, fontSize: 14, fontWeight: "600" }}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            onPress={handleUpdateCompany}
            disabled={saving}
          >
            {saving && <ActivityIndicator size="small" color="#fff" />}
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>{t("common.save")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}