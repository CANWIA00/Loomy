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
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import CustomAlert from "../../components/CustomAlert";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
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
      setInviteCodeError("Davet kodu boş olamaz.");
      hasError = true;
    }
    if (!name.trim()) {
      setNameError("Ad Soyad alanı boş olamaz.");
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Geçerli bir e-posta adresi girin.");
      hasError = true;
    }
    if (phone.replace(/\s/g, "").length < 10) {
      setPhoneError("Telefon en az 10 haneli olmalıdır.");
      hasError = true;
    }
    if (password.length < 6) {
      setPasswordError("Şifre en az 6 karakter olmalıdır.");
      hasError = true;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Şifreler eşleşmiyor.");
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

      if (response.role === "ADMIN") {
        router.replace("/(auth)/complete-cp-profile");
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error?.message || "Kayıt başarısız. Lütfen tekrar deneyin.";
      setAlertType("error");
      setAlertTitle("Hata");
      setAlertMessage(message);
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const getInputClass = (hasError: boolean) =>
    `w-full h-11 bg-[#1A1A1A] border rounded-lg px-4 text-white text-base ${hasError ? "border-red-500" : "border-[#2A2A2A]"}`;

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#0A0A0A]"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            <View className="w-full max-w-sm mx-auto">
              <View className="items-center mb-8">
                <View className="w-14 h-14 bg-[#3B82F6] rounded-2xl items-center justify-center mb-4">
                  <Text className="text-2xl font-bold text-white">M</Text>
                </View>
                <Text className="text-2xl font-bold text-white tracking-tight">
                  Mira
                </Text>
                <Text className="text-gray-500 text-sm mt-1.5 tracking-wide">
                  Yeni hesap oluşturun
                </Text>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    Davet Kodu
                  </Text>
                  <TextInput
                    className={getInputClass(!!inviteCodeError)}
                    placeholder="Admin veya davet kodunu girin"
                    placeholderTextColor="#555"
                    value={inviteCode}
                    onChangeText={(text) => { setInviteCode(text); setInviteCodeError(""); }}
                    secureTextEntry
                  />
                  {inviteCodeError ? <Text className="text-red-500 text-xs mt-1 ml-1">{inviteCodeError}</Text> : null}
                </View>

                <View>
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    Ad Soyad
                  </Text>
                  <TextInput
                    className={getInputClass(!!nameError)}
                    placeholder="Ad Soyad"
                    placeholderTextColor="#555"
                    value={name}
                    onChangeText={(text) => { setName(text); setNameError(""); }}
                  />
                  {nameError ? <Text className="text-red-500 text-xs mt-1 ml-1">{nameError}</Text> : null}
                </View>

                <View>
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    E-posta
                  </Text>
                  <TextInput
                    className={getInputClass(!!emailError)}
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
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    Telefon
                  </Text>
                  <TextInput
                    className={getInputClass(!!phoneError)}
                    placeholder="555-123-4567"
                    placeholderTextColor="#555"
                    value={phone}
                    onChangeText={(text) => { setPhone(text); setPhoneError(""); }}
                    keyboardType="phone-pad"
                  />
                  {phoneError ? <Text className="text-red-500 text-xs mt-1 ml-1">{phoneError}</Text> : null}
                </View>

                <View>
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    Şifre
                  </Text>
                  <TextInput
                    className={getInputClass(!!passwordError)}
                    placeholder="••••••••"
                    placeholderTextColor="#555"
                    value={password}
                    onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
                    secureTextEntry
                  />
                  {passwordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{passwordError}</Text> : null}
                </View>

                <View>
                  <Text className="text-gray-400 text-xs font-medium mb-1">
                    Şifre Tekrar
                  </Text>
                  <TextInput
                    className={getInputClass(!!confirmPasswordError)}
                    placeholder="••••••••"
                    placeholderTextColor="#555"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(""); }}
                    secureTextEntry
                  />
                  {confirmPasswordError ? <Text className="text-red-500 text-xs mt-1 ml-1">{confirmPasswordError}</Text> : null}
                </View>

              </View>

              <TouchableOpacity
                className="w-full h-12 bg-[#3B82F6] rounded-lg items-center justify-center mt-6 active:bg-[#2563EB]"
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Kaydol</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-8">
                <Text className="text-gray-500">Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text className="text-[#3B82F6] font-medium">Giriş Yap</Text>
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
