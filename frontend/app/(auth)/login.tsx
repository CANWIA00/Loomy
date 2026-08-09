import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    (async () => {
      const frozen = await AsyncStorage.getItem("frozenNotice");
      if (frozen === "1") {
        await AsyncStorage.removeItem("frozenNotice");
        setAlertType("error");
        setAlertTitle("Hesap Donduruldu");
        setAlertMessage(
          "Kullanımınız Loomy tarafından donduruldu. Ödeme durumunuz için lütfen Loomy ile iletişime geçin."
        );
        setAlertVisible(true);
      }
    })();
  }, []);

  const handleLogin = async () => {
    let hasError = false;

    if (!email.trim()) {
      setEmailError(t("login.errorEmail"));
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError(t("login.errorPassword"));
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const response = await login(email.trim(), password.trim());

      if (response?.role === "ADMIN" && response?.profileCompleted === false) {
        router.replace("/(auth)/complete-cp-profile");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t("login.errorLogin");
      const requiresVerification = error.response?.data?.requiresVerification;
      const verificationEmail = error.response?.data?.email;

      if (requiresVerification && verificationEmail) {
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: verificationEmail },
        });
        return;
      }

      setAlertType("error");
      setAlertTitle(t("login.error"));
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout title={t("login.subtitle")}>
        <View className="space-y-4">
          <FormField
            label={t("login.email")}
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
          <FormField
            label={t("login.password")}
            error={passwordError}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
          />
          <TouchableOpacity className="self-end">
            <Text style={{ color: colors.textMuted }} className="text-sm">
              {t("login.forgotPassword")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-5">
          <PrimaryButton title={t("login.login")} loading={loading} onPress={handleLogin} />
        </View>

        <View className="flex-row justify-center mt-8">
          <Text style={{ color: colors.textMuted }}>{t("login.noAccount")}</Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={{ color: colors.primary }} className="font-semibold">
              {t("login.register")}
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
