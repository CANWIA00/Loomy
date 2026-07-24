import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage, Lang } from "../../contexts/LanguageContext";
import CustomAlert from "../../components/CustomAlert";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, lang, setLanguage } = useLanguage();
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

  const getInputStyle = (hasError: boolean) => ({
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderColor: hasError ? colors.danger : colors.border,
    borderWidth: 1,
  });

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
                    {t("reg.title")}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr" as Lang)} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.inviteCode")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!inviteCodeError)}
                    placeholder={t("reg.inviteCodePlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    value={inviteCode}
                    onChangeText={(text) => { setInviteCode(text); setInviteCodeError(""); }}
                    secureTextEntry
                  />
                  {inviteCodeError ? <Text className="text-red-500 text-xs mt-1 ml-1">{inviteCodeError}</Text> : null}
                  {!inviteCodeError && (
                    <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5 ml-1">
                      {t("reg.inviteHint")}
                    </Text>
                  )}
                </View>

                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.fullName")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!nameError)}
                    placeholder={t("reg.fullName")}
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={(text) => { setName(text); setNameError(""); }}
                  />
                  {nameError ? <Text className="text-red-500 text-xs mt-1 ml-1">{nameError}</Text> : null}
                </View>

                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.email")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!emailError)}
                    placeholder={t("reg.email")}
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={(text) => { setEmail(text); setEmailError(""); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailError ? <Text className="text-red-500 text-xs mt-1 ml-1">{emailError}</Text> : null}
                </View>

                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.phone")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!phoneError)}
                    placeholder={t("reg.phone")}
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={(text) => { setPhone(text.replace(/[^0-9]/g, "")); setPhoneError(""); }}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                  {phoneError ? <Text className="text-red-500 text-xs mt-1 ml-1">{phoneError}</Text> : null}
                </View>

                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.password")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!passwordError)}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                    secureTextEntry
                  />
                  {passwordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{passwordError}</Text> : null}
                </View>

                <View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
                    {t("reg.confirmPassword")}
                  </Text>
                  <TextInput
                    className="w-full h-11 rounded-lg px-4 text-base"
                    style={getInputStyle(!!confirmPasswordError)}
                    placeholder={t("reg.confirmPassword")}
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(""); }}
                    secureTextEntry
                  />
                  {confirmPasswordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{confirmPasswordError}</Text> : null}
                </View>

              </View>

              <TouchableOpacity
                className="w-full h-12 rounded-lg items-center justify-center mt-6"
                style={{ backgroundColor: colors.primary }}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                   <Text className="text-white font-semibold text-base">{t("reg.register")}</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-8">
                <Text style={{ color: colors.textMuted }}>{t("reg.hasAccount")}</Text>
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text style={{ color: colors.primary }} className="font-medium">{t("reg.login")}</Text>
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
