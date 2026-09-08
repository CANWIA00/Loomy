import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useServices } from "../ServicesContext";

export default function PdfPreviewModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    pdfPreviewVisible,
    setPdfPreviewVisible,
    pdfPreviewHtml,
    pdfZoom,
    setPdfZoom,
    handleDownloadPDF,
  } = useServices();

  const close = () => setPdfPreviewVisible(false);

  return (
    <Modal visible={pdfPreviewVisible} animationType="slide" onRequestClose={close}>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("svc.serviceForm")}</Text>
          <TouchableOpacity
            className="h-9 px-4 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={close}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text }}>{t("common.close")}</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1">
          {Platform.OS === "web" ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#e5e5e5",
                overflow: "auto",
                display: "block",
              } as any}
            >
              <div
                style={{
                  width: 794 * (pdfZoom / 100),
                  minHeight: 1123 * (pdfZoom / 100),
                  margin: "0 auto",
                } as any}
              >
                <div
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    backgroundColor: "white",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    padding: "15mm",
                    borderRadius: 4,
                    transform: `scale(${pdfZoom / 100})`,
                    transformOrigin: "top left",
                    flexShrink: 0,
                  } as any}
                  dangerouslySetInnerHTML={{ __html: pdfPreviewHtml }}
                />
              </div>
            </div>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: "#e5e5e5" }}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 12,
              }}
              showsVerticalScrollIndicator={true}
              maximumZoomScale={3}
              minimumZoomScale={0.2}
              bouncesZoom={true}
            >
              <View
                style={{
                  width: Dimensions.get("window").width - 24,
                  minHeight: (Dimensions.get("window").width - 24) * 1.414,
                  backgroundColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                  borderRadius: 4,
                  padding: 24,
                }}
              >
                <WebView
                  source={{ html: pdfPreviewHtml }}
                  style={{
                    width: "100%",
                    height: Math.max((Dimensions.get("window").width - 24) * 1.414, 700),
                    backgroundColor: "white",
                  }}
                  scrollEnabled={true}
                  setSupportMultipleWindows
                  javaScriptEnabled
                  domStorageEnabled
                  injectedJavaScript={`
                    (function() {
                      var meta = document.createElement('meta');
                      meta.name = 'viewport';
                      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes, viewport-fit=cover';
                      document.head.appendChild(meta);
                      document.body.style.zoom = ${(pdfZoom / 100).toFixed(2)};
                      document.documentElement.style.zoom = ${(pdfZoom / 100).toFixed(2)};
                      document.body.style.transformOrigin = 'top left';
                      document.addEventListener('dblclick', function(e) {
                        var s = document.body.style.zoom;
                        var cur = s ? parseFloat(s) : 1;
                        document.body.style.zoom = cur > 1.1 ? 1 : 2;
                        document.documentElement.style.zoom = cur > 1.1 ? 1 : 2;
                      });
                    })();
                    true;
                  `}
                />
              </View>
            </ScrollView>
          )}
        </View>
        <View className="px-4 py-3 border-t" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center justify-center gap-4 mb-3">
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.max(20, z - 20))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold min-w-[70px] text-center" style={{ color: colors.text }}>
              %{pdfZoom}
            </Text>
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.min(400, z + 20))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full h-12 rounded-xl items-center justify-center flex-row gap-2"
            style={{ backgroundColor: colors.primary }}
            onPress={handleDownloadPDF}
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="font-semibold" style={{ color: "white" }}>{t("svc.downloadPdf")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
