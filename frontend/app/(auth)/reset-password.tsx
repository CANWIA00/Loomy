import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { authApi } from "../../api/auth";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import CodeInput from "../../components/auth/CodeInput";
import type { CodeInputHandle } from "../../components/auth/CodeInput";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";

export default function ResetPasswordScreen() {
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
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

  const handleResetPassword = async () => {
    const fullCode = code.join("");
    let hasError = false;

    if (fullCode.length !== 6) {
      setAlertType("error");
      setAlertTitle(t("common.error"));
      setAlertMessage(t("reset.errorEmptyCode"));
      setAlertVisible(true);
      return;
    }

    if (!newPassword.trim()) {
      setNewPasswordError(t("reset.errorEmptyPassword"));
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError(t("reset.errorPasswordLength"));
      hasError = true;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("reset.errorPasswordMatch"));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await authApi.resetPassword(emailParam, fullCode, newPassword.trim());

      setAlertType("success");
      setAlertTitle(t("common.success"));
      setAlertMessage(t("reset.success"));
      setAlertVisible(true);

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || t("reset.errorGeneric");
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
      await authApi.forgotPassword(emailParam);
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      codeInputRef.current?.focusFirst();
    } catch (error: any) {
      const message = error.response?.data?.message || t("reset.errorGeneric");
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
      <AuthLayout title={t("reset.title")}>
        <Text style={{ color: colors.textSecondary }} className="text-sm text-center mb-2">
          {t("reset.subtitle")}
        </Text>
        <Text style={{ color: colors.primary }} className="text-sm font-medium text-center mb-4">
          {t("reset.emailSent", { email: emailParam })}
        </Text>

        <CodeInput
          ref={codeInputRef}
          value={code}
          onChange={setCode}
          pasteLabel={t("verify.pasteCode")}
        />

        <View className="space-y-4 mb-4">
          <FormField
            label={t("reset.newPassword")}
            error={newPasswordError}
            placeholder="-----------"
            secureTextEntry
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setNewPasswordError("");
            }}
          />
          <FormField
            label={t("reset.confirmPassword")}
            error={confirmPasswordError}
            placeholder="-----------"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError("");
            }}
          />
        </View>

        <View className="mb-4">
          <PrimaryButton
            title={t("reset.resetButton")}
            loading={loading}
            onPress={handleResetPassword}
          />
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
