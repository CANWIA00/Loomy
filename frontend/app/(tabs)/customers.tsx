import { ScrollView, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { CustomersProvider, useCustomers } from "../../components/customers/CustomersContext";
import ScreenHeader from "../../components/ScreenHeader";
import CustomerForm from "../../components/customers/CustomerForm";
import CustomerListSection from "../../components/customers/CustomerListSection";
import CustomerDetailModal from "../../components/customers/modals/CustomerDetailModal";
import MapSelector from "../../components/MapSelector";
import CustomAlert from "../../components/CustomAlert";

function CustomersScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    mapSelectorVisible,
    setMapSelectorVisible,
    setNewAddress,
    alertVisible,
    setAlertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertOnConfirm,
    setAlertOnConfirm,
  } = useCustomers();

  return (
    <>
      <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader title={t("cst.title")} subtitle={t("cst.subtitle")} />

          <CustomerForm />

          <CustomerListSection />
        </View>
      </ScrollView>

      <MapSelector
        visible={mapSelectorVisible}
        onSelect={(adres) => {
          setNewAddress(adres);
          setMapSelectorVisible(false);
        }}
        onClose={() => setMapSelectorVisible(false)}
      />

      <CustomerDetailModal />

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => { setAlertVisible(false); setAlertOnConfirm(undefined); }}
        onConfirm={alertOnConfirm}
        confirmText={alertType === "confirm" ? t("cst.delete") : undefined}
        confirmColor={alertType === "confirm" ? colors.danger : undefined}
      />
    </>
  );
}

export default function CustomersScreen() {
  return (
    <CustomersProvider>
      <CustomersScreenInner />
    </CustomersProvider>
  );
}
