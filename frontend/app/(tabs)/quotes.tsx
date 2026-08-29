import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import ScreenHeader from "../../components/ScreenHeader";
import { QuotesProvider, useQuotes } from "../../components/quotes/QuoteContext";
import QuoteForm from "../../components/quotes/QuoteForm";
import QuoteRecordsSection from "../../components/quotes/QuoteRecordsSection";
import QuotePdfPreviewModal from "../../components/quotes/modals/QuotePdfPreviewModal";
import CustomAlert from "../../components/CustomAlert";

function QuotesScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    showForm,
    setShowForm,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    scrollRef,
  } = useQuotes();

  return (
    <>
      <ScrollView ref={scrollRef as any} className="flex-1" style={{ backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
        <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
          <ScreenHeader title={t("qot.title")} subtitle={t("qot.subtitle")} />

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
              {t("qot.newQuote")}
            </Text>
          </TouchableOpacity>

          {showForm && <QuoteForm />}

          <QuoteRecordsSection />
        </View>
      </ScrollView>

      <CustomAlert
        visible={deleteAlert.visible}
        type="confirm"
        title={t("common.delete")}
        message={t("qot.confirmDelete", { name: deleteAlert.record?.customer || "" })}
        onClose={() => setDeleteAlert({ visible: false, record: null })}
        onConfirm={() => {
          if (deleteAlert.record) handleDelete(deleteAlert.record);
        }}
        confirmText={t("common.delete")}
        confirmColor={colors.danger}
      />

      <QuotePdfPreviewModal />
    </>
  );
}

export default function QuotesScreen() {
  return (
    <QuotesProvider>
      <QuotesScreenInner />
    </QuotesProvider>
  );
}
