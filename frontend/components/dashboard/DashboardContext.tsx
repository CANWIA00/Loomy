import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { customerApi, type Customer } from "../../api/customers";
import { paymentApi, type PaymentSummary, type PaymentRecord } from "../../api/payments";
import { appointmentApi, type Appointment } from "../../api/appointments";
import { teamApi, type Team } from "../../api/teams";
import { useAuth } from "../../contexts/AuthContext";
import { dateToStr } from "../../utils/date";
import type { PlanFilter, ToggleAlertState } from "./types";

interface DashboardContextValue {
  customers: Customer[];
  teams: Team[];
  paymentSummary: PaymentSummary | null;
  recentPayments: PaymentRecord[];
  filteredAppointments: Appointment[];
  planFilter: PlanFilter;
  setPlanFilter: (f: PlanFilter) => void;
  toggleAlert: ToggleAlertState;
  setToggleAlert: (v: ToggleAlertState) => void;
  detailModal: boolean;
  setDetailModal: (v: boolean) => void;
  detailAppointment: Appointment | null;
  setDetailAppointment: (a: Appointment | null) => void;
  togglePaid: (record: PaymentRecord) => Promise<void>;
  isAdmin: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [toggleAlert, setToggleAlert] = useState<ToggleAlertState>({ visible: false, record: null });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [planFilter, setPlanFilter] = useState<PlanFilter>("today");
  const [detailModal, setDetailModal] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  const getWeekDates = (): string[] => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(dateToStr(d));
    }
    return dates;
  };

  const filteredAppointments = todayAppointments.filter((a) => {
    const now = new Date();
    const today = dateToStr(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = dateToStr(tomorrowDate);
    if (planFilter === "today") return a.tarih === today;
    if (planFilter === "tomorrow") return a.tarih === tomorrow;
    if (planFilter === "week") return getWeekDates().includes(a.tarih);
    return true;
  });

  const fetchPayments = useCallback(async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        paymentApi.getSummary(),
        paymentApi.getAll(0, 5),
      ]);
      setPaymentSummary(summaryRes.data);
      setRecentPayments(recentRes.data.content);
    } catch {}
  }, []);

  const togglePaid = async (record: PaymentRecord) => {
    try {
      await paymentApi.updateStatus(record.id, !record.paid);
      setRecentPayments((prev) => prev.map((r) => r.id === record.id ? { ...r, paid: !r.paid } : r));
      setPaymentSummary((prev) => {
        if (!prev) return prev;
        const fee = record.amount;
        if (record.paid) {
          return { ...prev, paidTotal: prev.paidTotal - fee, pendingTotal: prev.pendingTotal + fee, paidCount: prev.paidCount - 1, pendingCount: prev.pendingCount + 1 };
        } else {
          return { ...prev, paidTotal: prev.paidTotal + fee, pendingTotal: prev.pendingTotal - fee, paidCount: prev.paidCount + 1, pendingCount: prev.pendingCount - 1 };
        }
      });
    } catch {}
  };

  useEffect(() => {
    customerApi.getAllSimple().then((res) => setCustomers(res.data)).catch(() => {});
    fetchPayments();
    Promise.all([
      appointmentApi.getAll().catch(() => ({ data: [] })),
      teamApi.getAll().catch(() => ({ data: [] })),
    ]).then(([aptRes, teamRes]) => {
      setTodayAppointments(aptRes.data);
      setTeams(teamRes.data);
    });
  }, [fetchPayments]);

  const value: DashboardContextValue = {
    customers,
    teams,
    paymentSummary,
    recentPayments,
    filteredAppointments,
    planFilter,
    setPlanFilter,
    toggleAlert,
    setToggleAlert,
    detailModal,
    setDetailModal,
    detailAppointment,
    setDetailAppointment,
    togglePaid,
    isAdmin,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
