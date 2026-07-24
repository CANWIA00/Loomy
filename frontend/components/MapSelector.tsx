import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

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
  const { t } = useLanguage();
  const { colors } = useTheme();
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
      Alert.alert(t("common.error"), t("map.errorLocation"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, width: "91%", maxWidth: 384, padding: 24 }}>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{t("map.selectAddress")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16 }}
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <Ionicons name="location-outline" size={36} color={colors.primary} />
            )}
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>{t("map.currentLocation")}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("map.gpsHint")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: "center" }}
            onPress={() => Linking.openURL("https://www.google.com/maps")}
          >
            <Ionicons name="map-outline" size={36} color={colors.teal} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>{t("map.selectFromMap")}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("map.googleMapsHint")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MobileMapSelector({ visible, onSelect, onClose }: MapSelectorProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("map.permissionRequired"), t("map.permissionDenied"));
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
      Alert.alert(t("common.error"), t("map.errorLocationMobile"));
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
        <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, width: "91%", maxWidth: 448, maxHeight: "80%", padding: 16 }}>
            <View className="flex-row justify-between items-center" style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{t("map.selectFromMap")}</Text>
              <TouchableOpacity onPress={() => setShowMap(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View className="flex-1" style={{ borderRadius: 12, overflow: "hidden" }}>
              <MapView onSelect={handleMapPress} />
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, width: "91%", maxWidth: 384, padding: 24 }}>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>{t("map.selectAddress")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16 }}
            onPress={handleCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <Ionicons name="location-outline" size={36} color={colors.primary} />
            )}
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>{t("map.currentLocation")}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("map.gpsHint")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 20, alignItems: "center" }}
            onPress={() => setShowMap(true)}
          >
            <Ionicons name="map-outline" size={36} color={colors.teal} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 12 }}>{t("map.selectFromMap")}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{t("map.mapHint")}</Text>
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
