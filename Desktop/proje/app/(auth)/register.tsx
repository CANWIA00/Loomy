import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

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

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!inviteCode.trim()) {
      Alert.alert("Hata", "Davet kodu boş olamaz.");
      return false;
    }
    if (!name.trim()) {
      Alert.alert("Hata", "Ad Soyad alanı boş olamaz.");
      return false;
    }
    if (!emailRegex.test(email)) {
      Alert.alert("Hata", "Geçerli bir e-posta adresi girin.");
      return false;
    }
    if (phone.replace(/\s/g, "").length < 10) {
      Alert.alert("Hata", "Telefon en az 10 haneli olmalıdır.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        inviteCode: inviteCode.trim(),
      });

      console.log("Register response:", JSON.stringify(response, null, 2));
      console.log("Role:", response.user.role);

      if (response.user.role === "ADMIN") {
        console.log("Redirecting to complete-profile...");
        router.replace("/(auth)/complete-profile");
      } else {
        console.log("Redirecting to dashboard...");
        router.replace("/(tabs)/dashboard");
      }
    } catch (error: any) {
      console.log("Register error:", error?.message || error);
      const message = error.response?.data?.message || "Kayıt başarısız. Lütfen tekrar deneyin.";
      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 text-white text-base";

  return (
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
                  className={inputClass}
                  placeholder="Admin veya davet kodunu girin"
                  placeholderTextColor="#555"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  secureTextEntry
                />
              </View>

              <View>
                <Text className="text-gray-400 text-xs font-medium mb-1">
                  Ad Soyad
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="Ad Soyad"
                  placeholderTextColor="#555"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text className="text-gray-400 text-xs font-medium mb-1">
                  E-posta
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-400 text-xs font-medium mb-1">
                  Telefon
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="555-123-4567"
                  placeholderTextColor="#555"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-gray-400 text-xs font-medium mb-1">
                  Şifre
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View>
                <Text className="text-gray-400 text-xs font-medium mb-1">
                  Şifre Tekrar
                </Text>
                <TextInput
                  className={inputClass}
                  placeholder="••••••••"
                  placeholderTextColor="#555"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
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
  );
}
