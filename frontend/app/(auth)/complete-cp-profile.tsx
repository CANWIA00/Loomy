import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export default function CompleteCompanyProfileScreen() {
  const router = useRouter();
  const { completeCompanyProfile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState("https://picsum.photos/seed/company/200/200");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUrl(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await completeCompanyProfile({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        taxNumber: taxNumber.trim(),
        logoUrl,
      });

      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || t("cp.errorGeneric");
      Alert.alert(t("common.error"), message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10">
          <View className="w-full max-w-sm mx-auto">
            <View className="items-center mb-8">
              <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: colors.primary }}>
                <Text className="text-2xl font-bold text-white">M</Text>
              </View>
              <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
                {t("cp.title")}
              </Text>
              <Text style={{ color: colors.textMuted }} className="text-sm mt-1.5 tracking-wide text-center">
                {t("cp.subtitle")}
              </Text>
            </View>

            <View className="space-y-4">
              <View className="items-center">
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.logo")}</Text>
                <TouchableOpacity onPress={pickImage} className="mt-1">
                  <Image
                    source={{ uri: logoUrl }}
                    className="w-20 h-20 rounded-xl"
                    style={{ backgroundColor: colors.bgInput }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5">{t("cp.logoHint")}</Text>
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.companyName")}</Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={inputStyle}
                  placeholder={t("cp.companyNamePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.address")}</Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={inputStyle}
                  placeholder={t("cp.companyAddressPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.phone")}</Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={inputStyle}
                  placeholder="0555 123 45 67"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.taxNumber")}</Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={inputStyle}
                  placeholder="1234567890"
                  placeholderTextColor={colors.textMuted}
                  value={taxNumber}
                  onChangeText={setTaxNumber}
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">{t("cp.email")}</Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={inputStyle}
                  placeholder="ornek@sirket.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              className="w-full h-12 rounded-lg items-center justify-center mt-6"
              style={{ backgroundColor: colors.primary }}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                 <Text className="text-white font-semibold text-base">{t("cp.complete")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
