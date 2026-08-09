import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { ProfilProvider, useProfil } from "../../components/profil/ProfilContext";
import ScreenHeader from "../../components/ScreenHeader";
import UserHeader from "../../components/profil/UserHeader";
import UserInfoCard from "../../components/profil/UserInfoCard";
import AdminCard from "../../components/profil/AdminCard";
import CompanyCard from "../../components/profil/CompanyCard";
import DangerZone from "../../components/profil/DangerZone";
import SignatureModal from "../../components/profil/modals/SignatureModal";
import CustomAlert from "../../components/CustomAlert";

function ProfileScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    loading,
    error,
    profile,
    fetchProfile,
    isAdmin,
    company,
    deleteModalVisible,
    setDeleteModalVisible,
    confirmDeleteAccount,
  } = useProfil();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 12 }}>{t("prf.loading")}</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>{t("prf.error")}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" }}>{error}</Text>
        <TouchableOpacity
          style={{ marginTop: 24, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={fetchProfile}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>{t("prf.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <ScreenHeader title={t("prf.title")} />

        <UserHeader />
        <UserInfoCard />

        {isAdmin && <AdminCard />}

        {company && <CompanyCard />}

        <DangerZone />

        <SignatureModal />

        <CustomAlert
          visible={deleteModalVisible}
          type="confirm"
          title={t("prf.deleteAccount")}
          message={t("prf.deleteAccountConfirm")}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={confirmDeleteAccount}
          confirmText={t("common.delete")}
          confirmColor="#ef4444"
        />
      </View>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <ProfilProvider>
      <ProfileScreenInner />
    </ProfilProvider>
  );
}
