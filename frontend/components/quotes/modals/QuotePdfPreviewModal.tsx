import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useQuotes } from "../QuoteContext";

export default function QuotePdfPreviewModal() {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("qot.pdfTitle")}</Text>
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
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#e5e5e5",
                overflow: "auto",
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
                  transformOrigin: "center center",
                  flexShrink: 0,
                } as any}
                dangerouslySetInnerHTML={{ __html: pdfPreviewHtml }}
              />
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
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          )}
        </View>
        <View className="px-4 py-3 border-t" style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}>
          <View className="flex-row items-center justify-center gap-4 mb-3">
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.max(20, z - 10))}
              className="w-9 h-9 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.bgInput }}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text className="text-sm font-semibold min-w-[50px] text-center" style={{ color: colors.text }}>
              %{pdfZoom}
            </Text>
            <TouchableOpacity
              onPress={() => setPdfZoom((z) => Math.min(150, z + 10))}
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
    </Modal>
  );
}
