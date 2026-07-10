import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface MapSelectorProps {
  visible: boolean;
  onSelect: (address: string) => void;
  onClose: () => void;
}

export default function MapSelector({ visible, onSelect, onClose }: MapSelectorProps) {
  if (Platform.OS === "web") {
    return <WebMapSelector visible={visible} onSelect={onSelect} onClose={onClose} />;
  }
  return <MobileMapSelector visible={visible} onSelect={onSelect} onClose={onClose} />;
}

function WebMapSelector({ visible, onSelect, onClose }: MapSelectorProps) {
  const [loading, setLoading] = useState(false);

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
      );
      const { latitude, longitude } = pos.coords;
      let adres = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=tr`
        );
        const data = await res.json();
        if (data?.display_name) {
          adres = data.display_name;
        }
      } catch {}
      onSelect(adres);
      onClose();
    } catch {
      Alert.alert("Hata", "Konum alınamadı. Tarayıcı konum iznini kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 backdrop-blur-sm">
        <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-lg font-bold">Adres Seç</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 items-center mb-4"
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <Ionicons name="location-outline" size={36} color="#3B82F6" />
            )}
            <Text className="text-white text-base font-semibold mt-3">Mevcut Konumumu Al</Text>
            <Text className="text-gray-500 text-xs mt-1">GPS ile konumunuzu kullanın</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 items-center"
            onPress={() => Linking.openURL("https://www.google.com/maps")}
          >
            <Ionicons name="map-outline" size={36} color="#10B981" />
            <Text className="text-white text-base font-semibold mt-3">Haritadan Seç</Text>
            <Text className="text-gray-500 text-xs mt-1">Google Maps'te adres belirleyin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MobileMapSelector({ visible, onSelect, onClose }: MapSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Konum izni verilmedi.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      let adres = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        adres = [geo.street, geo.district, geo.city, geo.region].filter(Boolean).join(", ") || adres;
      }
      onSelect(adres);
      onClose();
    } catch {
      Alert.alert("Hata", "Konum alınamadı. Lütfen GPS ve internet bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (latitude: number, longitude: number) => {
    let adres = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        adres = [geo.street, geo.district, geo.city, geo.region].filter(Boolean).join(", ") || adres;
      }
    } catch {}
    onSelect(adres);
    onClose();
  };

  if (showMap) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setShowMap(false)}>
        <View className="flex-1 justify-center items-center bg-black/40 backdrop-blur-sm">
          <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-lg max-h-[80%] p-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Haritadan Seç</Text>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 rounded-xl overflow-hidden">
              <MapView onSelect={handleMapPress} />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center bg-black/40 backdrop-blur-sm">
        <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-lg font-bold">Adres Seç</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 items-center mb-4"
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <Ionicons name="location-outline" size={36} color="#3B82F6" />
            )}
            <Text className="text-white text-base font-semibold mt-3">Mevcut Konumumu Al</Text>
            <Text className="text-gray-500 text-xs mt-1">GPS ile konumunuzu kullanın</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 items-center"
            onPress={() => setShowMap(true)}
          >
            <Ionicons name="map-outline" size={36} color="#10B981" />
            <Text className="text-white text-base font-semibold mt-3">Haritadan Seç</Text>
            <Text className="text-gray-500 text-xs mt-1">Harita üzerinde nokta belirleyin</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MapView({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const center: [number, number] = [28.9784, 41.0082];
  const CustomMapView = require("@chauffleet/expo-custom-map").CustomMapView;

  return (
    <CustomMapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 41.0082,
        longitude: 28.9784,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      center={center}
      zoom={13}
      tileUrlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      onMapPress={([lng, lat]: [number, number]) => onSelect(lat, lng)}
    />
  );
}
