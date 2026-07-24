import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, type ICalendarEventBase, type Mode } from "react-native-big-calendar";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { teamApi, type Team, type CompanyUser } from "../../api/teams";
import { appointmentApi, type Appointment } from "../../api/appointments";
import { customerApi, type Customer } from "../../api/customers";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import CustomAlert from "../../components/CustomAlert";

const CELL_HEIGHT = Math.max(500 - 30, 1200) / 24;

function DraggableEventCard({
  event,
  touchableOpacityProps,
  cellHeight,
  containerWidth,
  mode,
  originalAppointment,
  onDragEnd,
  onPressEvent,
}: {
  event: ScheduleEvent;
  touchableOpacityProps: any;
  cellHeight: number;
  containerWidth: number;
  mode: string;
  originalAppointment: Appointment | undefined;
  onDragEnd: (eventId: number, newStartTime: string, newDate: string) => void;
  onPressEvent: (event: ScheduleEvent) => void;
}) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: isDragging.value ? 100 : 1,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      isDragging.value = false;
      const minuteDelta = Math.round((translateY.value / cellHeight) * 60 / 15) * 15;

      let dayDelta = 0;
      if (mode === "week" && containerWidth > 0) {
        const dayWidth = containerWidth / 7;
        dayDelta = Math.round(translateX.value / dayWidth);
      }

      if (originalAppointment && (minuteDelta !== 0 || dayDelta !== 0)) {
        const [oh, om] = originalAppointment.startTime.split(":").map(Number);
        const totalMinutes = oh * 60 + om + minuteDelta;
        const clamped = Math.max(8 * 60, Math.min(23 * 60, totalMinutes));
        const newH = String(Math.floor(clamped / 60)).padStart(2, "0");
        const newM = String(clamped % 60).padStart(2, "0");
        const newTime = `${newH}:${newM}`;

        const origDate = new Date(originalAppointment.tarih + "T00:00:00");
        origDate.setDate(origDate.getDate() + dayDelta);
        const y = origDate.getFullYear();
        const mo = String(origDate.getMonth() + 1).padStart(2, "0");
        const d = String(origDate.getDate()).padStart(2, "0");
        const newDate = `${y}-${mo}-${d}`;

        onDragEnd(originalAppointment.id, newTime, newDate);
      }

      translateX.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    });

  const tapGesture = Gesture.Tap().maxDuration(250).onEnd(() => {
    onPressEvent(event);
  });

  const composed = Gesture.Race(panGesture, tapGesture);
  const { key, style: touchableStyle } = touchableOpacityProps;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        key={key}
        style={[
          touchableStyle,
          animStyle,
          { backgroundColor: `${event.renk}20`, borderLeftWidth: 3, borderLeftColor: event.renk, borderRadius: 6 },
        ]}
      >
        <View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', lineHeight: 13 }} numberOfLines={1}>{event.title}</Text>
            {event.ekipAdi ? (
              <View style={{ backgroundColor: event.renk, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 0, marginTop: 1, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700', lineHeight: 10 }} numberOfLines={1}>{event.ekipAdi}</Text>
              </View>
            ) : null}
            {event.notlar ? (
              <Text style={{ color: '#ccc', fontSize: 8, lineHeight: 10, marginTop: 1 }} numberOfLines={2}>{event.notlar}</Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}



interface ScheduleEvent extends ICalendarEventBase {
  renk: string;
  ekipAdi?: string;
  eventId?: number;
  notlar?: string;
}

const durationToMs = (duration: string): number => {
  const map: Record<string, number> = {
    "30dk": 30 * 60 * 1000,
    "1saat": 60 * 60 * 1000,
    "1.5saat": 90 * 60 * 1000,
    "2saat": 120 * 60 * 1000,
  };
  return map[duration] || 60 * 60 * 1000;
};

const parseSaat = (s: string): { h: number; m: number } => {
  const [h, m] = s.split(":").map(Number);
  return { h, m: m || 0 };
};


const dateToStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const strToDate = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const TEAM_COLORS = ["#6080FF", "#10B981", "#F59E0B", "#EF4444", "#8060FF", "#EC4899"];

function TrWeekHeader({ dateRange }: any) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  return (
    <View className="flex-row border-b" style={{ borderColor: colors.border }}>
      {dateRange.map((date: any, i: number) => {
        const bugun = new Date();
        const isToday = date.date() === bugun.getDate() && date.month() === bugun.getMonth();
        return (
          <View key={i} className="flex-1 items-center py-2">
            <Text className="text-xs mb-1" style={{ color: isToday ? colors.primary : colors.textSecondary }}>
              {[t("dayShort.sun"), t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat")][date.day()]}
            </Text>
            <View className={`h-7 w-7 rounded-full items-center justify-center ${isToday ? "" : ""}`} style={isToday ? { backgroundColor: colors.primary } : {}}>
              <Text className="text-sm font-semibold" style={{ color: "white" }}>
                {date.date()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TrMonthHeader() {
  return null;
}

export default function ScheduleScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, locale, lang, setLanguage } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const calendarLocale = {
    monthNames: [t("month.january"), t("month.february"), t("month.march"), t("month.april"), t("month.may"), t("month.june"), t("month.july"), t("month.august"), t("month.september"), t("month.october"), t("month.november"), t("month.december")],
    monthNamesShort: [t("month.january").substring(0, 3), t("month.february").substring(0, 3), t("month.march").substring(0, 3), t("month.april").substring(0, 3), t("month.may").substring(0, 3), t("month.june").substring(0, 3), t("month.july").substring(0, 3), t("month.august").substring(0, 3), t("month.september").substring(0, 3), t("month.october").substring(0, 3), t("month.november").substring(0, 3), t("month.december").substring(0, 3)],
    dayNames: [t("day.monday"), t("day.tuesday"), t("day.wednesday"), t("day.thursday"), t("day.friday"), t("day.saturday"), t("day.sunday")],
    dayNamesShort: [t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat"), t("dayShort.sun")],
    today: t("dash.today"),
  };
  const durationOptions = [
    { label: t("dur.30min"), value: "30dk" },
    { label: t("dur.1hour"), value: "1saat" },
    { label: t("dur.1.5hour"), value: "1.5saat" },
    { label: t("dur.2hour"), value: "2saat" },
  ];
  const [mode, setMode] = useState<Mode>("day");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(t("sch.allTeams"));
  const [planFilter, setPlanFilter] = useState<"gun" | "hafta" | "ay" | "tum">("gun");
  const [listTeamFilter, setListTeamFilter] = useState(t("sch.allTeams"));
  const [listTeamDropdownOpen, setListTeamDropdownOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<{ id: string; companyName: string; contactPerson: string }[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [ekipModal, setEkipModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLeader, setNewTeamLeader] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [leaderDropdownOpen, setLeaderDropdownOpen] = useState(false);
  const [memberSelectOpen, setMemberSelectOpen] = useState(false);

  const [appointmentModal, setAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateInputText, setDateInputText] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; companyName: string; contactPerson: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const serviceTypes = [
    t("sch.serviceTypes.alarm"), t("sch.serviceTypes.fire"), t("sch.serviceTypes.cctv"), t("sch.serviceTypes.assembly"),
    t("sch.serviceTypes.wiring"), t("sch.serviceTypes.commissioning"), t("sch.serviceTypes.maintenance"), t("sch.serviceTypes.repair"),
  ];
  const [selectedService, setSelectedService] = useState("Alarm");

  const [timeInput, setTimeInput] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState("1saat");
  const [selectedTeamId, setSelectedTeamId] = useState<number>(0);
  const [notlar, setNotlar] = useState("");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [memberAddTeamId, setMemberAddTeamId] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRemoveModal, setMemberRemoveModal] = useState(false);
  const [removeTeamId, setRemoveTeamId] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [appointmentDeleteModal, setAppointmentDeleteModal] = useState(false);
  const [appointmentDeleteId, setAppointmentDeleteId] = useState<number | null>(null);
  const [appointmentSaving, setAppointmentSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(350);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm">("error");

  const showAlert = (type: "success" | "error" | "confirm", title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const [detailModal, setDetailModal] = useState(false);
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  const [dayListModal, setDayListModal] = useState(false);
  const [dayListDate, setDayListDate] = useState<Date>(new Date());
  const [dayListAppointments, setDayListAppointments] = useState<Appointment[]>([]);

  const now = new Date();
  const scrollOffset = now.getHours() * 60 + now.getMinutes() - 30;

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
  }, []);

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

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !newTeamLeader.trim()) {
      showAlert("error", t("common.warning"), t("sch.errorTeamRequired"));
      return;
    }
    try {
      setAddLoading(true);
      const color = TEAM_COLORS[teams.length % TEAM_COLORS.length];
      const res = await teamApi.create({
        name: newTeamName.trim(),
        leader: newTeamLeader.trim(),
        color,
        members: newTeamMembers,
      });
      setTeams((prev) => [...prev, res.data]);
      setNewTeamName("");
      setNewTeamLeader("");
      setNewTeamMembers([]);
      setEkipModal(false);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorTeamAdd"));
    } finally {
      setAddLoading(false);
    }
  };

  const handlePersonelEkleAc = (teamId: number) => {
    setMemberAddTeamId(teamId);
    setMemberSearch("");
    setMemberModal(true);
  };

  const handlePersonelEkle = async (userName: string) => {
    if (userName.trim() && memberAddTeamId !== null) {
      try {
        setAddLoading(true);
        const res = await teamApi.addMember(memberAddTeamId, userName.trim());
        setTeams((prev) => prev.map((t) => t.id === memberAddTeamId ? res.data : t));
        setMemberSearch("");
      } catch (error: any) {
        showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorPersonnelAdd"));
      } finally {
        setAddLoading(false);
      }
    }
  };

  const handleTeamDelete = (teamId: number) => {
    setDeleteTeamId(teamId);
    setDeleteConfirmModal(true);
  };

  const confirmDeleteTeam = async () => {
    if (deleteTeamId === null) return;
    try {
      setDeleteLoading(true);
      await teamApi.delete(deleteTeamId);
      setTeams((prev) => prev.filter((t) => t.id !== deleteTeamId));
      setAppointments((prev) => prev.filter((a) => a.ekipId !== deleteTeamId));
      setDeleteConfirmModal(false);
      setDeleteTeamId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorTeamDelete"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePersonelCikarAc = (teamId: number) => {
    setRemoveTeamId(teamId);
    setSelectedMembers([]);
    setMemberRemoveModal(true);
  };

  const togglePersonelSec = (personel: string) => {
    setSelectedMembers((prev) =>
      prev.includes(personel) ? prev.filter((p) => p !== personel) : [...prev, personel]
    );
  };

  const handleSelectedRemove = async () => {
    if (selectedMembers.length === 0) {
      showAlert("error", t("common.warning"), t("sch.errorSelectPersonnel"));
      return;
    }
    const teamId = removeTeamId;
    if (teamId === null) return;

    try {
      setRemoveLoading(true);
      const res = await teamApi.removeMembers(teamId, [...selectedMembers]);
      setTeams((prev) => prev.map((t) => t.id === teamId ? res.data : t));
      setMemberRemoveModal(false);
      setSelectedMembers([]);
      setRemoveTeamId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorPersonnelRemove"));
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleCellPress = (date: Date) => {
    setSelectedDate(date);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    setDateInputText(`${dd}/${mm}/${yyyy}`);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setTimeInput("09:00");
    setSelectedDuration("1saat");
    setSelectedService(serviceTypes[0] || "Alarm");
    setSelectedTeamId(teams[0]?.id || 0);
    setNotlar("");
    setEditingAppointmentId(null);
    setAppointmentModal(true);
  };

  const handleEventPress = (event: ScheduleEvent) => {
    const atama = appointments.find(
      (a) => event.title.startsWith(`${a.customerName} - ${a.tur}`)
    );
    if (atama) {
      setDetailAppointment(atama);
      setDetailModal(true);
    }
  };

  const handleDetailEdit = () => {
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
    setDetailModal(false);
    setAppointmentModal(true);
  };

  const handleAppointmentSave = async () => {
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
      setAppointmentModal(false);
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

  const handleAppointmentDeleteRequest = (id: number) => {
    setAppointmentDeleteId(id);
    setAppointmentDeleteModal(true);
  };

  const handleAppointmentDelete = async () => {
    if (appointmentDeleteId === null) return;
    try {
      setDeleteLoading(true);
      await appointmentApi.delete(appointmentDeleteId);
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentDeleteId));
      setAppointmentDeleteModal(false);
      setAppointmentDeleteId(null);
      setAppointmentModal(false);
      setEditingAppointmentId(null);
    } catch (error: any) {
      showAlert("error", t("common.error"), error.response?.data?.message || t("sch.errorSave"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetAppointmentModal = () => {
    setAppointmentModal(false);
    setEditingAppointmentId(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t("sch.loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
              {t("sch.title")}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setLanguage(lang === "tr" ? "en" : "tr")} style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{lang === "tr" ? "EN" : "TR"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
              <Ionicons name="home-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-sm mb-5" style={{ color: colors.textMuted }}>
          {t("sch.subtitle")}
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-4 items-center">
          {(["day", "week", "month"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              className={`px-4 h-8 rounded-lg items-center justify-center ${
                mode === m ? "" : "border"
              }`}
              style={{
                backgroundColor: mode === m ? colors.primary : colors.bgCard,
                borderColor: mode === m ? undefined : colors.border,
              }}
              onPress={() => setMode(m)}
            >
              <Text className="text-xs font-medium" style={{ color: mode === m ? "white" : colors.textSecondary }}>
                {m === "day" ? t("sch.day") : m === "week" ? t("sch.week") : t("sch.month")}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="flex-row items-center h-8 px-3 border rounded-lg"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            onPress={() => setTeamDropdownOpen(true)}
          >
            <Text className="text-xs mr-2" style={{ color: colors.text }}>
              {selectedTeamFilter === t("sch.allTeams") ? t("sch.allTeams") : selectedTeamFilter}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            className="h-8 w-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.bgInput }}
            onPress={() => setSelectedTeamFilter(t("sch.allTeams"))}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center h-8 px-3 rounded-lg ml-auto"
            style={{ backgroundColor: colors.primary }}
            onPress={() => {
              const d = new Date();
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
              setAppointmentModal(true);
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-xs font-medium ml-1" style={{ color: "white" }}>{t("sch.newPlan")}</Text>
          </TouchableOpacity>
        </View>

        <View className="rounded-2xl border p-3 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center flex-row"
              style={{ backgroundColor: colors.bgInput }}
              onPress={() => {
                const d = new Date(calendarDate);
                d.setDate(d.getDate() - (mode === "week" ? 7 : mode === "month" ? 30 : 1));
                setCalendarDate(d);
              }}
            >
              <Ionicons name="chevron-back" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-4 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={() => setCalendarDate(new Date())}
            >
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                {(() => {
                  const d = new Date(calendarDate);
                  const dd = String(d.getDate()).padStart(2, "0");
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const yyyy = d.getFullYear();
                  if (mode === "day") return `${dd}/${mm}/${yyyy}`;
                  if (mode === "week") {
                    const weekStart = new Date(d);
                    weekStart.setDate(d.getDate() - d.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const ws = String(weekStart.getDate()).padStart(2, "0");
                    const wsm = String(weekStart.getMonth() + 1).padStart(2, "0");
                    const wsy = weekStart.getFullYear();
                    const we = String(weekEnd.getDate()).padStart(2, "0");
                    const wem = String(weekEnd.getMonth() + 1).padStart(2, "0");
                    const wey = weekEnd.getFullYear();
                    return `${ws}/${wsm}/${wsy} - ${we}/${wem}/${wey}`;
                  }
                  const aylar = [t("month.january"), t("month.february"), t("month.march"), t("month.april"), t("month.may"), t("month.june"), t("month.july"), t("month.august"), t("month.september"), t("month.october"), t("month.november"), t("month.december")];
                  return `${aylar[d.getMonth()]} ${yyyy}`;
                })()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-3 rounded-lg items-center justify-center flex-row"
              style={{ backgroundColor: colors.bgInput }}
              onPress={() => {
                const d = new Date(calendarDate);
                d.setDate(d.getDate() + (mode === "week" ? 7 : mode === "month" ? 30 : 1));
                setCalendarDate(d);
              }}
            >
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="rounded-2xl border overflow-hidden mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          {mode === "month" ? (() => {
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startOffset = firstDay === 0 ? 6 : firstDay - 1;
            const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
            const today = new Date();
            const gunKisa = [t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat"), t("dayShort.sun")];
            const cells: { day: number | null; date: Date | null }[] = [];
            for (let i = 0; i < totalCells; i++) {
              const dayNum = i - startOffset + 1;
              if (dayNum < 1 || dayNum > daysInMonth) {
                cells.push({ day: null, date: null });
              } else {
                cells.push({ day: dayNum, date: new Date(year, month, dayNum) });
              }
            }
            return (
              <View>
                <View className="flex-row border-b" style={{ borderColor: colors.border }}>
                  {gunKisa.map((g, i) => (
                    <View key={i} className="flex-1 items-center py-2">
                      <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>{g}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row flex-wrap">
                  {cells.map((cell, i) => {
                    const isToday = cell.date && cell.date.getDate() === today.getDate() && cell.date.getMonth() === today.getMonth() && cell.date.getFullYear() === today.getFullYear();
                    const dayEvents = cell.date ? events.filter((e) => e.start.getDate() === cell.date!.getDate() && e.start.getMonth() === cell.date!.getMonth() && e.start.getFullYear() === cell.date!.getFullYear()) : [];
                    return (
                      <TouchableOpacity
                        key={i}
                        style={{
                          width: `${100 / 7}%`,
                          minHeight: 80,
                          borderWidth: 0.5,
                          borderColor: colors.border + '40',
                          backgroundColor: isToday ? colors.primary + '15' : 'transparent',
                          padding: 4,
                        }}
                        onPress={() => {
                          if (!cell.date) return;
                          const dateStr = dateToStr(cell.date);
                          const dayAppts = appointments.filter((a) => a.tarih === dateStr);
                          setDayListDate(cell.date);
                          setDayListAppointments(dayAppts);
                          setDayListModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        {cell.day !== null && (
                          <Text
                            style={{
                              color: isToday ? colors.primary : colors.textSecondary,
                              fontSize: 11,
                              fontWeight: isToday ? '700' : '500',
                              marginBottom: 2,
                            }}
                          >
                            {cell.day}
                          </Text>
                        )}
                        {dayEvents.slice(0, 3).map((ev, j) => (
                          <TouchableOpacity
                            key={j}
                            style={{
                              backgroundColor: `${ev.renk}25`,
                              borderLeftWidth: 2,
                              borderLeftColor: ev.renk,
                              borderRadius: 3,
                              paddingHorizontal: 3,
                              paddingVertical: 1,
                              marginBottom: 2,
                            }}
                            onPress={() => handleEventPress(ev)}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: colors.text, fontSize: 9, fontWeight: '600', lineHeight: 12 }} numberOfLines={1}>{ev.title}</Text>
                            {ev.notlar ? (
                              <Text style={{ color: colors.textSecondary, fontSize: 7, lineHeight: 10 }} numberOfLines={1}>{ev.notlar}</Text>
                            ) : null}
                          </TouchableOpacity>
                        ))}
                        {dayEvents.length > 3 && (
                          <Text style={{ color: colors.primary, fontSize: 8, fontWeight: '600' }}>+{dayEvents.length - 3} {t("sch.more")}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })() : (
          <Calendar
            date={calendarDate}
            mode={mode}
            events={events}
            height={500}
            swipeEnabled={false}
            scrollOffsetMinutes={scrollOffset}
            onPressCell={handleCellPress}
            onPressEvent={handleEventPress}
            renderHeader={TrWeekHeader}
            locale={calendarLocale as any}
            eventCellStyle={(event: ScheduleEvent) => ({
              backgroundColor: `${event.renk}20`,
              borderLeftWidth: 3,
              borderLeftColor: event.renk,
              borderRadius: 6,
            })}
            renderEvent={(event: ScheduleEvent, touchableOpacityProps: any) => {
              const originalAppointment = appointments.find((a) => a.id === event.eventId);
              return (
                <DraggableEventCard
                  event={event}
                  touchableOpacityProps={touchableOpacityProps}
                  cellHeight={CELL_HEIGHT}
                  containerWidth={containerWidth}
                  mode={mode}
                  originalAppointment={originalAppointment}
                  onDragEnd={handleDragEnd}
                  onPressEvent={handleEventPress}
                />
              );
            }}
            theme={{
              palette: {
                primary: { main: colors.primary, contrastText: "#fff" },
                nowIndicator: colors.primary,
                gray: { 100: "#f5f5f5", 200: colors.border, 300: colors.textSecondary, 500: colors.textMuted, 800: colors.bgCard },
                moreLabel: colors.primary,
              },
              typography: {
                xs: { fontSize: 11 },
                sm: { fontSize: 13 },
                xl: { fontSize: 16, fontWeight: "600" },
                moreLabel: { fontSize: 12 },
              },
            }}
          />
          )}
        </View>

        <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="list" size={18} color={colors.primary} />
              <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("sch.planList")}</Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{filteredAppointments.length}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-3 items-center">
            {(["gun", "hafta", "ay", "tum"] as const).map((f) => {
              const labels: Record<string, string> = { gun: t("sch.day"), hafta: t("sch.week"), ay: t("sch.month"), tum: t("sch.allTeams") };
              return (
                <TouchableOpacity
                  key={f}
                  className={`px-3 h-7 rounded-lg items-center justify-center ${planFilter !== f ? "border" : ""}`}
                  style={{
                    backgroundColor: planFilter === f ? colors.primary : colors.bgCard,
                    borderColor: planFilter === f ? undefined : colors.border,
                  }}
                  onPress={() => setPlanFilter(f)}
                >
                  <Text className="text-xs font-medium" style={{ color: planFilter === f ? "white" : colors.textSecondary }}>
                    {labels[f]}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              className="flex-row items-center h-7 px-2.5 border rounded-lg"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
              onPress={() => setListTeamDropdownOpen(true)}
            >
              <Text className="text-xs mr-1.5" style={{ color: colors.text }}>
                {listTeamFilter === t("sch.allTeams") ? t("sch.allTeams") : listTeamFilter}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </TouchableOpacity>

            {(planFilter !== "gun" || listTeamFilter !== t("sch.allTeams")) && (
              <TouchableOpacity
                className="h-7 w-7 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.danger + '15' }}
                onPress={() => {
                  setPlanFilter("gun");
                  setListTeamFilter(t("sch.allTeams"));
                }}
              >
                <Ionicons name="close" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>

          {(() => {
            const d = new Date(calendarDate);
            const todayStr = dateToStr(new Date());

            const dayStart = new Date(d);
            const dayEnd = new Date(d);
            const dayStartStr = dateToStr(dayStart);
            const dayEndStr = dateToStr(dayEnd);

            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const weekStartStr = dateToStr(weekStart);
            const weekEndStr = dateToStr(weekEnd);

            const monthStartStr = dateToStr(new Date(d.getFullYear(), d.getMonth(), 1));
            const monthEndStr = dateToStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));

            const listFilteredAppointments = listTeamFilter === t("sch.allTeams")
              ? filteredAppointments
              : filteredAppointments.filter((a) => a.ekip === listTeamFilter);

            const sorted = [...listFilteredAppointments].sort((a, b) => {
              if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih);
              return a.startTime.localeCompare(b.startTime);
            });

            const filtered = sorted.filter((a) => {
              if (planFilter === "gun") return a.tarih === dayStartStr;
              if (planFilter === "hafta") return a.tarih >= weekStartStr && a.tarih <= weekEndStr;
              if (planFilter === "ay") return a.tarih >= monthStartStr && a.tarih <= monthEndStr;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <View className="py-8 items-center">
                  <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
                  <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>
                    {planFilter === "gun" ? t("sch.noPlanToday") : planFilter === "hafta" ? t("sch.noPlanWeek") : planFilter === "ay" ? t("sch.noPlanMonth") : t("sch.noPlanFound")}
                  </Text>
                </View>
              );
            }

            let lastDate = "";
            return (
              <ScrollView className="max-h-[400px]" nestedScrollEnabled indicatorStyle={colors.indicatorBg}>
                {filtered.map((a) => {
                  const team = teams.find((t) => t.id === a.ekipId);
                  const gunler = [t("dayShort.sun"), t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat")];
                  const d = strToDate(a.tarih);
                  const dateLabel = `${gunler[d.getDay()]} ${a.tarih}`;
                  const showDateHeader = a.tarih !== lastDate;
                  if (showDateHeader) lastDate = a.tarih;
                  return (
                    <View key={a.id}>
                      {showDateHeader && (
                        <View className="flex-row items-center gap-2 mt-2 mb-1.5">
                          <Ionicons name="calendar" size={13} color={colors.primary} />
                          <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{dateLabel}</Text>
                          <View className="flex-1 h-px" style={{ backgroundColor: colors.border }} />
                        </View>
                      )}
                      <TouchableOpacity
                        className="rounded-xl p-3 mb-1.5 flex-row items-center gap-3"
                        style={{
                          backgroundColor: `${team?.color || "#6080FF"}10`,
                          borderLeftWidth: 3,
                          borderLeftColor: team?.color || "#6080FF",
                          opacity: a.tarih < todayStr ? 0.5 : 1,
                        }}
                        onPress={() => {
                          setDetailAppointment(a);
                          setDetailModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View className="items-center" style={{ minWidth: 45 }}>
                          <Text className="text-sm font-bold" style={{ color: colors.text }}>{a.startTime}</Text>
                          <Text className="text-[10px]" style={{ color: colors.textMuted }}>{a.duration}</Text>
                        </View>
                        <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: colors.text }} numberOfLines={1}>{a.customerName}</Text>
                          <View className="flex-row items-center gap-1.5 mt-0.5">
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: team?.color || "#6080FF" }} />
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.ekip}</Text>
                            <Text className="text-xs" style={{ color: colors.textMuted }}>•</Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.tur}</Text>
                          </View>
                        </View>
                        {a.tarih < todayStr ? (
                          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.textMuted + '30' }}>
                            <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>{t("sch.past")}</Text>
                          </View>
                        ) : a.tarih === todayStr ? (
                          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.primary + '20' }}>
                            <Text className="text-[10px] font-medium" style={{ color: colors.primary }}>{t("dash.today")}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            );
          })()}
        </View>

        <View className="rounded-2xl border p-4 mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-base" style={{ color: colors.text }}>{t("sch.teams")}</Text>
            {isAdmin && (
            <TouchableOpacity
              className="flex-row items-center h-8 px-3 rounded-lg"
              style={{ backgroundColor: colors.primary + '15' }}
              onPress={() => {
                setNewTeamName("");
                setNewTeamLeader("");
                setNewTeamMembers([]);
                setEkipModal(true);
              }}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text className="text-xs font-medium ml-1" style={{ color: colors.primary }}>{t("sch.newTeam")}</Text>
            </TouchableOpacity>
            )}
          </View>

          <View className="flex-row flex-wrap gap-3">
            {teams.map((team) => (
              <View
                key={team.id}
                className="w-[48%] md:w-[32%] lg:w-[24%] rounded-2xl p-4 h-64"
                style={{ backgroundColor: colors.bgCard }}
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${team.color}20` }}
                  >
                    <Ionicons name="people" size={20} color={team.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: colors.text }}>{team.name}</Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.leader")} {team.leader}</Text>
                  </View>
                  {isAdmin && (
                  <TouchableOpacity onPress={() => handleTeamDelete(team.id)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                  )}
                </View>
                <ScrollView className="flex-1 mb-2" indicatorStyle={colors.indicatorBg} nestedScrollEnabled>
                  <View className="mb-3">
                    <Text className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>{t("sch.personnelCount")} ({team.members.length + 1})</Text>
                    <View className="flex-row items-center py-1 border-b" style={{ borderColor: colors.border + '4D' }}>
                      <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: team.color }}>
                        <Text className="text-white text-[10px] font-bold">{team.leader.charAt(0)}</Text>
                      </View>
                      <Text className="text-xs font-medium mr-1" style={{ color: colors.warning }}>{team.leader}</Text>
                      <Text className="text-xs" style={{ color: colors.warning }}>👑</Text>
                    </View>
                    {team.members.map((personel, idx) => (
                      <View key={idx} className="flex-row items-center py-1 border-b" style={{ borderColor: colors.border + '4D' }}>
                        <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                          <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>
                            {personel.charAt(0)}
                          </Text>
                        </View>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>{personel}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderColor: colors.border }}>
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {appointments.filter((a) => a.ekipId === team.id).length} {t("sch.assignments")}
                  </Text>
                {isAdmin && (
                <View className="flex-row gap-1">
                    <TouchableOpacity
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: colors.warning + '15' }}
                      onPress={() => handlePersonelCikarAc(team.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-remove-outline" size={16} color={colors.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: colors.primary + '15' }}
                      onPress={() => handlePersonelEkleAc(team.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-add-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Modal visible={ekipModal} transparent animationType="fade" onRequestClose={() => setEkipModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.newTeam")}</Text>
                <TouchableOpacity onPress={() => setEkipModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.teamName")}</Text>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("sch.teamName")}
                placeholderTextColor={colors.textMuted}
                value={newTeamName}
                onChangeText={setNewTeamName}
              />
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.teamLeader")}</Text>
              <TouchableOpacity
                className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                onPress={() => setLeaderDropdownOpen(!leaderDropdownOpen)}
              >
                <Text className="text-sm" style={{ color: newTeamLeader ? colors.text : colors.textMuted }}>
                  {newTeamLeader || t("sch.selectLeader")}
                </Text>
                <Ionicons name={leaderDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {leaderDropdownOpen && (
                <View className="border rounded-lg mb-3 max-h-40 overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                  <ScrollView nestedScrollEnabled bounces={false}>
                    {companyUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        className={`px-3 py-2.5 border-b flex-row items-center`}
                        style={{ borderColor: colors.border, backgroundColor: newTeamLeader === user.name ? colors.primary + '15' : 'transparent' }}
                        onPress={() => {
                          setNewTeamLeader(user.name);
                          setLeaderDropdownOpen(false);
                        }}
                      >
                        <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.primary }}>
                          <Text className="text-white text-[10px] font-bold">{user.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm" style={{ color: newTeamLeader === user.name ? colors.primary : colors.text, fontWeight: newTeamLeader === user.name ? '600' : '400' }}>
                            {user.name}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
                        </View>
                        {newTeamLeader === user.name && (
                          <Ionicons name="checkmark" size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.personnel")}</Text>
              <TouchableOpacity
                className="w-full h-10 border rounded-lg px-3 flex-row items-center justify-between mb-1"
                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                onPress={() => setMemberSelectOpen(!memberSelectOpen)}
              >
                <Text className="text-sm flex-1" style={{ color: newTeamMembers.length > 0 ? colors.text : colors.textMuted }}>
                  {newTeamMembers.length > 0
                    ? `${newTeamMembers.length} ${t("sch.personnelSelected")}`
                    : t("sch.selectPersonnel")}
                </Text>
                <Ionicons name={memberSelectOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {newTeamMembers.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {newTeamMembers.map((name) => (
                    <View key={name} className="flex-row items-center border rounded-lg px-2 py-1" style={{ backgroundColor: colors.primary + '33', borderColor: colors.primary + '66' }}>
                      <Text className="text-xs mr-1" style={{ color: colors.primary }}>{name}</Text>
                      <TouchableOpacity onPress={() => setNewTeamMembers((prev) => prev.filter((n) => n !== name))}>
                        <Ionicons name="close" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {memberSelectOpen && (
                <View className="border rounded-lg mb-3 max-h-40 overflow-hidden" style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
                  <ScrollView nestedScrollEnabled bounces={false}>
                    {companyUsers
                      .filter((u) => u.name !== newTeamLeader)
                      .map((user) => {
                        const isSelected = newTeamMembers.includes(user.name);
                        return (
                          <TouchableOpacity
                            key={user.id}
                            className={`px-3 py-2.5 border-b flex-row items-center`}
                            style={{ borderColor: colors.border, backgroundColor: isSelected ? colors.primary + '15' : 'transparent' }}
                            onPress={() => {
                              setNewTeamMembers((prev) =>
                                isSelected ? prev.filter((n) => n !== user.name) : [...prev, user.name]
                              );
                            }}
                          >
                            <View className={`w-5 h-5 rounded border items-center justify-center mr-2`} style={{ backgroundColor: isSelected ? colors.primary : 'transparent', borderColor: isSelected ? colors.primary : colors.textMuted }}>
                              {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: colors.bgInput }}>
                              <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{user.name.charAt(0)}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-sm" style={{ color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '600' : '400' }}>
                                {user.name}
                              </Text>
                              <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
              {!memberSelectOpen && <View className="mb-3" />}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => setEkipModal(false)}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleAddTeam}
                >
                  <Text className="font-medium" style={{ color: "white" }}>{t("sch.add")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={teamDropdownOpen} transparent animationType="fade" onRequestClose={() => setTeamDropdownOpen(false)}>
          <TouchableOpacity
            className="flex-1 justify-center items-center bg-black/40"
            activeOpacity={1}
            onPress={() => setTeamDropdownOpen(false)}
          >
            <View className="rounded-2xl w-64 max-h-60 overflow-hidden" style={{ backgroundColor: colors.bgCard }}>
              <ScrollView nestedScrollEnabled bounces={false}>
                <TouchableOpacity
                  className="px-4 py-3 border-b" style={{ borderColor: colors.border }}
                  onPress={() => {
                    setSelectedTeamFilter(t("sch.allTeams"));
                    setTeamDropdownOpen(false);
                  }}
                >
                  <Text className="text-sm" style={{ color: selectedTeamFilter === t("sch.allTeams") ? colors.primary : colors.text, fontWeight: selectedTeamFilter === t("sch.allTeams") ? '600' : '400' }}>
                    {t("sch.allTeams")}
                  </Text>
                </TouchableOpacity>
                {teams.map((tm) => (
                  <TouchableOpacity
                    key={tm.id}
                    className="px-4 py-3 border-b flex-row items-center" style={{ borderColor: colors.border }}
                    onPress={() => {
                      setSelectedTeamFilter(tm.name);
                      setTeamDropdownOpen(false);
                    }}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{ backgroundColor: tm.color }}
                    />
                    <Text className="text-sm" style={{ color: selectedTeamFilter === tm.name ? colors.primary : colors.text, fontWeight: selectedTeamFilter === tm.name ? '600' : '400' }}>
                      {tm.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={listTeamDropdownOpen} transparent animationType="fade" onRequestClose={() => setListTeamDropdownOpen(false)}>
          <TouchableOpacity
            className="flex-1 justify-center items-center bg-black/40"
            activeOpacity={1}
            onPress={() => setListTeamDropdownOpen(false)}
          >
            <View className="rounded-2xl w-64 max-h-60 overflow-hidden" style={{ backgroundColor: colors.bgCard }}>
              <ScrollView nestedScrollEnabled bounces={false}>
                <TouchableOpacity
                  className="px-4 py-3 border-b" style={{ borderColor: colors.border }}
                  onPress={() => {
                    setListTeamFilter(t("sch.allTeams"));
                    setListTeamDropdownOpen(false);
                  }}
                >
                  <Text className="text-sm" style={{ color: listTeamFilter === t("sch.allTeams") ? colors.primary : colors.text, fontWeight: listTeamFilter === t("sch.allTeams") ? '600' : '400' }}>
                    {t("sch.allTeams")}
                  </Text>
                </TouchableOpacity>
                {teams.map((tm) => (
                  <TouchableOpacity
                    key={tm.id}
                    className="px-4 py-3 border-b flex-row items-center" style={{ borderColor: colors.border }}
                    onPress={() => {
                      setListTeamFilter(tm.name);
                      setListTeamDropdownOpen(false);
                    }}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{ backgroundColor: tm.color }}
                    />
                    <Text className="text-sm" style={{ color: listTeamFilter === tm.name ? colors.primary : colors.text, fontWeight: listTeamFilter === tm.name ? '600' : '400' }}>
                      {tm.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={appointmentModal} transparent animationType="fade" onRequestClose={() => resetAppointmentModal()}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{editingAppointmentId ? t("sch.updateAppointment") : t("sch.newAppointment")}</Text>
                <TouchableOpacity onPress={() => resetAppointmentModal()}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.customer")}</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 relative z-10">
                    <TouchableOpacity
                      className="h-10 border rounded-lg px-3 flex-row items-center justify-between"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                      onPress={() => setCustomerDropdownOpen(true)}
                    >
                      <Text className="text-sm" style={{ color: colors.text }}>
                        {selectedCustomer ? selectedCustomer.companyName : t("sch.selectCustomer")}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <ScrollView className="max-h-[400px]" nestedScrollEnabled indicatorStyle={colors.indicatorBg}>
                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.date")}</Text>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      className="flex-1 h-10 border rounded-lg px-3 text-sm"
                      style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                      placeholder="GG/AA/YYYY"
                      placeholderTextColor={colors.textMuted}
                      value={dateInputText}
                      onChangeText={(text) => {
                        const digits = text.replace(/\D/g, "").slice(0, 8);
                        let formatted = digits;
                        if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
                        if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
                        setDateInputText(formatted);
                        const parts = formatted.split("/");
                        if (parts.length === 3 && parts[2].length === 4) {
                          const day = parseInt(parts[0], 10);
                          const month = parseInt(parts[1], 10) - 1;
                          const year = parseInt(parts[2], 10);
                          if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day >= 1 && day <= 31 && month >= 0 && month <= 11) {
                            const d = new Date(year, month, day);
                            if (d.getDate() === day && d.getMonth() === month) {
                              setSelectedDate(d);
                            }
                          }
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                    />
                    <TouchableOpacity
                      className="h-10 w-10 items-center justify-center"
                      onPress={() => {
                        const now = new Date();
                        const dd = String(now.getDate()).padStart(2, "0");
                        const mm = String(now.getMonth() + 1).padStart(2, "0");
                        const yyyy = now.getFullYear();
                        setDateInputText(`${dd}/${mm}/${yyyy}`);
                        setSelectedDate(now);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.time")}</Text>
                  <TextInput
                    className="w-full h-10 border rounded-lg px-3 text-sm"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.textMuted}
                    value={timeInput}
                    onChangeText={(text) => {
                      const digits = text.replace(/\D/g, "").slice(0, 4);
                      let formatted = digits;
                      if (digits.length > 2) formatted = digits.slice(0, 2) + ":" + digits.slice(2);
                      setTimeInput(formatted);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.duration")}</Text>
                  <View className="flex-row gap-1.5 flex-wrap">
                    {durationOptions.map((s) => (
                      <TouchableOpacity
                        key={s.value}
                        className={`px-3 h-8 rounded-lg items-center justify-center border`}
                        style={{
                          backgroundColor: selectedDuration === s.value ? colors.primary + '33' : colors.bg,
                          borderColor: selectedDuration === s.value ? colors.primary : colors.border,
                        }}
                        onPress={() => setSelectedDuration(s.value)}
                      >
                        <Text className="text-xs" style={{ color: selectedDuration === s.value ? colors.primary : colors.textSecondary }}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.selectTeam")}</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {teams.map((tm) => (
                      <TouchableOpacity
                        key={tm.id}
                        className={`flex-row items-center px-3 h-8 rounded-lg border`}
                        style={{
                          backgroundColor: selectedTeamId === tm.id ? colors.primary + '33' : colors.bg,
                          borderColor: selectedTeamId === tm.id ? colors.primary : colors.border,
                        }}
                        onPress={() => setSelectedTeamId(tm.id)}
                      >
                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: tm.color }} />
                        <Text className="text-xs" style={{ color: selectedTeamId === tm.id ? colors.primary : colors.textSecondary }}>
                          {tm.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.serviceType")}</Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1 relative z-10">
                      <TouchableOpacity
                        className="h-10 border rounded-lg px-3 flex-row items-center justify-between"
                        style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                        onPress={() => setServiceDropdownOpen(true)}
                      >
                        <Text className="text-sm" style={{ color: colors.text }}>{selectedService}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>{t("sch.notes")}</Text>
                  <TextInput
                    className="w-full h-20 border rounded-lg px-3 py-2 text-sm"
                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                    placeholder={t("sch.notesPlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={notlar}
                    onChangeText={setNotlar}
                  />
                </View>
              </ScrollView>

              <View className="flex-row gap-3 mt-4">
                {editingAppointmentId ? (
                  <TouchableOpacity
                    onPress={() => handleAppointmentDeleteRequest(editingAppointmentId)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                ) : null}
                <View className="flex-1" />
                <TouchableOpacity
                  className="h-10 px-4 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => resetAppointmentModal()}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`h-10 px-4 rounded-lg items-center justify-center`}
                  style={{ backgroundColor: appointmentSaving ? colors.primary + '80' : colors.primary }}
                  onPress={handleAppointmentSave}
                  disabled={appointmentSaving}
                >
                  {appointmentSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-medium" style={{ color: "white" }}>{editingAppointmentId ? t("sch.update") : t("sch.assign")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={customerDropdownOpen} transparent animationType="fade" onRequestClose={() => setCustomerDropdownOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/40">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.customer")}</Text>
                <TouchableOpacity onPress={() => setCustomerDropdownOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("sch.selectCustomer")}
                placeholderTextColor={colors.textMuted}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                autoFocus
              />
              <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {customers
                  .filter((m) =>
                    m.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    m.contactPerson?.toLowerCase().includes(customerSearch.toLowerCase())
                  )
                  .map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      className="px-3 py-2 border-b" style={{ borderColor: colors.border }}
                      onPress={() => {
                        setSelectedCustomer(m);
                        setCustomerDropdownOpen(false);
                        setCustomerSearch("");
                      }}
                    >
                      <Text className="text-sm" style={{ color: colors.text }}>{m.companyName}</Text>
                      <Text className="text-xs" style={{ color: colors.textMuted }}>{m.contactPerson}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              <View className="flex-row items-center gap-2 mt-3 border-t pt-3" style={{ borderColor: colors.border }}>
                <TextInput
                  className="flex-1 h-10 border rounded-lg px-3 text-sm"
                  style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                  placeholder={t("sch.tempCustomer")}
                  placeholderTextColor={colors.textMuted}
                  value={tempCustomerName}
                  onChangeText={setTempCustomerName}
                />
                <TouchableOpacity
                  className="h-10 px-4 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={() => {
                    if (tempCustomerName.trim()) {
                      const gecici = {
                        id: String(Date.now()),
                        companyName: tempCustomerName.trim(),
                        contactPerson: "-",
                      };
                      setSelectedCustomer(gecici);
                      setCustomerDropdownOpen(false);
                      setTempCustomerName("");
                    }
                  }}
                >
                  <Text className="text-sm font-medium" style={{ color: "white" }}>{t("sch.add")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={serviceDropdownOpen} transparent animationType="fade" onRequestClose={() => setServiceDropdownOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/40">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.serviceType")}</Text>
                <TouchableOpacity onPress={() => setServiceDropdownOpen(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {serviceTypes.map((h, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`px-3 py-3 border-b`} style={{ borderColor: colors.border, backgroundColor: selectedService === h ? colors.primary + '15' : 'transparent' }}
                    onPress={() => {
                      setSelectedService(h);
                      setServiceDropdownOpen(false);
                    }}
                  >
                    <Text className="text-sm" style={{ color: selectedService === h ? colors.primary : colors.text, fontWeight: selectedService === h ? '600' : '400' }}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={memberModal} transparent animationType="fade" onRequestClose={() => setMemberModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.addPersonnel")}</Text>
                <TouchableOpacity onPress={() => { setMemberModal(false); setMemberSearch(""); setMemberAddTeamId(null); }}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <TextInput
                className="w-full h-10 border rounded-lg px-3 text-sm mb-3"
                style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                placeholder={t("sch.searchPersonnel")}
                placeholderTextColor={colors.textMuted}
                value={memberSearch}
                onChangeText={setMemberSearch}
                autoFocus
              />
              <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {companyUsers
                  .filter((u) => {
                    const team = teams.find((t) => t.id === memberAddTeamId);
                    const alreadyMember = team?.members.includes(u.name) || team?.leader === u.name;
                    return !alreadyMember && (
                      u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(memberSearch.toLowerCase())
                    );
                  })
                  .length === 0 ? (
                    <View className="py-8 items-center">
                      <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                      <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>
                        {memberSearch ? t("sch.noResults") : t("sch.noPersonnelLeft")}
                      </Text>
                    </View>
                  ) : (
                  companyUsers
                    .filter((u) => {
                      const team = teams.find((t) => t.id === memberAddTeamId);
                      const alreadyMember = team?.members.includes(u.name) || team?.leader === u.name;
                      return !alreadyMember && (
                        u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(memberSearch.toLowerCase())
                      );
                    })
                    .map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        className="px-3 py-2.5 border-b flex-row items-center" style={{ borderColor: colors.border }}
                        onPress={() => handlePersonelEkle(user.name)}
                        activeOpacity={0.7}
                      >
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.primary }}>
                          <Text className="text-white text-xs font-bold">{user.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm" style={{ color: colors.text }}>{user.name}</Text>
                          <Text className="text-xs" style={{ color: colors.textMuted }}>{user.email}</Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                      </TouchableOpacity>
                    ))
                  )}
              </ScrollView>
              <View className="mt-3">
                <TouchableOpacity
                  className="w-full h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => { setMemberModal(false); setMemberSearch(""); setMemberAddTeamId(null); }}
                  activeOpacity={0.7}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("common.close")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={deleteConfirmModal} transparent animationType="fade" onRequestClose={() => !deleteLoading && setDeleteConfirmModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-5" style={{ backgroundColor: colors.bgCard }}>
              <View className="items-center mb-4">
                  <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.bgInput }}>
                    <Ionicons name="trash" size={28} color={colors.danger} />
                  </View>
                  <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>{t("sch.teamDelete")}</Text>
                <Text className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
                  {t("sch.teamDeleteMsg")}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => { setDeleteConfirmModal(false); setDeleteTeamId(null); }}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-11 rounded-xl items-center justify-center`}
                  style={{ backgroundColor: deleteLoading ? colors.danger + '80' : colors.danger }}
                  onPress={confirmDeleteTeam}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-medium" style={{ color: "white" }}>{t("sch.yesDelete")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={memberRemoveModal} transparent animationType="fade" onRequestClose={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.removePersonnel")}</Text>
                <TouchableOpacity onPress={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {(() => {
                const team = teams.find((t) => t.id === removeTeamId);
                if (!team) return null;
                const hasLeader = team.leader && team.leader.trim().length > 0;
                return (
                  <View className="border rounded-lg p-2.5 mb-3" style={{ backgroundColor: colors.warning + '15', borderColor: colors.warning + '33' }}>
                    <Text className="text-xs" style={{ color: colors.warning }}>
                      {t("sch.leaderWarning", { leader: team.leader })}
                    </Text>
                  </View>
                );
              })()}
              <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>{t("sch.removePersonnelMsg")}</Text>
              <ScrollView className="max-h-60">
                {teams
                  .find((t) => t.id === removeTeamId)
                  ?.members.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="people-outline" size={32} color={colors.textMuted} />
                    <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>{t("sch.noPersonnelToRemove")}</Text>
                  </View>
                ) : (
                teams
                  .find((t) => t.id === removeTeamId)
                  ?.members.map((p) => (
                    <TouchableOpacity
                      key={p}
                      className={`flex-row items-center justify-between py-3 px-3 border rounded-lg mb-1`}
                      style={{
                        borderColor: selectedMembers.includes(p) ? colors.danger + '4D' : colors.border,
                        backgroundColor: selectedMembers.includes(p) ? colors.danger + '1A' : 'transparent',
                      }}
                      onPress={() => togglePersonelSec(p)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className={`w-5 h-5 rounded border items-center justify-center`} style={{ backgroundColor: selectedMembers.includes(p) ? colors.danger : 'transparent', borderColor: selectedMembers.includes(p) ? colors.danger : colors.textMuted }}>
                          {selectedMembers.includes(p) && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                        <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgInput }}>
                          <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{p.charAt(0)}</Text>
                        </View>
                        <Text className="text-sm" style={{ color: colors.text }}>{p}</Text>
                      </View>
                      <Ionicons name="remove-circle-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <View className="flex-row gap-3 mt-3">
                <TouchableOpacity
                  className="flex-1 h-10 rounded-lg items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}
                  activeOpacity={0.7}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-10 rounded-lg items-center justify-center`}
                  style={{ backgroundColor: removeLoading || selectedMembers.length === 0 ? colors.danger + '4D' : colors.danger }}
                  onPress={handleSelectedRemove}
                  disabled={removeLoading || selectedMembers.length === 0}
                  activeOpacity={0.7}
                >
                  {removeLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-medium" style={{ color: "white" }}>
                      {selectedMembers.length > 0 ? `${selectedMembers.length} ${t("sch.removeSelected")}` : t("sch.removeDefault")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={appointmentDeleteModal} transparent animationType="fade" onRequestClose={() => !deleteLoading && setAppointmentDeleteModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-sm p-5" style={{ backgroundColor: colors.bgCard }}>
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: colors.bgInput }}>
                  <Ionicons name="trash" size={28} color={colors.danger} />
                </View>
                <Text className="text-lg font-bold text-center" style={{ color: colors.text }}>{t("sch.planDelete")}</Text>
                <Text className="text-sm text-center mt-2" style={{ color: colors.textSecondary }}>
                  {t("sch.planDeleteMsg")}
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl items-center justify-center"
                  style={{ backgroundColor: colors.bgInput }}
                  onPress={() => { setAppointmentDeleteModal(false); setAppointmentDeleteId(null); }}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("sch.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-11 rounded-xl items-center justify-center`}
                  style={{ backgroundColor: deleteLoading ? colors.danger + '80' : colors.danger }}
                  onPress={handleAppointmentDelete}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="font-medium" style={{ color: "white" }}>{t("sch.yesDelete")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={dayListModal} transparent animationType="fade" onRequestClose={() => setDayListModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-4" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-bold" style={{ color: colors.text }}>
                    {dayListDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {dayListAppointments.length} {t("sch.servicePlan")}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setDayListModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {dayListAppointments.length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
                  <Text className="text-sm mt-2" style={{ color: colors.textMuted }}>{t("sch.noPlanToday")}</Text>
                  <TouchableOpacity
                    className="mt-3 h-9 px-4 rounded-lg items-center justify-center"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => {
                      setDayListModal(false);
                      handleCellPress(dayListDate);
                    }}
                  >
                    <Text className="text-xs font-medium" style={{ color: "white" }}>+ {t("sch.newPlan")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView className="max-h-[400px]" nestedScrollEnabled>
                  {dayListAppointments.map((a) => {
                    const team = teams.find((t) => t.id === a.ekipId);
                    return (
                      <TouchableOpacity
                        key={a.id}
                        className="rounded-xl p-3 mb-2 flex-row items-center gap-3"
                        style={{ backgroundColor: `${team?.color || "#6080FF"}12`, borderLeftWidth: 3, borderLeftColor: team?.color || "#6080FF" }}
                        onPress={() => {
                          setDayListModal(false);
                          setDetailAppointment(a);
                          setDetailModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-sm font-semibold" style={{ color: colors.text }}>{a.startTime}</Text>
                            <Text className="text-xs" style={{ color: colors.textMuted }}>- {a.duration}</Text>
                          </View>
                          <Text className="text-sm font-medium" style={{ color: colors.text }}>{a.customerName}</Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <View className="flex-row items-center gap-1">
                              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: team?.color || "#6080FF" }} />
                              <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.ekip}</Text>
                            </View>
                            <Text className="text-xs" style={{ color: colors.textMuted }}>•</Text>
                            <Text className="text-xs" style={{ color: colors.textSecondary }}>{a.tur}</Text>
                          </View>
                          {a.notes ? (
                            <Text className="text-xs mt-1" style={{ color: colors.textMuted }} numberOfLines={1}>{a.notes}</Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {dayListAppointments.length > 0 && (
                <TouchableOpacity
                  className="mt-3 h-9 rounded-lg items-center justify-center flex-row gap-1"
                  style={{ backgroundColor: colors.primary + '15' }}
                  onPress={() => {
                    setDayListModal(false);
                    handleCellPress(dayListDate);
                  }}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text className="text-xs font-medium" style={{ color: colors.primary }}>+ {t("sch.newPlan")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={detailModal} transparent animationType="fade" onRequestClose={() => setDetailModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="rounded-2xl w-11/12 max-w-md p-5" style={{ backgroundColor: colors.bgCard }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>{t("sch.planDetail")}</Text>
                <TouchableOpacity onPress={() => setDetailModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {detailAppointment && (() => {
                const team = teams.find((t) => t.id === detailAppointment.ekipId);
                const gunler = [t("day.sunday"), t("day.monday"), t("day.tuesday"), t("day.wednesday"), t("day.thursday"), t("day.friday"), t("day.saturday")];
                const d = strToDate(detailAppointment.tarih);
                return (
                  <View>
                    <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: `${team?.color || "#6080FF"}15` }}>
                      <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${team?.color || "#6080FF"}30` }}>
                          <Ionicons name="people" size={20} color={team?.color || "#6080FF"} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-semibold text-sm" style={{ color: colors.text }}>{detailAppointment.customerName}</Text>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>{detailAppointment.tur}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="gap-3 mb-4">
                      <View className="flex-row items-center gap-3">
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                        <View>
                           <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.date")}</Text>
                          <Text className="text-sm font-medium" style={{ color: colors.text }}>{gunler[d.getDay()]}, {detailAppointment.tarih}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-3">
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <View>
                           <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.timeDuration")}</Text>
                          <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.startTime} - {detailAppointment.duration}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-3">
                        <Ionicons name="people-outline" size={18} color={colors.primary} />
                        <View>
                           <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.team")}</Text>
                          <Text className="text-sm font-medium" style={{ color: colors.text }}>{detailAppointment.ekip}</Text>
                        </View>
                      </View>

                      {detailAppointment.notes ? (
                        <View className="flex-row items-start gap-3">
                          <Ionicons name="document-text-outline" size={18} color={colors.primary} style={{ marginTop: 2 }} />
                          <View className="flex-1">
                            <Text className="text-xs" style={{ color: colors.textMuted }}>{t("sch.notes")}</Text>
                            <Text className="text-sm" style={{ color: colors.text }}>{detailAppointment.notes}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 h-10 rounded-lg items-center justify-center flex-row gap-2"
                        style={{ backgroundColor: colors.danger + '15' }}
                        onPress={() => {
                          setDetailModal(false);
                          handleAppointmentDeleteRequest(detailAppointment.id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text className="text-xs font-medium" style={{ color: colors.danger }}>{t("common.delete")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 h-10 rounded-lg items-center justify-center flex-row gap-2"
                        style={{ backgroundColor: colors.primary }}
                        onPress={handleDetailEdit}
                      >
                        <Ionicons name="create-outline" size={16} color="white" />
                        <Text className="text-xs font-medium" style={{ color: "white" }}>{t("common.edit")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </View>
        </Modal>

        <CustomAlert
          visible={alertVisible}
          type={alertType}
          title={alertTitle}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />

      </View>
    </ScrollView>
  );
}
