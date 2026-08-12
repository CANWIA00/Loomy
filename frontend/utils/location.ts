import { Platform } from "react-native";
import * as Location from "expo-location";

export async function getCurrentAddress(): Promise<string> {
  if (Platform.OS === "web") {
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
    return adres;
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("PERMISSION_DENIED");
  }
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const { latitude, longitude } = loc.coords;
  let adres = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (geo) {
    adres = [geo.street, geo.district, geo.city, geo.region].filter(Boolean).join(", ") || adres;
  }
  return adres;
}
