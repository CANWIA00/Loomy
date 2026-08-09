import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { profileApi, type CompanyDto, type UserProfile } from "../../api/profile";
import { authApi, type User } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type { SignaturePath } from "./types";

interface ProfilContextValue {
  profile: UserProfile | null;
  user: User | null;
  company: CompanyDto | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  fetchProfile: () => void;

  editingUser: boolean;
  editName: string;
  setEditName: (v: string) => void;
  editPhone: string;
  setEditPhone: (v: string) => void;
  startEditingUser: () => void;
  cancelEditingUser: () => void;
  handleUpdateUser: () => void;

  editingCompany: boolean;
  editCompanyName: string;
  setEditCompanyName: (v: string) => void;
  editCompanyAddress: string;
  setEditCompanyAddress: (v: string) => void;
  editCompanyPhone: string;
  setEditCompanyPhone: (v: string) => void;
  editCompanyEmail: string;
  setEditCompanyEmail: (v: string) => void;
  editCompanyTaxNumber: string;
  setEditCompanyTaxNumber: (v: string) => void;
  editCompanyLogoUrl: string;
  setEditCompanyLogoUrl: (v: string) => void;
  editCompanyLogo: string | null;
  setEditCompanyLogo: (v: string | null) => void;
  startEditingCompany: () => void;
  cancelEditingCompany: () => void;
  handleUpdateCompany: () => void;

  saving: boolean;
  signatureModalVisible: boolean;
  setSignatureModalVisible: (v: boolean) => void;
  handleSaveSignature: (paths: SignaturePath[]) => void;
  deleteModalVisible: boolean;
  setDeleteModalVisible: (v: boolean) => void;
  handleDeleteAccount: () => void;
  confirmDeleteAccount: () => void;
  handleLogout: () => void;
  handleCopyInviteCode: () => void;
}

const ProfilContext = createContext<ProfilContextValue | undefined>(undefined);

export function useProfil() {
  const ctx = useContext(ProfilContext);
  if (!ctx) throw new Error("useProfil must be used within ProfilProvider");
  return ctx;
}

export function ProfilProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigation = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyAddress, setEditCompanyAddress] = useState("");
  const [editCompanyPhone, setEditCompanyPhone] = useState("");
  const [editCompanyEmail, setEditCompanyEmail] = useState("");
  const [editCompanyTaxNumber, setEditCompanyTaxNumber] = useState("");
  const [editCompanyLogoUrl, setEditCompanyLogoUrl] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const user = profile?.user ?? null;
  const company = profile?.company ?? null;
  const isAdmin = user?.role === "ADMIN";

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileApi.getProfile();
      setProfile(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await logout();
        navigation.replace("/(auth)/login");
        return;
      }
      const message = err.response?.data?.message || t("prf.errorLoad");
      setError(message);
      Alert.alert(t("common.error"), message);
    } finally {
      setLoading(false);
    }
  }, [logout, navigation, t]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    navigation.replace("/(auth)/login");
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteModalVisible(false);
    try {
      await authApi.deleteAccount();
      await logout();
      navigation.replace("/(auth)/login");
    } catch (err: any) {
      const message = err.response?.data?.message || t("prf.errorDeleteAccount");
      Alert.alert(t("common.error"), message);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!company?.invitationCode) return;
    await Clipboard.setStringAsync(company.invitationCode);
    Alert.alert(t("prf.copied"), t("prf.copiedMsg", { code: company.invitationCode }));
  };

  const startEditingUser = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditingUser(true);
  };

  const cancelEditingUser = () => {
    setEditingUser(false);
    setEditName("");
    setEditPhone("");
  };

  const handleUpdateUser = async () => {
    if (!editName.trim()) {
      Alert.alert(t("common.error"), t("prf.nameEmpty"));
      return;
    }

    try {
      setSaving(true);
      const response = await profileApi.updateUser({
        name: editName.trim(),
        phone: editPhone.trim(),
      });

      setProfile((prev) => prev ? { ...prev, user: response.data } : prev);
      setEditingUser(false);
      Alert.alert(t("common.success"), t("prf.successUser"));
    } catch (err: any) {
      const message = err.response?.data?.message || t("prf.errorUser");
      Alert.alert(t("common.error"), message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignature = async (paths: SignaturePath[]) => {
    try {
      const response = await profileApi.updateUser({
        name: user?.name || "",
        phone: user?.phone || "",
        signature: JSON.stringify(paths),
      });
      setProfile((prev) => prev ? { ...prev, user: response.data } : prev);
      setSignatureModalVisible(false);
      Alert.alert(t("common.success"), t("prf.successSignature"));
    } catch (err: any) {
      Alert.alert(t("common.error"), t("prf.errorSignature"));
    }
  };

  const startEditingCompany = () => {
    setEditCompanyName(company?.name || "");
    setEditCompanyAddress(company?.address || "");
    setEditCompanyPhone(company?.phone || "");
    setEditCompanyEmail(company?.email || "");
    setEditCompanyTaxNumber(company?.taxNumber || "");
    setEditCompanyLogoUrl(company?.logoUrl || "");
    setEditCompanyLogo(null);
    setEditingCompany(true);
  };

  const cancelEditingCompany = () => {
    setEditingCompany(false);
    setEditCompanyName("");
    setEditCompanyAddress("");
    setEditCompanyPhone("");
    setEditCompanyEmail("");
    setEditCompanyTaxNumber("");
    setEditCompanyLogoUrl("");
    setEditCompanyLogo(null);
  };

  const handleUpdateCompany = async () => {
    if (!editCompanyName.trim()) {
      Alert.alert(t("common.error"), t("prf.companyNameEmpty"));
      return;
    }

    try {
      setSaving(true);
      const response = await profileApi.updateCompany({
        name: editCompanyName.trim(),
        address: editCompanyAddress.trim(),
        phone: editCompanyPhone.trim(),
        email: editCompanyEmail.trim(),
        taxNumber: editCompanyTaxNumber.trim(),
        logoUrl: editCompanyLogo || editCompanyLogoUrl.trim(),
      });

      setProfile((prev) => prev ? { ...prev, company: response.data } : prev);
      setEditingCompany(false);
      Alert.alert(t("common.success"), t("prf.successCompany"));
    } catch (err: any) {
      const message = err.response?.data?.message || t("prf.errorUser");
      Alert.alert(t("common.error"), message);
    } finally {
      setSaving(false);
    }
  };

  const value: ProfilContextValue = {
    profile,
    user,
    company,
    isAdmin,
    loading,
    error,
    fetchProfile,
    editingUser,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    startEditingUser,
    cancelEditingUser,
    handleUpdateUser,
    editingCompany,
    editCompanyName,
    setEditCompanyName,
    editCompanyAddress,
    setEditCompanyAddress,
    editCompanyPhone,
    setEditCompanyPhone,
    editCompanyEmail,
    setEditCompanyEmail,
    editCompanyTaxNumber,
    setEditCompanyTaxNumber,
    editCompanyLogoUrl,
    setEditCompanyLogoUrl,
    editCompanyLogo,
    setEditCompanyLogo,
    startEditingCompany,
    cancelEditingCompany,
    handleUpdateCompany,
    saving,
    signatureModalVisible,
    setSignatureModalVisible,
    handleSaveSignature,
    deleteModalVisible,
    setDeleteModalVisible,
    handleDeleteAccount,
    confirmDeleteAccount,
    handleLogout,
    handleCopyInviteCode,
  };

  return <ProfilContext.Provider value={value}>{children}</ProfilContext.Provider>;
}
