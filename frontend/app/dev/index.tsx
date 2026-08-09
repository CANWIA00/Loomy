import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { devApi, getDevToken, setDevSession } from "../../api/dev";
import AuthLayout from "../../components/auth/AuthLayout";
import FormField from "../../components/auth/FormField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import CustomAlert from "../../components/CustomAlert";

export default function DevLoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    (async () => {
      const token = await getDevToken();
      if (token) {
        router.replace("/dev/dashboard");
        return;
      }
      setChecking(false);
    })();
  }, []);

  const handleLogin = async () => {
    let hasError = false;

    if (!email.trim()) {
      setEmailError("E-posta alanı boş olamaz.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Şifre alanı boş olamaz.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const response = await devApi.login(email.trim(), password.trim());
      await setDevSession(response.data.token, response.data.email);
      router.replace("/dev/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.message || "Giriş başarısız. Bilgilerinizi kontrol edin.";
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <AuthLayout
        logoTitle="Dev Panel"
        title="Yetkili erişimi"
        customLogo={
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary + "18" }}
          >
            <Ionicons name="code-slash" size={40} color={colors.primary} />
          </View>
        }
        rightButton={{ label: "APP", onPress: () => router.replace("/(auth)/login") }}
      >
        <View className="space-y-4">
          <FormField
            label="E-posta"
            error={emailError}
            placeholder="dev@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError("");
            }}
          />
          <FormField
            label="Parola"
            error={passwordError}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError("");
            }}
          />
        </View>

        <View className="mt-5">
          <PrimaryButton title="Panele Giriş" loading={loading} onPress={handleLogin} />
        </View>
      </AuthLayout>

      <CustomAlert
        visible={alertVisible}
        type="error"
        title="Hata"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}
