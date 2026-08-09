import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleRegister = async () => {
    let hasError = false;

    if (!inviteCode.trim()) {
      setInviteCodeError(t("reg.errorInviteCode"));
      hasError = true;
    }
    if (!name.trim()) {
      setNameError(t("reg.errorName"));
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(t("reg.errorEmail"));
      hasError = true;
    }
    if (phone.replace(/\s/g, "").length < 10) {
      setPhoneError(t("reg.errorPhone"));
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError(t("reg.errorPassword"));
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t("reg.errorPasswordMatch"));
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        inviteCode: inviteCode.trim(),
      });

      if (response?.requiresVerification) {
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: email.trim() },
        });
      } else if (response?.role === "ADMIN" && response?.profileCompleted === false) {
        router.replace("/(auth)/complete-cp-profile");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error?.message || t("reg.errorRegister");
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
      <AuthLayout title={t("reg.title")}>
        <View className="space-y-4">
          <FormField
            label={t("reg.inviteCode")}
            error={inviteCodeError}
            hint={t("reg.inviteHint")}
            placeholder={t("reg.inviteCodePlaceholder")}
            secureTextEntry
            value={inviteCode}
            onChangeText={(text) => {
              setInviteCode(text);
              setInviteCodeError("");
            }}
          />
          <FormField
            label={t("reg.fullName")}
            error={nameError}
            placeholder={t("reg.fullName")}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameError("");
            }}
          />
          <FormField
            label={t("reg.email")}
            error={emailError}
            placeholder={t("reg.email")}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
          />
          <FormField
            label={t("reg.phone")}
            error={phoneError}
            placeholder={t("reg.phone")}
            keyboardType="phone-pad"
            maxLength={15}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/[^0-9]/g, ""));
              setPhoneError("");
            }}
          />
          <FormField
            label={t("reg.password")}
            error={passwordError}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
          />
          <FormField
            label={t("reg.confirmPassword")}
            error={confirmPasswordError}
            placeholder={t("reg.confirmPassword")}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError("");
            }}
          />
        </View>

        <View className="mt-6">
          <PrimaryButton title={t("reg.register")} loading={loading} onPress={handleRegister} />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text style={{ color: colors.textMuted }}>{t("reg.hasAccount")}</Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={{ color: colors.primary }} className="font-medium">
              {t("reg.login")}
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
