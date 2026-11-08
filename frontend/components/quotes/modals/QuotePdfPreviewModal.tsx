import { View, Text, TouchableOpacity, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useQuotes } from "../QuoteContext";
import PdfPreviewWeb from "../../PdfPreviewWeb";

export default function QuotePdfPreviewModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    pdfPreviewVisible,
    setPdfPreviewVisible,
    pdfPreviewHtml,
    pdfZoom,
    setPdfZoom,
    handleDownloadPDF,
  } = useQuotes();

  const close = () => setPdfPreviewVisible(false);

  return (
    <Modal visible={pdfPreviewVisible} animationType="slide" onRequestClose={close}>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <View style={{ backgroundColor: colors.bgCard, paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.pdfTitle")}</Text>
            <TouchableOpacity
              className="h-9 px-4 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
              onPress={close}
            >
              <Text className="text-sm font-medium" style={{ color: colors.text }}>{t("common.close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-1">
          {Platform.OS === "web" ? (
            <PdfPreviewWeb pdfZoom={pdfZoom} html={pdfPreviewHtml} onZoomChange={setPdfZoom} />
          ) : (
            <View style={{ flex: 1, backgroundColor: "#e5e5e5" }}>
              <WebView
                key={String(pdfZoom)}
                source={{ html: pdfPreviewHtml }}
                style={{ flex: 1, backgroundColor: "white" }}
                originWhitelist={["*"]}
                scalesPageToFit={true}
                setBuiltInZoomControls={true}
                setDisplayZoomControls={false}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={true}
                javaScriptEnabled
                domStorageEnabled
                injectedJavaScript={`
                  (function() {
                    var scale = ${(pdfZoom / 100).toFixed(2)};
                    var meta = document.querySelector('meta[name="viewport"]');
                    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
                    meta.content = 'width=device-width, initial-scale=' + scale + ', minimum-scale=0.2, maximum-scale=5.0, user-scalable=yes';
                    document.documentElement.style.width = '100%';
                    document.body.style.margin = '0';
                    document.body.style.webkitTextSizeAdjust = '100%';
                  })();
                  true;
                `}
              />
            </View>
          )}
        </View>
        <View style={{ backgroundColor: colors.bgCard, paddingBottom: Platform.OS === "web" ? 0 : insets.bottom }}>
          <View className="px-4 py-3 border-t" style={{ borderColor: colors.border }}>
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
            <Text className="font-semibold" style={{ color: "white" }}>{t("qot.downloadPdf")}</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}
