import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { authApi } from "../../api/auth";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleSendCode = async () => {
    if (!email.trim()) {
      setEmailError(t("forgot.errorEmail"));
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());

      setAlertType("success");
      setAlertTitle(t("forgot.successTitle"));
      setAlertMessage(t("forgot.successMessage"));
      setAlertVisible(true);

      setTimeout(() => {
        router.push({
          pathname: "/(auth)/reset-password",
          params: { email: email.trim() },
        });
      }, 1500);
    } catch (error: any) {
      const message = error.response?.data?.message || t("forgot.errorGeneric");
      setAlertType("error");
      setAlertTitle(t("common.error"));
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title={t("forgot.subtitle")}>
        <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-6">
          {t("forgot.description")}
        </Text>

        <View className="space-y-4">
          <FormField
            label={t("forgot.email")}
            error={emailError}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
          />
        </View>

        <View className="mt-5">
          <PrimaryButton
            title={t("forgot.sendCode")}
            loading={loading}
            onPress={handleSendCode}
          />
        </View>

        <View className="flex-row justify-center mt-8">
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={{ color: colors.primary }} className="font-medium">
              {t("forgot.backToLogin")}
            </Text>
          </TouchableOpacity>
        </View>
      </AuthLayout>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}
