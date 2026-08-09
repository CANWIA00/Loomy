import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import ScreenHeader from "../../components/ScreenHeader";
import { ServicesProvider, useServices } from "../../components/services/ServicesContext";
import ServiceForm from "../../components/services/ServiceForm";
import RecordsSection from "../../components/services/RecordsSection";
import SignatureModal from "../../components/services/modals/SignatureModal";
import SignatureRequiredModal from "../../components/services/modals/SignatureRequiredModal";
import ShareModal from "../../components/services/modals/ShareModal";
import PdfPreviewModal from "../../components/services/modals/PdfPreviewModal";
import MapSelector from "../../components/MapSelector";
import CustomAlert from "../../components/CustomAlert";

function ServicesScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    showForm,
    setShowForm,
    isEditing,
    saveAlertVisible,
    setSaveAlertVisible,
    confirmSave,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    mapSelectorVisible,
    setMapSelectorVisible,
    updateForm,
  } = useServices();

  return (
    <>
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader title={t("svc.title")} subtitle={t("svc.subtitle")} />

          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => setShowForm(!showForm)}
          >
            <View className="w-6 h-6 rounded-lg items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
              <Ionicons
                name={showForm ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </View>
            <Text className="font-semibold text-base ml-2" style={{ color: colors.text }}>
              {t("svc.newRecord")}
            </Text>
          </TouchableOpacity>

          {showForm && <ServiceForm />}

          <RecordsSection />
        </View>
      </ScrollView>

      <MapSelector
        visible={mapSelectorVisible}
        onSelect={(adres) => {
          updateForm("serviceAddress", adres);
          setMapSelectorVisible(false);
        }}
        onClose={() => setMapSelectorVisible(false)}
      />

      <CustomAlert
        visible={saveAlertVisible}
        type="confirm"
        title={isEditing ? t("svc.update") : t("common.save")}
        message={isEditing ? t("svc.confirmUpdate") : t("svc.confirmSave")}
        onClose={() => setSaveAlertVisible(false)}
        onConfirm={confirmSave}
        confirmText={t("common.confirm")}
      />

      <CustomAlert
        visible={deleteAlert.visible}
        type="confirm"
        title={t("common.delete")}
        message={t("svc.confirmDelete", { name: deleteAlert.record?.customer || "" })}
        onClose={() => setDeleteAlert({ visible: false, record: null })}
        onConfirm={() => {
          if (deleteAlert.record) handleDelete(deleteAlert.record);
        }}
        confirmText={t("common.delete")}
        confirmColor={colors.danger}
      />

      <SignatureModal />
      <SignatureRequiredModal />
      <ShareModal />
      <PdfPreviewModal />
    </>
  );
}

export default function ServicesScreen() {
  return (
    <ServicesProvider>
      <ServicesScreenInner />
    </ServicesProvider>
  );
}
