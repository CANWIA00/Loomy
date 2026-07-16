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
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../contexts/AuthContext";

export default function CompleteCompanyProfileScreen() {
  const router = useRouter();
  const { completeCompanyProfile } = useAuth();
  const [logoUrl, setLogoUrl] = useState("https://picsum.photos/seed/company/200/200");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUrl(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await completeCompanyProfile({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        taxNumber: taxNumber.trim(),
        logoUrl,
      });

      console.log("✅ Complete Profile Success:", response);
      console.log("🟢 Dashboard'a yönlendiriliyor...");

      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      console.log("🔴 Complete Profile Error:", error);
      const message = error.response?.data?.message || "Bir sorun oluştu. Lütfen tekrar deneyin.";
      Alert.alert("Hata", message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 text-white text-base";
  const labelClass = "text-gray-400 text-xs font-medium mb-1";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0A0A0A]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10">
          <View className="w-full max-w-sm mx-auto">
            <View className="items-center mb-8">
              <View className="w-14 h-14 bg-[#3B82F6] rounded-2xl items-center justify-center mb-4">
                <Text className="text-2xl font-bold text-white">M</Text>
              </View>
              <Text className="text-2xl font-bold text-white tracking-tight">
                Kurumsal Bilgileri Tamamlayın
              </Text>
              <Text className="text-gray-500 text-sm mt-1.5 tracking-wide text-center">
                Şirket bilgilerinizi girerek hesabınızı tamamlayın
              </Text>
            </View>

            <View className="space-y-4">
              <View className="items-center">
                <Text className={labelClass}>Logo</Text>
                <TouchableOpacity onPress={pickImage} className="mt-1">
                  <Image
                    source={{ uri: logoUrl }}
                    className="w-20 h-20 rounded-xl bg-[#2A2A2A]"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <Text className="text-gray-500 text-xs mt-1.5">Logoya tıklayarak değiştirin</Text>
              </View>

              <View>
                <Text className={labelClass}>Şirket Adı</Text>
                <TextInput
                  className={inputClass}
                  placeholder="Şirket adı"
                  placeholderTextColor="#555"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text className={labelClass}>Adres</Text>
                <TextInput
                  className={inputClass}
                  placeholder="Şirket adresi"
                  placeholderTextColor="#555"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <View>
                <Text className={labelClass}>Telefon</Text>
                <TextInput
                  className={inputClass}
                  placeholder="0555 123 45 67"
                  placeholderTextColor="#555"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className={labelClass}>Vergi Numarası</Text>
                <TextInput
                  className={inputClass}
                  placeholder="1234567890"
                  placeholderTextColor="#555"
                  value={taxNumber}
                  onChangeText={setTaxNumber}
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className={labelClass}>E-posta</Text>
                <TextInput
                  className={inputClass}
                  placeholder="ornek@sirket.com"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              className="w-full h-12 bg-[#3B82F6] rounded-lg items-center justify-center mt-6 active:bg-[#2563EB]"
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Tamamla</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
