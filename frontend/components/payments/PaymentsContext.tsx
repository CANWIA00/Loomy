import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import { paymentApi, type PaymentRecord, type PaymentSummary } from "../../api/payments";
import { useLanguage } from "../../contexts/LanguageContext";
import { LIST_SIZE, parseDate, type StatusOption, type StatusFilter, type TimeFilter, type ToggleAlertState } from "./types";

interface PaymentsContextValue {
  loading: boolean;
  summary: PaymentSummary | null;
  timeFilter: TimeFilter;
  setTimeFilter: (f: TimeFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  statusDropdownOpen: boolean;
  setStatusDropdownOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusOptions: StatusOption[];
  filteredServices: PaymentRecord[];
  listPage: number;
  setListPage: (p: number) => void;
  listTotalPages: number;
  pagedServices: PaymentRecord[];
  fetchData: () => void;
  formatAmount: (amount: number) => string;
  handleTogglePaid: (record: PaymentRecord) => void;
  toggleAlert: ToggleAlertState;
  setToggleAlert: (v: ToggleAlertState) => void;
}

const PaymentsContext = createContext<PaymentsContextValue | null>(null);

export function usePayments() {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error("usePayments must be used within PaymentsProvider");
  return ctx;
}

export function PaymentsProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [listPage, setListPage] = useState(0);
  const [toggleAlert, setToggleAlert] = useState<ToggleAlertState>({ visible: false, record: null });

  const statusOptions: StatusOption[] = [
    { label: t("pay.allStatus"), value: "all" },
    { label: t("pay.paid"), value: "odendi" },
    { label: t("pay.pending"), value: "bekliyor" },
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes] = await Promise.all([
        paymentApi.getAll(0, 200),
        paymentApi.getSummary(),
      ]);
      setRecords(paymentsRes.data.content);
      setSummary(summaryRes.data);
    } catch {
      Alert.alert(t("common.error"), t("pay.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setListPage(0);
  }, [searchQuery, timeFilter, statusFilter]);

  const filteredServices = records
    .filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCustomer = s.customer.toLowerCase().includes(q);
        const matchService = s.serviceType.toLowerCase().includes(q);
        if (!matchCustomer && !matchService) return false;
      }
      if (timeFilter !== "all") {
        const tarih = parseDate(s.tarih);
        const bugun = new Date();
        if (timeFilter === "gun" && tarih.toDateString() !== bugun.toDateString()) return false;
        if (timeFilter === "hafta") {
          const haftaBaslangic = new Date(bugun);
          haftaBaslangic.setDate(bugun.getDate() - bugun.getDay());
          const haftaBitis = new Date(bugun);
          haftaBitis.setDate(bugun.getDate() + (6 - bugun.getDay()));
          if (tarih < haftaBaslangic || tarih > haftaBitis) return false;
        }
        if (timeFilter === "ay" && (tarih.getMonth() !== bugun.getMonth() || tarih.getFullYear() !== bugun.getFullYear())) return false;
      }
      if (statusFilter !== "all") {
        const durum = s.paid ? "odendi" : "bekliyor";
        if (durum !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => parseDate(b.tarih).getTime() - parseDate(a.tarih).getTime());

  const handleTogglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecords((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      const summaryRes = await paymentApi.getSummary();
      setSummary(summaryRes.data);
    } catch {
      Alert.alert(t("common.error"), t("pay.errorUpdate"));
    }
  };

  const formatAmount = (amount: number) => {
    return `₺${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const listTotalPages = Math.ceil(filteredServices.length / LIST_SIZE);
  const pagedServices = filteredServices.slice(listPage * LIST_SIZE, (listPage + 1) * LIST_SIZE);

  const value: PaymentsContextValue = {
    loading,
    summary,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    statusDropdownOpen,
    setStatusDropdownOpen,
    searchQuery,
    setSearchQuery,
    statusOptions,
    filteredServices,
    listPage,
    setListPage,
    listTotalPages,
    pagedServices,
    fetchData,
    formatAmount,
    handleTogglePaid,
    toggleAlert,
    setToggleAlert,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
}
