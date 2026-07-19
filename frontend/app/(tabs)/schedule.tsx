import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, type ICalendarEventBase, type Mode } from "react-native-big-calendar";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { teamApi, type Team, type CompanyUser } from "../../api/teams";
import { appointmentApi, type Appointment } from "../../api/appointments";
import { customerApi, type Customer } from "../../api/customers";

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
  onDeleteEvent,
}: {
  event: ScheduleEvent;
  touchableOpacityProps: any;
  cellHeight: number;
  containerWidth: number;
  mode: string;
  originalAppointment: Appointment | undefined;
  onDragEnd: (eventId: number, newStartTime: string, newDate: string) => void;
  onPressEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: number) => void;
}) {
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600', lineHeight: 13 }} numberOfLines={1}>{event.title}</Text>
            {event.ekipAdi ? (
              <View style={{ backgroundColor: event.renk, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 0, marginTop: 1, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700', lineHeight: 10 }} numberOfLines={1}>{event.ekipAdi}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => { if (event.eventId) onDeleteEvent(event.eventId); }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={{ backgroundColor: '#3A3A3A', borderRadius: 12, padding: 7, marginLeft: 4 }}
          >
            <Ionicons name="trash" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const trLocale = {
  monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  dayNames: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
  dayNamesShort: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  today: "Bugün",
};

interface ScheduleEvent extends ICalendarEventBase {
  renk: string;
  ekipAdi?: string;
  eventId?: number;
}

const durationOptions = [
  { label: "30 dk", value: "30dk" },
  { label: "1 saat", value: "1saat" },
  { label: "1.5 saat", value: "1.5saat" },
  { label: "2 saat", value: "2saat" },
];

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

const trGunler = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

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

const TEAM_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

function TrWeekHeader({ dateRange }: any) {
  return (
    <View className="flex-row border-b border-[#2A2A2A]">
      {dateRange.map((date: any, i: number) => {
        const bugun = new Date();
        const isToday = date.date() === bugun.getDate() && date.month() === bugun.getMonth();
        return (
          <View key={i} className="flex-1 items-center py-2">
            <Text className="text-xs mb-1" style={{ color: isToday ? "#3B82F6" : "#9CA3AF" }}>
              {trGunler[date.day()]}
            </Text>
            <View className={`h-7 w-7 rounded-full items-center justify-center ${isToday ? "bg-[#3B82F6]" : ""}`}>
              <Text className={`text-sm font-semibold ${isToday ? "text-white" : "text-white"}`}>
                {date.date()}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TrMonthHeader({ weekStartsOn }: any) {
  const gunler = weekStartsOn === 1
    ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
    : ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  return (
    <View className="flex-row border-b border-[#2A2A2A]">
      {gunler.map((g, i) => (
        <View key={i} className="flex-1 items-center py-2">
          <Text className="text-xs" style={{ color: "#9CA3AF" }}>{g}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ScheduleScreen() {
  const [mode, setMode] = useState<Mode>("day");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("Tümü");
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

  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; companyName: string; contactPerson: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const [serviceTypes] = useState<string[]>([
    "Alarm", "Yangın", "CCTV", "Montaj",
    "Kablolama", "Devreye Alma", "Bakım", "Arıza",
  ]);
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
      Alert.alert("Hata", "Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAppointments = selectedTeamFilter === "Tümü"
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
      renk: team?.color || "#3B82F6",
      eventId: a.id,
    };
  });

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !newTeamLeader.trim()) {
      Alert.alert("Uyarı", "Ekip adı ve lider zorunludur.");
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
      Alert.alert("Hata", error.response?.data?.message || "Ekip eklenemedi.");
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
        Alert.alert("Hata", error.response?.data?.message || "Personel eklenemedi.");
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
      Alert.alert("Hata", error.response?.data?.message || "Ekip silinemedi.");
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
      Alert.alert("Uyarı", "Lütfen en az bir personel seçin.");
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
      Alert.alert("Hata", error.response?.data?.message || "Personel çıkarılamadı.");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleCellPress = (date: Date) => {
    setSelectedDate(date);
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
      setEditingAppointmentId(atama.id);
      setSelectedCustomer(atama.customerId ? { id: atama.customerId, companyName: atama.customerName, contactPerson: "" } : null);
      setSelectedDate(strToDate(atama.tarih));
      setTimeInput(atama.startTime);
      setSelectedDuration(atama.duration);
      setSelectedService(atama.tur);
      setSelectedTeamId(atama.ekipId);
      setNotlar(atama.notes || "");
      setAppointmentModal(true);
    }
  };

  const handleAppointmentSave = async () => {
    const team = teams.find((t) => t.id === selectedTeamId);
    const customerName = selectedCustomer?.companyName || customerSearch.trim();
    if (!customerName) {
      Alert.alert("Uyarı", "Müşteri seçimi zorunludur.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeInput)) {
      Alert.alert("Uyarı", "Geçerli saat girin (HH:MM).");
      return;
    }
    const [h] = timeInput.split(":").map(Number);
    if (h < 8 || h > 23) {
      Alert.alert("Uyarı", "Saat 08:00 - 23:00 arasında olmalıdır.");
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
      Alert.alert("Hata", error.response?.data?.message || "İşlem başarısız.");
    } finally {
      setAppointmentSaving(false);
    }
  };

  const handleDragEnd = async (eventId: number, newStartTime: string, newDate: string) => {
    try {
      await appointmentApi.update(eventId, { startTime: newStartTime, tarih: newDate } as any);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === eventId ? { ...a, startTime: newStartTime, tarih: newDate } : a
        )
      );
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.message || "Plan taşınamadı.");
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
      Alert.alert("Hata", error.response?.data?.message || "Plan silinemedi.");
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
      <View className="flex-1 bg-[#0A0A0A] items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-400 mt-3">Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#0A0A0A]" indicatorStyle="white">
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white tracking-tight">
              Plan Yönetimi
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/dashboard")}>
            <Ionicons name="home-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-sm mb-5">
          Ekiplerinizi ve servis planlarınızı yönetin
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-4 items-center">
          {(["day", "week", "month"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              className={`px-4 h-8 rounded-lg items-center justify-center ${
                mode === m ? "bg-[#3B82F6]" : "bg-[#1A1A1A] border border-[#2A2A2A]"
              }`}
              onPress={() => setMode(m)}
            >
              <Text className={`text-xs font-medium ${mode === m ? "text-white" : "text-gray-400"}`}>
                {m === "day" ? "Gün" : m === "week" ? "Hafta" : "Ay"}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="flex-row items-center h-8 px-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg"
            onPress={() => setTeamDropdownOpen(true)}
          >
            <Text className="text-xs text-white mr-2">
              {selectedTeamFilter === "Tümü" ? "Tüm Ekipler" : selectedTeamFilter}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="h-8 w-8 bg-[#2A2A2A] rounded-lg items-center justify-center"
            onPress={() => setSelectedTeamFilter("Tümü")}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] p-3 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              className="h-8 px-3 bg-[#2A2A2A] rounded-lg items-center justify-center flex-row"
              onPress={() => {
                const d = new Date(calendarDate);
                d.setDate(d.getDate() - (mode === "week" ? 7 : mode === "month" ? 30 : 1));
                setCalendarDate(d);
              }}
            >
              <Ionicons name="chevron-back" size={14} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-4 bg-[#3B82F6]/10 rounded-lg items-center justify-center"
              onPress={() => setCalendarDate(new Date())}
            >
              <Text className="text-[#3B82F6] text-xs font-medium">Bugün</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-8 px-3 bg-[#2A2A2A] rounded-lg items-center justify-center flex-row"
              onPress={() => {
                const d = new Date(calendarDate);
                d.setDate(d.getDate() + (mode === "week" ? 7 : mode === "month" ? 30 : 1));
                setCalendarDate(d);
              }}
            >
              <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] overflow-hidden mb-6" onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
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
            renderHeaderForMonthView={TrMonthHeader}
            locale={trLocale as any}
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
                  onDeleteEvent={handleAppointmentDeleteRequest}
                />
              );
            }}
            theme={{
              palette: {
                primary: { main: "#3B82F6", contrastText: "#fff" },
                nowIndicator: "#3B82F6",
                gray: { 100: "#f5f5f5", 200: "#2A2A2A", 300: "#9CA3AF", 500: "#6B7280", 800: "#1A1A1A" },
                moreLabel: "#3B82F6",
              },
              typography: {
                xs: { fontSize: 11 },
                sm: { fontSize: 13 },
                xl: { fontSize: 16, fontWeight: "600" },
                moreLabel: { fontSize: 12 },
              },
            }}
          />
        </View>

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] p-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-semibold text-base">Ekipler</Text>
            <TouchableOpacity
              className="flex-row items-center h-8 px-3 bg-[#3B82F6]/10 rounded-lg"
              onPress={() => {
                setNewTeamName("");
                setNewTeamLeader("");
                setNewTeamMembers([]);
                setEkipModal(true);
              }}
            >
              <Ionicons name="add" size={16} color="#3B82F6" />
              <Text className="text-[#3B82F6] text-xs font-medium ml-1">Yeni Ekip</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {teams.map((team) => (
              <View
                key={team.id}
                className="w-[48%] md:w-[32%] lg:w-[24%] bg-[#1A1A1A] rounded-2xl p-4 h-64"
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${team.color}20` }}
                  >
                    <Ionicons name="people" size={20} color={team.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-sm">{team.name}</Text>
                    <Text className="text-gray-500 text-xs">Lider: {team.leader}</Text>
                  </View>
                  <TouchableOpacity
                    className="p-2 rounded-lg bg-[#3A3A3A]"
                    onPress={() => handleTeamDelete(team.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <ScrollView className="flex-1 mb-2" indicatorStyle="white" nestedScrollEnabled>
                  <View className="mb-3">
                    <Text className="text-gray-400 text-xs font-medium mb-2">Personel ({team.members.length + 1})</Text>
                    <View className="flex-row items-center py-1 border-b border-[#2A2A2A]/30">
                      <View className="w-6 h-6 rounded-full items-center justify-center mr-2" style={{ backgroundColor: team.color }}>
                        <Text className="text-white text-[10px] font-bold">{team.leader.charAt(0)}</Text>
                      </View>
                      <Text className="text-[#F59E0B] text-xs font-medium mr-1">{team.leader}</Text>
                      <Text className="text-[#F59E0B] text-xs">👑</Text>
                    </View>
                    {team.members.map((personel, idx) => (
                      <View key={idx} className="flex-row items-center py-1 border-b border-[#2A2A2A]/30">
                        <View className="w-6 h-6 rounded-full bg-[#2A2A2A] items-center justify-center mr-2">
                          <Text className="text-[10px] text-gray-300 font-medium">
                            {personel.charAt(0)}
                          </Text>
                        </View>
                        <Text className="text-gray-300 text-xs">{personel}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <View className="flex-row items-center justify-between pt-2 border-t border-[#2A2A2A]">
                  <Text className="text-gray-400 text-xs">
                    {appointments.filter((a) => a.ekipId === team.id).length} atama
                  </Text>
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      className="p-1.5 rounded-lg bg-[#F59E0B]/10"
                      onPress={() => handlePersonelCikarAc(team.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-remove-outline" size={16} color="#F59E0B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="p-1.5 rounded-lg bg-[#3B82F6]/10"
                      onPress={() => handlePersonelEkleAc(team.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-add-outline" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Modal visible={ekipModal} transparent animationType="fade" onRequestClose={() => setEkipModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">Yeni Ekip</Text>
                <TouchableOpacity onPress={() => setEkipModal(false)}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs font-medium mb-1">Ekip Adı</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Ekip adını girin"
                placeholderTextColor="#555"
                value={newTeamName}
                onChangeText={setNewTeamName}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Ekip Lideri</Text>
              <TouchableOpacity
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 flex-row items-center justify-between mb-3"
                onPress={() => setLeaderDropdownOpen(!leaderDropdownOpen)}
              >
                <Text className={`text-sm ${newTeamLeader ? "text-white" : "text-gray-500"}`}>
                  {newTeamLeader || "Lider seçin..."}
                </Text>
                <Ionicons name={leaderDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
              </TouchableOpacity>
              {leaderDropdownOpen && (
                <View className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg mb-3 max-h-40 overflow-hidden">
                  <ScrollView nestedScrollEnabled bounces={false}>
                    {companyUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        className={`px-3 py-2.5 border-b border-[#2A2A2A] flex-row items-center ${newTeamLeader === user.name ? "bg-[#3B82F6]/10" : ""}`}
                        onPress={() => {
                          setNewTeamLeader(user.name);
                          setLeaderDropdownOpen(false);
                        }}
                      >
                        <View className="w-6 h-6 rounded-full bg-[#3B82F6] items-center justify-center mr-2">
                          <Text className="text-white text-[10px] font-bold">{user.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className={`text-sm ${newTeamLeader === user.name ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
                            {user.name}
                          </Text>
                          <Text className="text-gray-500 text-xs">{user.email}</Text>
                        </View>
                        {newTeamLeader === user.name && (
                          <Ionicons name="checkmark" size={18} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <Text className="text-gray-400 text-xs font-medium mb-1">Personeller</Text>
              <TouchableOpacity
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 flex-row items-center justify-between mb-1"
                onPress={() => setMemberSelectOpen(!memberSelectOpen)}
              >
                <Text className={`text-sm flex-1 ${newTeamMembers.length > 0 ? "text-white" : "text-gray-500"}`}>
                  {newTeamMembers.length > 0
                    ? `${newTeamMembers.length} personel seçildi`
                    : "Personel seçin..."}
                </Text>
                <Ionicons name={memberSelectOpen ? "chevron-up" : "chevron-down"} size={16} color="#666" />
              </TouchableOpacity>
              {newTeamMembers.length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mb-2">
                  {newTeamMembers.map((name) => (
                    <View key={name} className="flex-row items-center bg-[#3B82F6]/20 border border-[#3B82F6]/40 rounded-lg px-2 py-1">
                      <Text className="text-[#3B82F6] text-xs mr-1">{name}</Text>
                      <TouchableOpacity onPress={() => setNewTeamMembers((prev) => prev.filter((n) => n !== name))}>
                        <Ionicons name="close" size={12} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {memberSelectOpen && (
                <View className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg mb-3 max-h-40 overflow-hidden">
                  <ScrollView nestedScrollEnabled bounces={false}>
                    {companyUsers
                      .filter((u) => u.name !== newTeamLeader)
                      .map((user) => {
                        const isSelected = newTeamMembers.includes(user.name);
                        return (
                          <TouchableOpacity
                            key={user.id}
                            className={`px-3 py-2.5 border-b border-[#2A2A2A] flex-row items-center ${isSelected ? "bg-[#3B82F6]/10" : ""}`}
                            onPress={() => {
                              setNewTeamMembers((prev) =>
                                isSelected ? prev.filter((n) => n !== user.name) : [...prev, user.name]
                              );
                            }}
                          >
                            <View className={`w-5 h-5 rounded border items-center justify-center mr-2 ${isSelected ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#555]"}`}>
                              {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>
                            <View className="w-6 h-6 rounded-full bg-[#2A2A2A] items-center justify-center mr-2">
                              <Text className="text-[10px] text-gray-300 font-medium">{user.name.charAt(0)}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className={`text-sm ${isSelected ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
                                {user.name}
                              </Text>
                              <Text className="text-gray-500 text-xs">{user.email}</Text>
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
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setEkipModal(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={handleAddTeam}
                >
                  <Text className="text-white font-medium">Ekle</Text>
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
            <View className="bg-[#1A1A1A] rounded-2xl w-64 max-h-60 overflow-hidden">
              <ScrollView nestedScrollEnabled bounces={false}>
                <TouchableOpacity
                  className="px-4 py-3 border-b border-[#2A2A2A]"
                  onPress={() => {
                    setSelectedTeamFilter("Tümü");
                    setTeamDropdownOpen(false);
                  }}
                >
                  <Text className={`text-sm ${selectedTeamFilter === "Tümü" ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
                    Tüm Ekipler
                  </Text>
                </TouchableOpacity>
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    className="px-4 py-3 border-b border-[#2A2A2A] flex-row items-center"
                    onPress={() => {
                      setSelectedTeamFilter(t.name);
                      setTeamDropdownOpen(false);
                    }}
                  >
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-3"
                      style={{ backgroundColor: t.color }}
                    />
                    <Text className={`text-sm ${selectedTeamFilter === t.name ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={appointmentModal} transparent animationType="fade" onRequestClose={() => resetAppointmentModal()}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">{editingAppointmentId ? "Planı Güncelle" : "Servis Atama"}</Text>
                <TouchableOpacity onPress={() => resetAppointmentModal()}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>

              <View className="mb-3">
                <Text className="text-gray-400 text-xs font-medium mb-1">Müşteri</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 relative z-10">
                    <TouchableOpacity
                      className="h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 flex-row items-center justify-between"
                      onPress={() => setCustomerDropdownOpen(true)}
                    >
                      <Text className="text-white text-sm">
                        {selectedCustomer ? selectedCustomer.companyName : "Müşteri seçin..."}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <ScrollView className="max-h-[400px]" nestedScrollEnabled indicatorStyle="white">
                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Tarih</Text>
                  <View className="h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 items-center justify-center">
                    <Text className="text-white text-sm">
                      {selectedDate.toLocaleDateString("tr-TR")}
                    </Text>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Saat</Text>
                  <TextInput
                    className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                    placeholder="HH:MM"
                    placeholderTextColor="#555"
                    value={timeInput}
                    onChangeText={setTimeInput}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Süre</Text>
                  <View className="flex-row gap-1.5 flex-wrap">
                    {durationOptions.map((s) => (
                      <TouchableOpacity
                        key={s.value}
                        className={`px-3 h-8 rounded-lg items-center justify-center border ${
                          selectedDuration === s.value
                            ? "bg-[#3B82F6]/20 border-[#3B82F6]"
                            : "bg-[#0A0A0A] border-[#2A2A2A]"
                        }`}
                        onPress={() => setSelectedDuration(s.value)}
                      >
                        <Text className={`text-xs ${selectedDuration === s.value ? "text-[#3B82F6]" : "text-gray-400"}`}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Ekip Seç</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {teams.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        className={`flex-row items-center px-3 h-8 rounded-lg border ${
                          selectedTeamId === t.id
                            ? "bg-[#3B82F6]/20 border-[#3B82F6]"
                            : "bg-[#0A0A0A] border-[#2A2A2A]"
                        }`}
                        onPress={() => setSelectedTeamId(t.id)}
                      >
                        <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: t.color }} />
                        <Text className={`text-xs ${selectedTeamId === t.id ? "text-[#3B82F6]" : "text-gray-400"}`}>
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Servis Türü</Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1 relative z-10">
                      <TouchableOpacity
                        className="h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 flex-row items-center justify-between"
                        onPress={() => setServiceDropdownOpen(true)}
                      >
                        <Text className="text-white text-sm">{selectedService}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-gray-400 text-xs font-medium mb-1">Notlar</Text>
                  <TextInput
                    className="w-full h-20 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Servis notları..."
                    placeholderTextColor="#555"
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
                    className="h-10 px-3 bg-[#3A3A3A] rounded-lg items-center justify-center"
                    onPress={() => handleAppointmentDeleteRequest(editingAppointmentId)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : null}
                <View className="flex-1" />
                <TouchableOpacity
                  className="h-10 px-4 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => resetAppointmentModal()}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`h-10 px-4 rounded-lg items-center justify-center ${appointmentSaving ? "bg-[#3B82F6]/50" : "bg-[#3B82F6]"}`}
                  onPress={handleAppointmentSave}
                  disabled={appointmentSaving}
                >
                  {appointmentSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">{editingAppointmentId ? "Güncelle" : "Atama Yap"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={customerDropdownOpen} transparent animationType="fade" onRequestClose={() => setCustomerDropdownOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/40">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg font-bold">Müşteri Seç</Text>
                <TouchableOpacity onPress={() => setCustomerDropdownOpen(false)}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Müşteri ara..."
                placeholderTextColor="#555"
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
                      className="px-3 py-2 border-b border-[#2A2A2A]"
                      onPress={() => {
                        setSelectedCustomer(m);
                        setCustomerDropdownOpen(false);
                        setCustomerSearch("");
                      }}
                    >
                      <Text className="text-white text-sm">{m.companyName}</Text>
                      <Text className="text-gray-500 text-xs">{m.contactPerson}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              <View className="flex-row items-center gap-2 mt-3 border-t border-[#2A2A2A] pt-3">
                <TextInput
                  className="flex-1 h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm"
                  placeholder="Geçici müşteri adı girin..."
                  placeholderTextColor="#555"
                  value={tempCustomerName}
                  onChangeText={setTempCustomerName}
                />
                <TouchableOpacity
                  className="h-10 px-4 bg-[#3B82F6] rounded-lg items-center justify-center"
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
                  <Text className="text-white text-sm font-medium">Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={serviceDropdownOpen} transparent animationType="fade" onRequestClose={() => setServiceDropdownOpen(false)}>
          <View className="flex-1 justify-center items-center bg-black/40">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg font-bold">Servis Türü Seç</Text>
                <TouchableOpacity onPress={() => setServiceDropdownOpen(false)}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <ScrollView className="max-h-60" nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {serviceTypes.map((h, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`px-3 py-3 border-b border-[#2A2A2A] ${selectedService === h ? "bg-[#3B82F6]/10" : ""}`}
                    onPress={() => {
                      setSelectedService(h);
                      setServiceDropdownOpen(false);
                    }}
                  >
                    <Text className={`text-sm ${selectedService === h ? "text-[#3B82F6] font-semibold" : "text-white"}`}>
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
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg font-bold">Personel Ekle</Text>
                <TouchableOpacity onPress={() => { setMemberModal(false); setMemberSearch(""); setMemberAddTeamId(null); }}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Personel ara..."
                placeholderTextColor="#555"
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
                      <Ionicons name="people-outline" size={32} color="#555" />
                      <Text className="text-gray-500 text-sm mt-2">
                        {memberSearch ? "Sonuç bulunamadı" : "Eklenebilecek personel kalmadı"}
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
                        className="px-3 py-2.5 border-b border-[#2A2A2A] flex-row items-center"
                        onPress={() => handlePersonelEkle(user.name)}
                        activeOpacity={0.7}
                      >
                        <View className="w-8 h-8 rounded-full bg-[#3B82F6] items-center justify-center mr-3">
                          <Text className="text-white text-xs font-bold">{user.name.charAt(0)}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-sm">{user.name}</Text>
                          <Text className="text-gray-500 text-xs">{user.email}</Text>
                        </View>
                        <Ionicons name="add-circle-outline" size={22} color="#3B82F6" />
                      </TouchableOpacity>
                    ))
                  )}
              </ScrollView>
              <View className="mt-3">
                <TouchableOpacity
                  className="w-full h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => { setMemberModal(false); setMemberSearch(""); setMemberAddTeamId(null); }}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 font-medium">Kapat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={deleteConfirmModal} transparent animationType="fade" onRequestClose={() => !deleteLoading && setDeleteConfirmModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-5">
              <View className="items-center mb-4">
                  <View className="w-14 h-14 rounded-full bg-[#3A3A3A] items-center justify-center mb-3">
                    <Ionicons name="trash" size={28} color="#9CA3AF" />
                  </View>
                  <Text className="text-white text-lg font-bold text-center">Ekibi Sil</Text>
                <Text className="text-gray-400 text-sm text-center mt-2">
                  Bu ekibi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-11 bg-[#2A2A2A] rounded-xl items-center justify-center"
                  onPress={() => { setDeleteConfirmModal(false); setDeleteTeamId(null); }}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-11 rounded-xl items-center justify-center ${deleteLoading ? "bg-[#EF4444]/50" : "bg-[#EF4444]"}`}
                  onPress={confirmDeleteTeam}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Evet, Sil</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={memberRemoveModal} transparent animationType="fade" onRequestClose={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-lg font-bold">Personel Çıkar</Text>
                <TouchableOpacity onPress={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              {(() => {
                const team = teams.find((t) => t.id === removeTeamId);
                if (!team) return null;
                const hasLeader = team.leader && team.leader.trim().length > 0;
                return (
                  <View className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-2.5 mb-3">
                    <Text className="text-[#F59E0B] text-xs">
                      Lider: {team.leader} — lider çıkarılamaz, sadece üyeler seçilebilir.
                    </Text>
                  </View>
                );
              })()}
              <Text className="text-gray-400 text-sm mb-3">Çıkarmak istediğiniz personeli seçin:</Text>
              <ScrollView className="max-h-60">
                {teams
                  .find((t) => t.id === removeTeamId)
                  ?.members.length === 0 ? (
                  <View className="py-8 items-center">
                    <Ionicons name="people-outline" size={32} color="#555" />
                    <Text className="text-gray-500 text-sm mt-2">Ekipte çıkarılacak personel yok</Text>
                  </View>
                ) : (
                teams
                  .find((t) => t.id === removeTeamId)
                  ?.members.map((p) => (
                    <TouchableOpacity
                      key={p}
                      className={`flex-row items-center justify-between py-3 px-3 border-b border-[#2A2A2A] rounded-lg mb-1 ${selectedMembers.includes(p) ? "bg-[#EF4444]/10 border-[#EF4444]/30" : ""}`}
                      onPress={() => togglePersonelSec(p)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className={`w-5 h-5 rounded border items-center justify-center ${selectedMembers.includes(p) ? "bg-[#EF4444] border-[#EF4444]" : "border-[#555]"}`}>
                          {selectedMembers.includes(p) && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                        <View className="w-7 h-7 rounded-full bg-[#2A2A2A] items-center justify-center">
                          <Text className="text-[10px] text-gray-300 font-medium">{p.charAt(0)}</Text>
                        </View>
                        <Text className="text-white text-sm">{p}</Text>
                      </View>
                      <Ionicons name="remove-circle-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <View className="flex-row gap-3 mt-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-10 rounded-lg items-center justify-center ${removeLoading || selectedMembers.length === 0 ? "bg-[#EF4444]/30" : "bg-[#EF4444]"}`}
                  onPress={handleSelectedRemove}
                  disabled={removeLoading || selectedMembers.length === 0}
                  activeOpacity={0.7}
                >
                  {removeLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">
                      {selectedMembers.length > 0 ? `${selectedMembers.length} Kişiyi Çıkar` : "Seçilenleri Çıkar"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={appointmentDeleteModal} transparent animationType="fade" onRequestClose={() => !deleteLoading && setAppointmentDeleteModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-5">
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-full bg-[#3A3A3A] items-center justify-center mb-3">
                  <Ionicons name="trash" size={28} color="#9CA3AF" />
                </View>
                <Text className="text-white text-lg font-bold text-center">Planı Sil</Text>
                <Text className="text-gray-400 text-sm text-center mt-2">
                  Bu planı silmek istediğinize emin misiniz?
                </Text>
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-11 bg-[#2A2A2A] rounded-xl items-center justify-center"
                  onPress={() => { setAppointmentDeleteModal(false); setAppointmentDeleteId(null); }}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 h-11 rounded-xl items-center justify-center ${deleteLoading ? "bg-[#EF4444]/50" : "bg-[#EF4444]"}`}
                  onPress={handleAppointmentDelete}
                  disabled={deleteLoading}
                  activeOpacity={0.7}
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Evet, Sil</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}
