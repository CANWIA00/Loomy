import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage, Lang } from "../../contexts/LanguageContext";
import { authApi } from "../../api/auth";
import CustomAlert from "../../components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLanguage } = useLanguage();

  const emailParam = typeof params.email === "string" ? params.email : Array.isArray(params.email) ? params.email[0] : "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCodeChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      const focusIdx = Math.min(index + digits.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handlePaste = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    const digits = clipboardText.replace(/\D/g, "").slice(0, 6);
    if (digits.length === 0) return;
    const newCode = digits.split("").concat(Array(6 - digits.length).fill(""));
    setCode(newCode);
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

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
      const message =
        error.response?.data?.message || t("verify.errorGeneric");
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
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("verify.errorGeneric");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ backgroundColor: colors.bg }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            <View className="w-full max-w-sm mx-auto">
              <View className="flex-row items-center justify-between mb-8">
                <TouchableOpacity onPress={toggleTheme}>
                  <Ionicons
                    name={isDark ? "sunny-outline" : "moon-outline"}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <View className="items-center flex-1 mx-3">
                  <Image
                    source={
                      isDark
                        ? require("../../assets/loomy-dark.png")
                        : require("../../assets/loomy-light.png")
                    }
                    style={{ width: 88, height: 88 }}
                    className="rounded-2xl mb-4"
                    resizeMode="contain"
                  />
                  <Text
                    style={{ color: colors.text }}
                    className="text-2xl font-bold tracking-tight"
                  >
                    Loomy
                  </Text>
                  <Text
                    style={{ color: colors.textMuted }}
                    className="text-sm mt-1.5 tracking-wide"
                  >
                    {t("verify.title")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setLanguage(lang === "tr" ? "en" : ("tr" as Lang))
                  }
                  style={{
                    backgroundColor: colors.bgCard2,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}
                  >
                    {lang === "tr" ? "EN" : "TR"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={{ color: colors.textSecondary }}
                className="text-sm text-center mb-2"
              >
                {t("verify.subtitle")}
              </Text>
              <Text
                style={{ color: colors.primary }}
                className="text-sm font-medium text-center mb-4"
              >
                {t("verify.emailSent", { email: emailParam })}
              </Text>

              <View className="flex-row justify-center gap-3 mb-4">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    className="w-12 h-14 rounded-lg text-center text-xl font-bold"
                    style={{
                      backgroundColor: colors.bgCard,
                      color: colors.text,
                      borderColor: colors.border,
                      borderWidth: 1.5,
                    }}
                    maxLength={6}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                className="flex-row items-center justify-center mb-6 py-2"
                onPress={handlePaste}
              >
                <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="text-sm font-medium ml-1.5">
                  {t("verify.pasteCode")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-12 rounded-lg items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary }}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {t("verify.verify")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-12 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={handleResend}
                disabled={countdown > 0 || resendLoading}
              >
                {resendLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text
                    style={{
                      color: countdown > 0 ? colors.textMuted : colors.primary,
                    }}
                    className="font-medium text-base"
                  >
                    {countdown > 0
                      ? t("verify.resendIn", { seconds: countdown.toString() })
                      : t("verify.resend")}
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-8">
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text
                    style={{ color: colors.primary }}
                    className="font-medium"
                  >
                    {t("verify.backToLogin")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
