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

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { completeProfile } = useAuth();
  const [logo, setLogo] = useState("https://picsum.photos/seed/company/200/200");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
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
      setLogo(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!companyName.trim()) {
      Alert.alert("Hata", "Kurumsal isim alanı boş olamaz.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Hata", "Adres alanı boş olamaz.");
      return;
    }
    if (!phone1.trim()) {
      Alert.alert("Hata", "İletişim numarası alanı boş olamaz.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Hata", "E-posta alanı boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      await completeProfile({
        companyName: companyName.trim(),
        address: address.trim(),
        phone1: phone1.trim(),
        phone2: phone2.trim() || undefined,
        email: email.trim(),
        logo,
      });
      Alert.alert("Başarılı", "Kurumsal bilgiler kaydedildi.", [
        { text: "Devam Et", onPress: () => router.replace("/(tabs)/dashboard") },
      ]);
    } catch (error: any) {
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
                    source={{ uri: logo }}
                    className="w-20 h-20 rounded-xl bg-[#2A2A2A]"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <Text className="text-gray-500 text-xs mt-1.5">Logoya tıklayarak değiştirin</Text>
              </View>

              <View>
                <Text className={labelClass}>Kurumsal İsmi</Text>
                <TextInput
                  className={inputClass}
                  placeholder="Şirket adı"
                  placeholderTextColor="#555"
                  value={companyName}
                  onChangeText={setCompanyName}
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
                <Text className={labelClass}>İletişim Numarası 1</Text>
                <TextInput
                  className={inputClass}
                  placeholder="0555 123 45 67"
                  placeholderTextColor="#555"
                  value={phone1}
                  onChangeText={setPhone1}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className={labelClass}>İletişim Numarası 2 (opsiyonel)</Text>
                <TextInput
                  className={inputClass}
                  placeholder="0555 987 65 43"
                  placeholderTextColor="#555"
                  value={phone2}
                  onChangeText={setPhone2}
                  keyboardType="phone-pad"
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
