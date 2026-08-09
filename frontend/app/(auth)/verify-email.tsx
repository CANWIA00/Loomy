import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { authApi } from "../../api/auth";
import AuthLayout from "../../components/auth/AuthLayout";
import CodeInput from "../../components/auth/CodeInput";
import type { CodeInputHandle } from "../../components/auth/CodeInput";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const emailParam =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
        ? params.email[0]
        : "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const codeInputRef = useRef<CodeInputHandle>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setAlertType("error");
      setAlertTitle(t("common.error"));
      setAlertMessage(t("verify.errorEmpty"));
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyEmail(emailParam, fullCode);
      const data = response.data;

      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            id: "",
            name: "",
            email: emailParam,
            role: data.role,
            profileCompleted: data.profileCompleted ?? false,
          })
        );

        setAlertType("success");
        setAlertTitle(t("common.success"));
        setAlertMessage(t("verify.success"));
        setAlertVisible(true);

        setTimeout(() => {
          if (data.role === "ADMIN" && data.profileCompleted === false) {
            router.replace("/(auth)/complete-cp-profile");
          } else {
            router.replace("/(tabs)/dashboard");
          }
        }, 1500);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t("verify.errorGeneric");
      setAlertType("error");
      setAlertTitle(t("common.error"));
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.resendVerification(emailParam);
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      codeInputRef.current?.focusFirst();
    } catch (error: any) {
      const message = error.response?.data?.message || t("verify.errorGeneric");
      setAlertType("error");
      setAlertTitle(t("common.error"));
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title={t("verify.title")}>
        <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-2">
          {t("verify.subtitle")}
        </Text>
        <Text style={{ color: colors.primary }} className="text-sm font-medium text-center mb-4">
          {t("verify.emailSent", { email: emailParam })}
        </Text>

        <CodeInput
          ref={codeInputRef}
          value={code}
          onChange={setCode}
          pasteLabel={t("verify.pasteCode")}
        />

        <View className="mb-4">
          <PrimaryButton title={t("verify.verify")} loading={loading} onPress={handleVerify} />
        </View>

        <PrimaryButton
          title={
            countdown > 0
              ? t("verify.resendIn", { seconds: countdown.toString() })
              : t("verify.resend")
          }
          variant="outline"
          loading={resendLoading}
          disabled={countdown > 0}
          onPress={handleResend}
        />

        <View className="flex-row justify-center mt-8">
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={{ color: colors.primary }} className="font-medium">
              {t("verify.backToLogin")}
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
