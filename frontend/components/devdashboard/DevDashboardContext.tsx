import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  devApi,
  clearDevSession,
  type AdminKey,
  type CompanySummary,
  type CompanyDetail,
  type DevStats,
} from "../../api/dev";
import { formatDate, paymentInfo, type Tab } from "./types";

type KeyFilter = "all" | "used" | "active" | "available";
type AlertType = "success" | "error" | "confirm";

interface PaymentStats {
  paid: number;
  overdue: number;
  neverPaid: number;
  expiringSoon: number;
}

interface DevDashboardContextValue {
  tab: Tab;
  setTab: React.Dispatch<React.SetStateAction<Tab>>;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;

  stats: DevStats | null;
  keys: AdminKey[];
  companies: CompanySummary[];
  companyDetail: CompanyDetail | null;

  filteredKeys: AdminKey[];
  filteredCompanies: CompanySummary[];
  paymentStats: PaymentStats;

  alertVisible: boolean;
  alertType: AlertType;
  alertTitle: string;
  alertMessage: string;
  alertAction: (() => void) | null;
  closeAlert: () => void;

  handleLogout: () => Promise<void>;
  copyToClipboard: (value: string) => Promise<void>;

  keySearch: string;
  setKeySearch: (v: string) => void;
  keyFilter: KeyFilter;
  setKeyFilter: (f: KeyFilter) => void;

  createKeyModal: boolean;
  setCreateKeyModal: (v: boolean) => void;
  createKeyCount: string;
  setCreateKeyCount: (v: string) => void;
  createKeyLoading: boolean;
  handleCreateKeys: () => Promise<void>;
  handleToggleKeyActive: (key: AdminKey) => void;
  handleToggleKeyUsed: (key: AdminKey) => void;
  handleDeleteKey: (key: AdminKey) => void;

  companySearch: string;
  setCompanySearch: (v: string) => void;
  companyModal: boolean;
  setCompanyModal: (v: boolean) => void;
  companyLoading: boolean;
  openCompany: (id: string) => Promise<void>;
  handleMarkPaid: (company: CompanySummary) => void;
  handleToggleCompanyFrozen: (company: CompanySummary) => void;
}

const DevDashboardContext = createContext<DevDashboardContextValue | null>(null);

export function useDevDashboard() {
  const ctx = useContext(DevDashboardContext);
  if (!ctx) throw new Error("useDevDashboard must be used within DevDashboardProvider");
  return ctx;
}

export function DevDashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DevStats | null>(null);
  const [keys, setKeys] = useState<AdminKey[]>([]);
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyDetail, setCompanyDetail] = useState<CompanyDetail | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("error");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertAction, setAlertAction] = useState<(() => void) | null>(null);

  const [createKeyModal, setCreateKeyModal] = useState(false);
  const [createKeyCount, setCreateKeyCount] = useState("5");
  const [createKeyLoading, setCreateKeyLoading] = useState(false);

  const [companyModal, setCompanyModal] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  const [keySearch, setKeySearch] = useState("");
  const [keyFilter, setKeyFilter] = useState<KeyFilter>("all");
  const [companySearch, setCompanySearch] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [s, k, c] = await Promise.all([devApi.stats(), devApi.adminKeys(), devApi.companies()]);
      setStats(s.data);
      setKeys(k.data);
      setCompanies(c.data);
    } catch (error: any) {
      showAlert("error", "Hata", error.response?.data?.message || "Veriler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    action?: () => void
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertAction(() => (action ? action : null));
    setAlertVisible(true);
  };

  const handleLogout = async () => {
    await clearDevSession();
    router.replace("/dev");
  };

  const copyToClipboard = async (value: string) => {
    await Clipboard.setStringAsync(value);
    showAlert("success", "Kopyalandı", `"${value}" panoya kopyalandı.`);
  };

  const handleCreateKeys = async () => {
    const n = parseInt(createKeyCount, 10);
    if (!n || n < 1 || n > 20) {
      showAlert("error", "Hata", "1 ile 20 arasında bir adet girin.");
      return;
    }
    setCreateKeyLoading(true);
    try {
      const res = await devApi.createAdminKeys(n);
      await loadAll();
      setCreateKeyModal(false);
      const values = res.data.created.map((k) => k.keyValue).join("\n");
      showAlert("success", "Oluşturuldu", `Yeni anahtar(ler) oluşturuldu:\n${values}`);
    } catch (error: any) {
      showAlert("error", "Hata", error.response?.data?.message || "Anahtar oluşturulamadı.");
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const handleToggleKeyActive = (key: AdminKey) => {
    showAlert(
      "confirm",
      key.isActive ? "Devre Dışı Bırak" : "Aktif Et",
      `"${key.keyValue}" anahtarı ${key.isActive ? "devre dışı bırakılacak" : "aktif edilecek"}. Emin misiniz?`,
      async () => {
        try {
          await devApi.updateAdminKey(key.id, { isActive: !key.isActive });
          await loadAll();
        } catch (error: any) {
          showAlert("error", "Hata", error.response?.data?.message || "Güncellenemedi.");
        }
      }
    );
  };

  const handleToggleKeyUsed = (key: AdminKey) => {
    showAlert(
      "confirm",
      key.isUsed ? "Kullanılmadı Yap" : "Kullanıldı Yap",
      `"${key.keyValue}" anahtarı ${key.isUsed ? "kullanılmadı olarak işaretlenecek" : "kullanıldı olarak işaretlenecek"}. Emin misiniz?`,
      async () => {
        try {
          await devApi.updateAdminKey(key.id, { isUsed: !key.isUsed });
          await loadAll();
        } catch (error: any) {
          showAlert("error", "Hata", error.response?.data?.message || "Güncellenemedi.");
        }
      }
    );
  };

  const handleDeleteKey = (key: AdminKey) => {
    showAlert(
      "confirm",
      "Anahtarı Sil",
      `"${key.keyValue}" anahtarı silinecek. Bu işlem geri alınamaz.`,
      async () => {
        try {
          await devApi.deleteAdminKey(key.id);
          await loadAll();
        } catch (error: any) {
          showAlert("error", "Hata", error.response?.data?.message || "Silinemedi.");
        }
      }
    );
  };

  const openCompany = async (id: string) => {
    setCompanyModal(true);
    setCompanyLoading(true);
    setCompanyDetail(null);
    try {
      const res = await devApi.company(id);
      setCompanyDetail(res.data);
    } catch (error: any) {
      showAlert("error", "Hata", error.response?.data?.message || "Müşteri yüklenemedi.");
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleToggleCompanyFrozen = (company: CompanySummary) => {
    const freezing = !company.isFrozen;
    showAlert(
      "confirm",
      freezing ? "Kullanımı Dondur" : "Kullanımı Aç",
      freezing
        ? `"${company.name}" müşterisinin kullanımı dondurulacak. Müşteriye kayıtlı TÜM kullanıcılar uygulamaya giriş yapamayacak. Emin misiniz?`
        : `"${company.name}" müşterisinin kullanımı açılacak. Müşteriye kayıtlı tüm kullanıcılar tekrar giriş yapabilecek. Emin misiniz?`,
      async () => {
        try {
          await devApi.updateCompany(company.id, { isFrozen: freezing });
          await loadAll();
        } catch (error: any) {
          showAlert("error", "Hata", error.response?.data?.message || "Güncellenemedi.");
        }
      }
    );
  };

  const handleMarkPaid = (company: CompanySummary) => {
    const info = paymentInfo(company.paidUntil);
    showAlert(
      "confirm",
      "Ödeme Alındı",
      info.paid
        ? `"${company.name}" müşterisinin aboneliği ${formatDate(company.paidUntil)} tarihine kadar geçerli. Yeni ödeme alındı olarak işaretlenecek ve abonelik 1 ay uzatılacak. Emin misiniz?`
        : `"${company.name}" müşterisi için aylık ödeme alındı olarak işaretlenecek ve abonelik bugünden itibaren 1 ay uzatılacak. Emin misiniz?`,
      async () => {
        try {
          await devApi.updateCompany(company.id, { markPaid: true });
          await loadAll();
          showAlert("success", "Başarılı", `"${company.name}" ödemesi kaydedildi. Abonelik 1 ay uzatıldı.`);
        } catch (error: any) {
          showAlert("error", "Hata", error.response?.data?.message || "Ödeme kaydedilemedi.");
        }
      }
    );
  };

  const filteredKeys = keys.filter(
    (k) =>
      (!keySearch.trim() || k.keyValue.toLowerCase().includes(keySearch.trim().toLowerCase())) &&
      (keyFilter === "all" ||
        (keyFilter === "used" && k.isUsed) ||
        (keyFilter === "active" && k.isActive) ||
        (keyFilter === "available" && k.isActive && !k.isUsed))
  );

  const filteredCompanies = companies.filter(
    (c) =>
      !companySearch.trim() ||
      c.name.toLowerCase().includes(companySearch.trim().toLowerCase()) ||
      (c.email || "").toLowerCase().includes(companySearch.trim().toLowerCase())
  );

  const paymentStats = (() => {
    const now = new Date();
    let paid = 0;
    let overdue = 0;
    let neverPaid = 0;
    let expiringSoon = 0;
    companies.forEach((c) => {
      if (!c.paidUntil) {
        neverPaid++;
        return;
      }
      const until = new Date(c.paidUntil);
      if (until < now) {
        overdue++;
      } else {
        paid++;
        const diffDays = Math.ceil((until.getTime() - now.getTime()) / 86400000);
        if (diffDays <= 14) expiringSoon++;
      }
    });
    return { paid, overdue, neverPaid, expiringSoon };
  })();

  const value: DevDashboardContextValue = {
    tab,
    setTab,
    loading,
    refreshing,
    onRefresh,
    stats,
    keys,
    companies,
    companyDetail,
    filteredKeys,
    filteredCompanies,
    paymentStats,
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertAction,
    closeAlert: () => setAlertVisible(false),
    handleLogout,
    copyToClipboard,
    keySearch,
    setKeySearch,
    keyFilter,
    setKeyFilter,
    createKeyModal,
    setCreateKeyModal,
    createKeyCount,
    setCreateKeyCount,
    createKeyLoading,
    handleCreateKeys,
    handleToggleKeyActive,
    handleToggleKeyUsed,
    handleDeleteKey,
    companySearch,
    setCompanySearch,
    companyModal,
    setCompanyModal,
    companyLoading,
    openCompany,
    handleMarkPaid,
    handleToggleCompanyFrozen,
  };

  return (
    <DevDashboardContext.Provider value={value}>
      {children}
    </DevDashboardContext.Provider>
  );
}
