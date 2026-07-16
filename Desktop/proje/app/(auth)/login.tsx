import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import CustomAlert from "../../components/CustomAlert";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
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
      const response = await login(email.trim(), password.trim());

      console.log("🔑 Login response:", response);
      console.log("📋 Role:", response?.role);

      if (response?.role === "ADMIN") {
        console.log("➡️ complete-cp-profile'a yönlendiriliyor");
        router.replace("/(auth)/complete-cp-profile");
      } else {
        console.log("➡️ dashboard'a yönlendiriliyor");
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      console.log("Login error:", error?.message || error);
      const message = error.response?.data?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.";
      setAlertType("error");
      setAlertTitle("Hata");
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
        className="flex-1 bg-[#0A0A0A]"
      >
        <View className="flex-1 justify-center px-6">
          <View className="w-full max-w-sm mx-auto">
            <View className="items-center mb-10">
              <View className="w-14 h-14 bg-[#3B82F6] rounded-2xl items-center justify-center mb-4">
                <Text className="text-2xl font-bold text-white">M</Text>
              </View>
              <Text className="text-2xl font-bold text-white tracking-tight">
                Mira
              </Text>
              <Text className="text-gray-500 text-sm mt-1.5 tracking-wide">
                Müşteri İletişim Platformu
              </Text>
            </View>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-400 text-sm font-medium mb-1.5">
                  E-posta
                </Text>
                <TextInput
                  className={`w-full h-11 bg-[#1A1A1A] border rounded-lg px-4 text-white text-base ${emailError ? "border-red-500" : "border-[#2A2A2A]"}`}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setEmailError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? <Text className="text-red-500 text-xs mt-1 ml-1">{emailError}</Text> : null}
              </View>

              <View>
                <Text className="text-gray-400 text-sm font-medium mb-1.5">
                  Şifre
                </Text>
                <TextInput
                  className={`w-full h-11 bg-[#1A1A1A] border rounded-lg px-4 text-white text-base ${passwordError ? "border-red-500" : "border-[#2A2A2A]"}`}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                  secureTextEntry
                />
                {passwordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{passwordError}</Text> : null}
              </View>

              <TouchableOpacity className="self-end">
                <Text className="text-gray-500 text-sm">Şifremi Unuttum</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="w-full h-12 bg-[#3B82F6] rounded-lg items-center justify-center mt-5 active:bg-[#2563EB]"
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Giriş Yap
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-8">
              <Text className="text-gray-500">Hesabın yok mu? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text className="text-[#3B82F6] font-semibold">Kayıt Ol</Text>
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
