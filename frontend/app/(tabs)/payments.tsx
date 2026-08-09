import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import ScreenHeader from "../../components/ScreenHeader";
import { PaymentsProvider, usePayments } from "../../components/payments/PaymentsContext";
import SummarySection from "../../components/payments/SummarySection";
import PaymentsListSection from "../../components/payments/PaymentsListSection";
import CustomAlert from "../../components/CustomAlert";

function PaymentsScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    loading,
    toggleAlert,
    setToggleAlert,
    handleTogglePaid,
  } = usePayments();

  if (loading) {
    return (
      <View style={{ backgroundColor: colors.bg }} className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="text-sm mt-3">{t("pay.loading")}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ backgroundColor: colors.bg }} className="flex-1" indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader title={t("pay.title")} subtitle={t("pay.subtitle")} />
          <SummarySection />
          <PaymentsListSection />
        </View>
      </ScrollView>

      <CustomAlert
        visible={toggleAlert.visible}
        type="confirm"
        title={toggleAlert.record?.paid ? t("dash.confirmRevert") : t("dash.confirmMarkPaid")}
        message={toggleAlert.record?.paid
          ? t("dash.confirmRevertMsg", { name: toggleAlert.record?.customer || "" })
          : t("dash.confirmMarkPaidMsg", { name: toggleAlert.record?.customer || "" })
        }
        onClose={() => setToggleAlert({ visible: false, record: null })}
        onConfirm={() => {
          if (toggleAlert.record) handleTogglePaid(toggleAlert.record);
        }}
        confirmText={t("common.confirm")}
      />
    </>
  );
}

export default function PaymentsScreen() {
  return (
    <PaymentsProvider>
      <PaymentsScreenInner />
    </PaymentsProvider>
  );
}
