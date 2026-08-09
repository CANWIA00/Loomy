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
    togglePayment,
    setTogglePayment,
    handleTogglePayment,
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

      <CustomAlert
        visible={togglePayment.visible}
        type="confirm"
        title={togglePayment.customer?.hasPaidMonthly ? t("cst.confirmMarkPending") : t("cst.confirmMarkPaid")}
        message={togglePayment.customer?.hasPaidMonthly
          ? t("cst.confirmMarkPendingMessage", { name: togglePayment.customer?.companyName || "" })
          : t("cst.confirmMarkPaidMessage", { name: togglePayment.customer?.companyName || "" })
        }
        onClose={() => setTogglePayment({ visible: false, customer: null })}
        onConfirm={() => {
          if (togglePayment.customer) {
            handleTogglePayment(togglePayment.customer, !togglePayment.customer.hasPaidMonthly);
          }
        }}
        confirmText={t("common.confirm")}
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
