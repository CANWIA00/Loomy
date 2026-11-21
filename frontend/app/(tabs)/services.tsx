import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, BackHandler, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import ScreenHeader from "../../components/ScreenHeader";
import { ServicesProvider, useServices } from "../../components/services/ServicesContext";
import ServiceForm from "../../components/services/ServiceForm";
import RecordsSection from "../../components/services/RecordsSection";
import SignatureModal from "../../components/services/modals/SignatureModal";
import SignatureRequiredModal from "../../components/services/modals/SignatureRequiredModal";
import TechnicianSignatureModal from "../../components/services/modals/TechnicianSignatureModal";
import PdfPreviewModal from "../../components/services/modals/PdfPreviewModal";
import MapSelector from "../../components/MapSelector";
import CustomAlert from "../../components/CustomAlert";

/** Telefon: tam ekran servis formu (ust cubuk + kaydirilabilir form + sabit Kaydet cubugu). */
function PhoneFormScreen({ onRequestClose }: { onRequestClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isEditing, handleClear, handleSave, scrollRef, contentTopRef } = useServices();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center px-2 h-14 border-b" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
        <TouchableOpacity
          onPress={onRequestClose}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t("svc.backToList")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-semibold ml-1" style={{ color: colors.text }} numberOfLines={1}>
          {isEditing ? t("svc.editRecord") : t("svc.newRecord")}
        </Text>
        <TouchableOpacity onPress={handleClear} className="h-11 px-3 flex-row items-center justify-center" accessibilityRole="button">
          <Ionicons name="refresh-outline" size={15} color={colors.danger} />
          <Text className="text-sm font-medium ml-1" style={{ color: colors.danger }}>{t("svc.clear")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef as any} className="flex-1" keyboardShouldPersistTaps="handled" indicatorStyle={colors.indicatorBg as any}>
        <View ref={contentTopRef as any} />
        <View className="px-4 pt-4 pb-6">
          <ServiceForm variant="screen" />
        </View>
      </ScrollView>

      <View className="px-4 py-3 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
        <TouchableOpacity
          className="h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
          accessibilityRole="button"
        >
          <Text className="font-semibold text-base" style={{ color: "white" }}>{isEditing ? t("svc.update") : t("common.save")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ServicesScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
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
    resultAlert,
    setResultAlert,
    mapSelectorVisible,
    setMapSelectorVisible,
    updateForm,
    scrollRef,
    contentTopRef,
    openNewRecord,
    closeFormScreen,
    isFormDirty,
  } = useServices();
  const [discardAlert, setDiscardAlert] = useState(false);

  const phoneFormOpen = isPhone && showForm;

  // Form ekranindan cikis: kaydedilmemis degisiklik varsa once sor.
  const requestCloseForm = () => {
    if (isFormDirty()) setDiscardAlert(true);
    else closeFormScreen();
  };

  // Android donanim geri tusu form ekranini kapatir.
  useEffect(() => {
    if (!phoneFormOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      requestCloseForm();
      return true;
    });
    return () => sub.remove();
  });

  return (
    <>
      {phoneFormOpen ? (
        <PhoneFormScreen onRequestClose={requestCloseForm} />
      ) : (
        <ScrollView ref={scrollRef as any} className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
          <View ref={contentTopRef as any} />
          <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
            <ScreenHeader title={t("svc.title")} subtitle={t("svc.subtitle")} />

            {isPhone ? (
              <TouchableOpacity
                className="flex-row items-center justify-center h-12 rounded-xl mb-5"
                style={{ backgroundColor: colors.primary }}
                onPress={openNewRecord}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="font-semibold text-base ml-1.5" style={{ color: "white" }}>{t("svc.newRecord")}</Text>
              </TouchableOpacity>
            ) : (
              <>
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
              </>
            )}

            <RecordsSection />
          </View>
        </ScrollView>
      )}

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
        visible={discardAlert}
        type="confirm"
        title={t("svc.discardTitle")}
        message={t("svc.discardMessage")}
        onClose={() => setDiscardAlert(false)}
        onConfirm={closeFormScreen}
        confirmText={t("svc.discardConfirm")}
        confirmColor={colors.danger}
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

      <CustomAlert
        visible={resultAlert.visible}
        type={resultAlert.type}
        title={resultAlert.title}
        message={resultAlert.message}
        onClose={() => setResultAlert({ visible: false, type: "success", title: "", message: "" })}
      />

      <SignatureModal />
      <SignatureRequiredModal />
      <TechnicianSignatureModal />
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
