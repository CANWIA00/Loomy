import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, BackHandler, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import ScreenHeader from "../../components/ScreenHeader";
import { QuotesProvider, useQuotes } from "../../components/quotes/QuoteContext";
import QuoteForm from "../../components/quotes/QuoteForm";
import QuoteRecordsSection from "../../components/quotes/QuoteRecordsSection";
import QuoteCustomerPrompt from "../../components/quotes/modals/QuoteCustomerPrompt";
import QuotePdfPreviewModal from "../../components/quotes/modals/QuotePdfPreviewModal";
import { computeQuoteTotals, formatMoney, getCurrencySymbol } from "../../components/quotes/types";
import CustomAlert from "../../components/CustomAlert";

/** Telefonda alt cubukta gosterilecek genel toplam metni. */
function useGrandTotalLabel(): string | null {
  const { form } = useQuotes();
  const { convert } = useCurrency();
  const groups = computeQuoteTotals(form.lines);
  const keys = Object.keys(groups).filter((k) => groups[k].grandTotal > 0);
  if (keys.length === 0) return null;
  if (keys.length === 1) return `${formatMoney(groups[keys[0]].grandTotal)} ${getCurrencySymbol(keys[0])}`;
  let tryTotal = 0;
  for (const k of keys) {
    const v = k === "TRY" ? groups[k].grandTotal : convert(groups[k].grandTotal, k);
    if (v == null) return keys.map((c) => `${formatMoney(groups[c].grandTotal)} ${getCurrencySymbol(c)}`).join(" · ");
    tryTotal += v;
  }
  return `≈ ${formatMoney(tryTotal)} ₺`;
}

/** Telefon: tam ekran teklif formu (ust cubuk + kaydirilabilir form + sabit Kaydet cubugu). */
function PhoneFormScreen({ onRequestClose }: { onRequestClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isEditing, handleClear, handleSave, scrollRef } = useQuotes();
  const totalLabel = useGrandTotalLabel();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-row items-center px-2 h-14 border-b" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
        <TouchableOpacity
          onPress={onRequestClose}
          className="h-11 w-11 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t("qot.backToList")}
        >
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-semibold ml-1" style={{ color: colors.text }} numberOfLines={1}>
          {isEditing ? t("qot.editQuote") : t("qot.newQuote")}
        </Text>
        <TouchableOpacity onPress={handleClear} className="h-11 px-3 flex-row items-center justify-center" accessibilityRole="button">
          <Ionicons name="refresh-outline" size={15} color={colors.danger} />
          <Text className="text-sm font-medium ml-1" style={{ color: colors.danger }}>{t("qot.clear")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef as any} className="flex-1" keyboardShouldPersistTaps="handled" indicatorStyle={colors.indicatorBg as any}>
        <View className="px-4 pt-4 pb-6">
          <QuoteForm variant="screen" />
        </View>
      </ScrollView>

      <View className="flex-row items-center px-4 py-3 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bgCard }}>
        <View className="flex-1 mr-3">
          <Text className="text-[11px]" style={{ color: colors.textMuted }}>{t("qot.grandTotalShort")}</Text>
          <Text className="text-base font-bold" style={{ color: totalLabel ? colors.text : colors.textMuted }} numberOfLines={1}>
            {totalLabel ?? "—"}
          </Text>
        </View>
        <TouchableOpacity
          className="h-12 px-6 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.primary, minWidth: 140 }}
          onPress={handleSave}
          accessibilityRole="button"
        >
          <Text className="font-semibold text-base" style={{ color: "white" }}>{isEditing ? t("qot.update") : t("common.save")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuotesScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const {
    showForm,
    setShowForm,
    openNewQuote,
    closeFormScreen,
    isFormDirty,
    deleteAlert,
    setDeleteAlert,
    handleDelete,
    resultAlert,
    setResultAlert,
    scrollRef,
  } = useQuotes();
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
          <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
            <ScreenHeader title={t("qot.title")} subtitle={t("qot.subtitle")} />

            {isPhone ? (
              <TouchableOpacity
                className="flex-row items-center justify-center h-12 rounded-xl mb-5"
                style={{ backgroundColor: colors.primary }}
                onPress={openNewQuote}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="font-semibold text-base ml-1.5" style={{ color: "white" }}>{t("qot.newQuote")}</Text>
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
                    {t("qot.newQuote")}
                  </Text>
                </TouchableOpacity>

                {showForm && <QuoteForm />}
              </>
            )}

            <QuoteRecordsSection />
          </View>
        </ScrollView>
      )}

      <CustomAlert
        visible={discardAlert}
        type="confirm"
        title={t("qot.discardTitle")}
        message={t("qot.discardMessage")}
        onClose={() => setDiscardAlert(false)}
        onConfirm={closeFormScreen}
        confirmText={t("qot.discardConfirm")}
        confirmColor={colors.danger}
      />

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

      <CustomAlert
        visible={resultAlert.visible}
        type={resultAlert.type}
        title={resultAlert.title}
        message={resultAlert.message}
        onClose={() => setResultAlert({ visible: false, type: "success", title: "", message: "" })}
      />

      <QuotePdfPreviewModal />
      <QuoteCustomerPrompt />
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
