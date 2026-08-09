import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Mode } from "react-native-big-calendar";
import { teamApi, type Team, type CompanyUser } from "../../api/teams";
import { appointmentApi, type Appointment } from "../../api/appointments";
import { customerApi } from "../../api/customers";
import { useLanguage } from "../../contexts/LanguageContext";
import { durationToMs, parseSaat, dateToStr, strToDate } from "../../utils/date";
import { TEAM_COLORS, type CustomerOption, type PlanFilter, type ScheduleEvent } from "./types";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "confirm";
}

interface ScheduleContextValue {
  loading: boolean;
  teams: Team[];
  appointments: Appointment[];
  customers: CustomerOption[];
  companyUsers: CompanyUser[];
  events: ScheduleEvent[];
  filteredAppointments: Appointment[];
  containerWidth: number;
  setContainerWidth: (w: number) => void;

  mode: Mode;
  setMode: (m: Mode) => void;
  calendarDate: Date;
  setCalendarDate: (d: Date) => void;
  selectedTeamFilter: string;
  setSelectedTeamFilter: (v: string) => void;

  planFilter: PlanFilter;
  setPlanFilter: (f: PlanFilter) => void;
  listTeamFilter: string;
  setListTeamFilter: (v: string) => void;

  serviceTypes: string[];
  durationOptions: { label: string; value: string }[];

  alert: AlertState;
  setAlertVisible: (v: boolean) => void;

  teamModalVisible: boolean;
  openTeamModal: () => void;
  closeTeamModal: () => void;
  addTeam: (name: string, leader: string, members: string[]) => Promise<boolean>;

  teamFilterTarget: "calendar" | "list" | null;
  showTeamFilter: (target: "calendar" | "list") => void;
  closeTeamFilter: () => void;

  openNewAppointment: (date?: Date) => void;
  appointmentModalVisible: boolean;
  closeAppointmentModal: () => void;
  saveAppointment: () => Promise<void>;
  requestDeleteEditing: () => void;
  editingAppointmentId: number | null;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  dateInputText: string;
  setDateInputText: (v: string) => void;
  selectedCustomer: CustomerOption | null;
  setSelectedCustomer: (c: CustomerOption | null) => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  timeInput: string;
  setTimeInput: (v: string) => void;
  selectedDuration: string;
  setSelectedDuration: (v: string) => void;
  selectedTeamId: number;
  setSelectedTeamId: (v: number) => void;
  selectedService: string;
  setSelectedService: (v: string) => void;
  notlar: string;
  setNotlar: (v: string) => void;
  appointmentSaving: boolean;
  customerSelectVisible: boolean;
  openCustomerSelect: () => void;
  closeCustomerSelect: () => void;
  serviceSelectVisible: boolean;
  openServiceSelect: () => void;
  closeServiceSelect: () => void;

  detailVisible: boolean;
  detailAppointment: Appointment | null;
  closeDetail: () => void;
  openDetail: (a: Appointment) => void;
  editDetail: () => void;
  requestDeleteDetail: () => void;
  openDetailFromEvent: (event: ScheduleEvent) => void;

  addMemberVisible: boolean;
  addMemberTeamId: number | null;
  openAddMember: (teamId: number) => void;
  closeAddMember: () => void;
  addMember: (teamId: number, userName: string) => Promise<boolean>;

  removeMembersVisible: boolean;
  removeTeamId: number | null;
  openRemoveMembers: (teamId: number) => void;
  closeRemoveMembers: () => void;
  removeMembers: (teamId: number, members: string[]) => Promise<boolean>;

  requestDeleteTeam: (teamId: number) => void;
  deleteTeamConfirmVisible: boolean;
  closeDeleteTeamConfirm: () => void;
  confirmDeleteTeam: () => Promise<void>;

  appointmentDeleteConfirmVisible: boolean;
  closeAppointmentDeleteConfirm: () => void;
  confirmDeleteAppointment: () => Promise<void>;

  deleteLoading: boolean;
  addLoading: boolean;
  removeLoading: boolean;

  dayListVisible: boolean;
  dayListDate: Date;
  dayListAppointments: Appointment[];
  closeDayList: () => void;
  openDayList: (date: Date, appts: Appointment[]) => void;
  addPlanFromDayList: () => void;

  handleDragEnd: (eventId: number, newStartTime: string, newDate: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error("useSchedule must be used within ScheduleProvider");
  return ctx;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  const [teams, setTeams] = useState<Team[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(350);

  const [mode, setMode] = useState<Mode>("day");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(t("sch.allTeams"));

  const [planFilter, setPlanFilter] = useState<PlanFilter>("gun");
  const [listTeamFilter, setListTeamFilter] = useState(t("sch.allTeams"));

  const [alert, setAlert] = useState<AlertState>({ visible: false, title: "", message: "", type: "error" });

  const showAlert = useCallback((type: AlertState["type"], title: string, message: string) => {
    setAlert({ visible: true, title, message, type });
  }, []);

  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [teamFilterTarget, setTeamFilterTarget] = useState<"calendar" | "list" | null>(null);

  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateInputText, setDateInputText] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [timeInput, setTimeInput] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState("1saat");
  const [selectedTeamId, setSelectedTeamId] = useState(0);
  const [selectedService, setSelectedService] = useState("Alarm");
  const [notlar, setNotlar] = useState("");
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [customerSelectVisible, setCustomerSelectVisible] = useState(false);
  const [serviceSelectVisible, setServiceSelectVisible] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<number | null>(null);
  const [removeMembersVisible, setRemoveMembersVisible] = useState(false);
  const [removeTeamId, setRemoveTeamId] = useState<number | null>(null);

  const [deleteTeamConfirmVisible, setDeleteTeamConfirmVisible] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
  const [appointmentDeleteConfirmVisible, setAppointmentDeleteConfirmVisible] = useState(false);
  const [appointmentDeleteId, setAppointmentDeleteId] = useState<number | null>(null);

  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [dayListVisible, setDayListVisible] = useState(false);
  const [dayListDate, setDayListDate] = useState(new Date());
  const [dayListAppointments, setDayListAppointments] = useState<Appointment[]>([]);

  const serviceTypes = [
    t("sch.serviceTypes.alarm"), t("sch.serviceTypes.fire"), t("sch.serviceTypes.cctv"), t("sch.serviceTypes.assembly"),
    t("sch.serviceTypes.wiring"), t("sch.serviceTypes.commissioning"), t("sch.serviceTypes.maintenance"), t("sch.serviceTypes.repair"),
  ];

  const durationOptions = [
    { label: t("dur.30min"), value: "30dk" },
    { label: t("dur.1hour"), value: "1saat" },
    { label: t("dur.1.5hour"), value: "1.5saat" },
    { label: t("dur.2hour"), value: "2saat" },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, appointmentsRes, customersRes, usersRes] = await Promise.all([
        teamApi.getAll(),
        appointmentApi.getAll(),
        customerApi.getAllSimple(),
        teamApi.getCompanyUsers(),
      ]);
      setTeams(teamsRes.data);
      setAppointments(appointmentsRes.data);
      setCustomers(customersRes.data);
      setCompanyUsers(usersRes.data);
    } catch (error: any) {
      console.error("Veri yükleme hatası:", error);
      showAlert("error", t("common.error"), t("sch.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAppointments = selectedTeamFilter === t("sch.allTeams")
    ? appointments
    : appointments.filter((a) => a.ekip === selectedTeamFilter);

  const events: ScheduleEvent[] = filteredAppointments.map((a) => {
    const tarihDate = strToDate(a.tarih);
    const { h, m } = parseSaat(a.startTime);
    const start = new Date(tarihDate);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + durationToMs(a.duration));
    const team = teams.find((t) => t.id === a.ekipId);
    return {
      title: `${a.customerName} - ${a.tur}`,
      ekipAdi: a.ekip,
      start,
      end,
      renk: team?.color || "#6080FF",
      eventId: a.id,
      notlar: a.notes || "",
    };
  });

  const addTeam = async (name: string, leader: string, members: string[]): Promise<boolean> => {
    if (!name.trim() || !leader.trim()) {
      showAlert("error", t("common.warning"), t("sch.errorTeamRequired"));
      return false;
    }
    try {
      setAddLoading(true);
      const color = TEAM_COLORS[teams.length % TEAM_COLORS.length];
      const res = await teamApi.create({
        name: name.trim(),
        leader: leader.trim(),
        color,
        members,
      });
      setTeams((prev) => [...prev, res.data]);
      setTeamModalVisible(false);
      return true;
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorTeamAdd"));
      return false;
    } finally {
      setAddLoading(false);
    }
  };

  const addMember = async (teamId: number, userName: string): Promise<boolean> => {
    if (!userName.trim()) return false;
    try {
      setAddLoading(true);
      const res = await teamApi.addMember(teamId, userName.trim());
      setTeams((prev) => prev.map((t) => t.id === teamId ? res.data : t));
      return true;
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorPersonnelAdd"));
      return false;
    } finally {
      setAddLoading(false);
    }
  };

  const removeMembers = async (teamId: number, members: string[]): Promise<boolean> => {
    if (members.length === 0) {
      showAlert("error", t("common.warning"), t("sch.errorSelectPersonnel"));
      return false;
    }
    try {
      setRemoveLoading(true);
      const res = await teamApi.removeMembers(teamId, [...members]);
      setTeams((prev) => prev.map((t) => t.id === teamId ? res.data : t));
      setRemoveMembersVisible(false);
      setRemoveTeamId(null);
      return true;
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorPersonnelRemove"));
      return false;
    } finally {
      setRemoveLoading(false);
    }
  };

  const openNewAppointment = useCallback((date?: Date) => {
    const d = date || new Date();
    setSelectedDate(d);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    setDateInputText(`${dd}/${mm}/${yyyy}`);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setTimeInput("09:00");
    setSelectedDuration("1saat");
    setSelectedService(serviceTypes[0] || "Alarm");
    setSelectedTeamId(teams[0]?.id || 0);
    setNotlar("");
    setEditingAppointmentId(null);
    setAppointmentModalVisible(true);
  }, [serviceTypes, teams]);

  const closeAppointmentModal = () => {
    setAppointmentModalVisible(false);
    setEditingAppointmentId(null);
  };

  const openDetail = (a: Appointment) => {
    setDetailAppointment(a);
    setDetailVisible(true);
  };

  const openDetailFromEvent = (event: ScheduleEvent) => {
    const atama = appointments.find(
      (a) => event.title.startsWith(`${a.customerName} - ${a.tur}`)
    );
    if (atama) openDetail(atama);
  };

  const editDetail = () => {
    if (!detailAppointment) return;
    const atama = detailAppointment;
    setEditingAppointmentId(atama.id);
    const found = customers.find((c) => c.companyName === atama.customerName);
    setSelectedCustomer(found || (atama.customerId ? { id: atama.customerId, companyName: atama.customerName, contactPerson: "" } : null));
    const d = strToDate(atama.tarih);
    setSelectedDate(d);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    setDateInputText(`${dd}/${mm}/${yyyy}`);
    setTimeInput(atama.startTime);
    setSelectedDuration(atama.duration);
    setSelectedService(atama.tur);
    setSelectedTeamId(atama.ekipId);
    setNotlar(atama.notes || "");
    setDetailVisible(false);
    setAppointmentModalVisible(true);
  };

  const saveAppointment = async () => {
    const team = teams.find((t) => t.id === selectedTeamId);
    const customerName = selectedCustomer?.companyName || customerSearch.trim();
    if (!customerName) {
      showAlert("error", t("common.warning"), t("sch.errorCustomerRequired"));
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeInput)) {
      showAlert("error", t("common.warning"), t("sch.errorInvalidTime"));
      return;
    }
    const [h] = timeInput.split(":").map(Number);
    if (h < 8 || h > 23) {
      showAlert("error", t("common.warning"), t("sch.errorTimeRange"));
      return;
    }
    const tarihStr = dateToStr(selectedDate);
    const { h: newH, m: newM } = parseSaat(timeInput);
    const newStartMin = newH * 60 + newM;
    const newEndMin = newStartMin + durationToMs(selectedDuration) / 60000;
    const conflict = appointments.find((a) => {
      if (a.ekipId !== selectedTeamId) return false;
      if (a.tarih !== tarihStr) return false;
      if (editingAppointmentId && a.id === editingAppointmentId) return false;
      const { h: aH, m: aM } = parseSaat(a.startTime);
      const aStartMin = aH * 60 + aM;
      const aEndMin = aStartMin + durationToMs(a.duration) / 60000;
      return newStartMin < aEndMin && newEndMin > aStartMin;
    });
    if (conflict) {
      showAlert("error", t("sch.errorConflict"), t("sch.errorConflictMsg", { name: conflict.customerName, time: conflict.startTime, duration: conflict.duration }));
      return;
    }
    try {
      setAppointmentSaving(true);
      const payload = {
        customerName,
        customerId: selectedCustomer?.id,
        ekip: team?.name || "",
        ekipId: selectedTeamId,
        tarih: dateToStr(selectedDate),
        startTime: timeInput,
        duration: selectedDuration,
        tur: selectedService,
        notes: notlar,
      };
      if (editingAppointmentId) {
        const res = await appointmentApi.update(editingAppointmentId, payload);
        setAppointments((prev) => prev.map((a) => a.id === editingAppointmentId ? res.data : a));
      } else {
        const res = await appointmentApi.create(payload);
        setAppointments((prev) => [...prev, res.data]);
      }
      setAppointmentModalVisible(false);
      setEditingAppointmentId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorSave"));
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleDragEnd = async (eventId: number, newStartTime: string, newDate: string) => {
    const draggedAppt = appointments.find((a) => a.id === eventId);
    if (draggedAppt) {
      const { h: newH, m: newM } = parseSaat(newStartTime);
      const newStartMin = newH * 60 + newM;
      const newEndMin = newStartMin + durationToMs(draggedAppt.duration) / 60000;
      const conflict = appointments.find((a) => {
        if (a.ekipId !== draggedAppt.ekipId) return false;
        if (a.tarih !== newDate) return false;
        if (a.id === eventId) return false;
        const { h: aH, m: aM } = parseSaat(a.startTime);
        const aStartMin = aH * 60 + aM;
        const aEndMin = aStartMin + durationToMs(a.duration) / 60000;
        return newStartMin < aEndMin && newEndMin > aStartMin;
      });
      if (conflict) {
        showAlert("error", t("sch.errorConflict"), t("sch.errorConflictMsg", { name: conflict.customerName, time: conflict.startTime, duration: conflict.duration }));
        return;
      }
    }
    try {
      await appointmentApi.update(eventId, { startTime: newStartTime, tarih: newDate } as any);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === eventId ? { ...a, startTime: newStartTime, tarih: newDate } : a
        )
      );
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorDrag"));
    }
  };

  const requestDeleteEditing = () => {
    if (editingAppointmentId === null) return;
    setAppointmentDeleteId(editingAppointmentId);
    setAppointmentDeleteConfirmVisible(true);
  };

  const requestDeleteDetail = () => {
    if (!detailAppointment) return;
    setAppointmentDeleteId(detailAppointment.id);
    setDetailVisible(false);
    setAppointmentDeleteConfirmVisible(true);
  };

  const confirmDeleteAppointment = async () => {
    if (appointmentDeleteId === null) return;
    try {
      setDeleteLoading(true);
      await appointmentApi.delete(appointmentDeleteId);
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentDeleteId));
      setAppointmentDeleteConfirmVisible(false);
      setAppointmentDeleteId(null);
      setAppointmentModalVisible(false);
      setEditingAppointmentId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorSave"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const requestDeleteTeam = (teamId: number) => {
    setDeleteTeamId(teamId);
    setDeleteTeamConfirmVisible(true);
  };

  const confirmDeleteTeam = async () => {
    if (deleteTeamId === null) return;
    try {
      setDeleteLoading(true);
      await teamApi.delete(deleteTeamId);
      setTeams((prev) => prev.filter((t) => t.id !== deleteTeamId));
      setAppointments((prev) => prev.filter((a) => a.ekipId !== deleteTeamId));
      setDeleteTeamConfirmVisible(false);
      setDeleteTeamId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorTeamDelete"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDayList = (date: Date, appts: Appointment[]) => {
    setDayListDate(date);
    setDayListAppointments(appts);
    setDayListVisible(true);
  };

  const value: ScheduleContextValue = {
    loading,
    teams,
    appointments,
    customers,
    companyUsers,
    events,
    filteredAppointments,
    containerWidth,
    setContainerWidth,
    mode,
    setMode,
    calendarDate,
    setCalendarDate,
    selectedTeamFilter,
    setSelectedTeamFilter,
    planFilter,
    setPlanFilter,
    listTeamFilter,
    setListTeamFilter,
    serviceTypes,
    durationOptions,
    alert,
    setAlertVisible: (v: boolean) => setAlert((prev) => ({ ...prev, visible: v })),
    teamModalVisible,
    openTeamModal: () => setTeamModalVisible(true),
    closeTeamModal: () => setTeamModalVisible(false),
    addTeam,
    teamFilterTarget,
    showTeamFilter: (target) => setTeamFilterTarget(target),
    closeTeamFilter: () => setTeamFilterTarget(null),
    openNewAppointment,
    appointmentModalVisible,
    closeAppointmentModal,
    saveAppointment,
    requestDeleteEditing,
    editingAppointmentId,
    selectedDate,
    setSelectedDate,
    dateInputText,
    setDateInputText,
    selectedCustomer,
    setSelectedCustomer,
    customerSearch,
    setCustomerSearch,
    timeInput,
    setTimeInput,
    selectedDuration,
    setSelectedDuration,
    selectedTeamId,
    setSelectedTeamId,
    selectedService,
    setSelectedService,
    notlar,
    setNotlar,
    appointmentSaving,
    customerSelectVisible,
    openCustomerSelect: () => setCustomerSelectVisible(true),
    closeCustomerSelect: () => setCustomerSelectVisible(false),
    serviceSelectVisible,
    openServiceSelect: () => setServiceSelectVisible(true),
    closeServiceSelect: () => setServiceSelectVisible(false),
    detailVisible,
    detailAppointment,
    closeDetail: () => setDetailVisible(false),
    openDetail,
    editDetail,
    requestDeleteDetail,
    openDetailFromEvent,
    addMemberVisible,
    addMemberTeamId,
    openAddMember: (teamId) => {
      setAddMemberTeamId(teamId);
      setAddMemberVisible(true);
    },
    closeAddMember: () => {
      setAddMemberVisible(false);
      setAddMemberTeamId(null);
    },
    addMember,
    removeMembersVisible,
    removeTeamId,
    openRemoveMembers: (teamId) => {
      setRemoveTeamId(teamId);
      setRemoveMembersVisible(true);
    },
    closeRemoveMembers: () => {
      setRemoveMembersVisible(false);
      setRemoveTeamId(null);
    },
    removeMembers,
    requestDeleteTeam,
    deleteTeamConfirmVisible,
    closeDeleteTeamConfirm: () => {
      setDeleteTeamConfirmVisible(false);
      setDeleteTeamId(null);
    },
    confirmDeleteTeam,
    appointmentDeleteConfirmVisible,
    closeAppointmentDeleteConfirm: () => {
      setAppointmentDeleteConfirmVisible(false);
      setAppointmentDeleteId(null);
    },
    confirmDeleteAppointment,
    deleteLoading,
    addLoading,
    removeLoading,
    dayListVisible,
    dayListDate,
    dayListAppointments,
    closeDayList: () => setDayListVisible(false),
    openDayList,
    addPlanFromDayList: () => {
      setDayListVisible(false);
      openNewAppointment(dayListDate);
    },
    handleDragEnd,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}
