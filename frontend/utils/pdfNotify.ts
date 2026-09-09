import { Alert, Platform } from "react-native";
import { translate } from "../contexts/LanguageContext";

function showInfo(title: string, message: string): void {
  if (Platform.OS === "web") {
    window.alert(message);
    return;
  }
  Alert.alert(title, message);
}

export function notifyPdfShared(): void {
  showInfo(translate("common.success"), translate("common.pdfShared"));
}

export function notifyPdfDownloaded(): void {
  showInfo(translate("common.success"), translate("common.pdfDownloaded"));
}