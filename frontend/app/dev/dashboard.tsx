import { View, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import CustomAlert from "../../components/CustomAlert";
import { DevDashboardProvider, useDevDashboard } from "../../components/devdashboard/DevDashboardContext";
import DevHeader from "../../components/devdashboard/DevHeader";
import TabBar from "../../components/devdashboard/TabBar";
import DashboardTab from "../../components/devdashboard/DashboardTab";
import CustomersTab from "../../components/devdashboard/CustomersTab";
import PaymentsTab from "../../components/devdashboard/PaymentsTab";
import KeysTab from "../../components/devdashboard/KeysTab";
import CreateKeyModal from "../../components/devdashboard/modals/CreateKeyModal";
import CompanyModal from "../../components/devdashboard/modals/CompanyModal";

function DevDashboardScreenInner() {
  const { colors } = useTheme();
  const {
    loading,
    refreshing,
    onRefresh,
    tab,
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertAction,
    closeAlert,
  } = useDevDashboard();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <DevHeader />
        <TabBar />

        <ScrollView
          className="flex-1"
          indicatorStyle={colors.indicatorBg as any}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
            {tab === "dashboard" && <DashboardTab />}
            {tab === "customers" && <CustomersTab />}
            {tab === "payments" && <PaymentsTab />}
            {tab === "keys" && <KeysTab />}
          </View>
        </ScrollView>
      </View>

      <CreateKeyModal />
      <CompanyModal />

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={closeAlert}
        onConfirm={alertAction || undefined}
        confirmColor={alertType === "confirm" ? colors.danger : colors.primary}
      />
    </>
  );
}

export default function DevDashboardScreen() {
  return (
    <DevDashboardProvider>
      <DevDashboardScreenInner />
    </DevDashboardProvider>
  );
}
