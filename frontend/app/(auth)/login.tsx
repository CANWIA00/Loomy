import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage, Lang } from "../../contexts/LanguageContext";
import CustomAlert from "../../components/CustomAlert";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ backgroundColor: colors.bg }}
      >
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            <View className="flex-row items-center justify-between mb-10">
              <TouchableOpacity onPress={toggleTheme}>
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
              </TouchableOpacity>
              <View className="items-center flex-1 mx-3">
                <Image
                  source={isDark ? require("../../assets/loomy-dark.png") : require("../../assets/loomy-light.png")}
                  style={{ width: 88, height: 88 }}
                  className="rounded-2xl mb-4"
                  resizeMode="contain"
                />
                <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
                  Loomy
                </Text>
                <Text style={{ color: colors.textMuted }} className="text-sm mt-1.5 tracking-wide">
                  {t("login.subtitle")}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr" as Lang)} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              <View>
                <Text style={{ color: colors.textSecondary }} className="text-sm font-medium mb-1.5">
                  {t("login.email")}
                </Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={{
                    backgroundColor: colors.bgCard,
                    color: colors.text,
                    borderColor: emailError ? colors.danger : colors.border,
                    borderWidth: 1,
                  }}
                  placeholder="ornek@email.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => { setEmail(text); setEmailError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? <Text className="text-red-500 text-xs mt-1 ml-1">{emailError}</Text> : null}
              </View>

              <View>
                <Text style={{ color: colors.textSecondary }} className="text-sm font-medium mb-1.5">
                  {t("login.password")}
                </Text>
                <TextInput
                  className="w-full h-11 rounded-lg px-4 text-base"
                  style={{
                    backgroundColor: colors.bgCard,
                    color: colors.text,
                    borderColor: passwordError ? colors.danger : colors.border,
                    borderWidth: 1,
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                  secureTextEntry
                />
                {passwordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{passwordError}</Text> : null}
              </View>

              <TouchableOpacity className="self-end">
                <Text style={{ color: colors.textMuted }} className="text-sm">{t("login.forgotPassword")}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="w-full h-12 rounded-lg items-center justify-center mt-5"
              style={{ backgroundColor: colors.primary }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {t("login.login")}
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text style={{ color: colors.textMuted }}>{t("login.noAccount")}</Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={{ color: colors.primary }} className="font-semibold">{t("login.register")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
