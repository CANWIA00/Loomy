import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import LogoPicker from "../../components/auth/LogoPicker";

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

  return (
    <AuthLayout hideTopBar>
      <View className="items-center mb-8">
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-4"
          style={{ backgroundColor: colors.primary }}
        >
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
        <LogoPicker
          uri={logoUrl}
          onPress={pickImage}
          label={t("cp.logo")}
          hint={t("cp.logoHint")}
        />
        <FormField
          label={t("cp.companyName")}
          placeholder={t("cp.companyNamePlaceholder")}
          value={name}
          onChangeText={setName}
        />
        <FormField
          label={t("cp.address")}
          placeholder={t("cp.companyAddressPlaceholder")}
          value={address}
          onChangeText={setAddress}
        />
        <FormField
          label={t("cp.phone")}
          placeholder="0555 123 45 67"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <FormField
          label={t("cp.taxNumber")}
          placeholder="1234567890"
          keyboardType="numeric"
          value={taxNumber}
          onChangeText={setTaxNumber}
        />
        <FormField
          label={t("cp.email")}
          placeholder="ornek@sirket.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="mt-6">
        <PrimaryButton title={t("cp.complete")} loading={loading} onPress={handleComplete} />
      </View>
    </AuthLayout>
  );
}
