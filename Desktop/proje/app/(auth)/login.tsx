import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    router.replace("/(tabs)/dashboard");
  };

  return (
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
                className="w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 text-white text-base"
                placeholder="ornek@email.com"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-gray-400 text-sm font-medium mb-1.5">
                Şifre
              </Text>
              <TextInput
                className="w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 text-white text-base"
                placeholder="••••••••"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity className="self-end">
              <Text className="text-gray-500 text-sm">Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="w-full h-12 bg-[#3B82F6] rounded-lg items-center justify-center mt-5 active:bg-[#2563EB]"
            onPress={handleLogin}
          >
            <Text className="text-white font-semibold text-base">
              Giriş Yap
            </Text>
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
  );
}
