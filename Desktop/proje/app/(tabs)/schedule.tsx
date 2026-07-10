import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, type ICalendarEventBase, type Mode } from "react-native-big-calendar";

const trLocale = {
  monthNames: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  monthNamesShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  dayNames: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
  dayNamesShort: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  today: "Bugün",
};

type Team = {
  id: number;
  name: string;
  leader: string;
  color: string;
  members: string[];
};

type Customer = {
  id: number;
  companyName: string;
  contactPerson: string;
};

type Appointment = {
  id: number;
  customerName: string;
  ekip: string;
  ekipId: number;
  tarih: Date;
  startTime: string;
  duration: string;
  tur: string;
  notes: string;
};

interface ScheduleEvent extends ICalendarEventBase {
  renk: string;
}

const initialTeams: Team[] = [
  { id: 1, name: "Alfa Ekibi", leader: "Ahmet", color: "#3B82F6", members: ["Mehmet Demir", "Ayşe Kaya", "Ali Can"] },
  { id: 2, name: "Bravo Ekibi", leader: "Ayşe", color: "#10B981", members: ["Zeynep Öz", "Murat Şahin", "Elif Yıldız"] },
];

const customerList: Customer[] = [
  { id: 1, companyName: "ABC Teknoloji", contactPerson: "Ahmet Yılmaz" },
  { id: 2, companyName: "XYZ Yazılım", contactPerson: "Ayşe Demir" },
  { id: 3, companyName: "DEF Danışmanlık", contactPerson: "Mehmet Öz" },
  { id: 4, companyName: "GHI Güvenlik", contactPerson: "Zeynep Kaya" },
  { id: 5, companyName: "JKL Enerji", contactPerson: "Ali Öztürk" },
];

const [firstService, ...servicesList] = [
  "Alarm", "Yangın", "CCTV", "Montaj",
  "Kablolama", "Devreye Alma", "Bakım", "Arıza",
];

const durationOptions = [
  { label: "30 dk", value: "30dk" },
  { label: "1 saat", value: "1saat" },
  { label: "1.5 saat", value: "1.5saat" },
  { label: "2 saat", value: "2saat" },
];

const fakeAppointments: Appointment[] = [
  {
    id: 1, customerName: "ABC Teknoloji", ekip: "Alfa Ekibi", ekipId: 1,
    tarih: new Date(), startTime: "09:00", duration: "1saat", tur: "Alarm", notes: "Yıllık bakım",
  },
  {
    id: 2, customerName: "XYZ Yazılım", ekip: "Bravo Ekibi", ekipId: 2,
    tarih: new Date(new Date().setDate(new Date().getDate() + 1)), startTime: "10:30", duration: "1.5saat", tur: "CCTV", notes: "Kamera kurulumu",
  },
  {
    id: 3, customerName: "DEF Danışmanlık", ekip: "Alfa Ekibi", ekipId: 1,
    tarih: new Date(new Date().setDate(new Date().getDate() + 1)), startTime: "14:00", duration: "2saat", tur: "Yangın", notes: "Yangın dedektörü testi",
  },
  {
    id: 4, customerName: "GHI Güvenlik", ekip: "Bravo Ekibi", ekipId: 2,
    tarih: new Date(new Date().setDate(new Date().getDate() + 2)), startTime: "08:00", duration: "30dk", tur: "Bakım", notes: "Rutin kontrol",
  },
  {
    id: 5, customerName: "JKL Enerji", ekip: "Alfa Ekibi", ekipId: 1,
    tarih: new Date(new Date().setDate(new Date().getDate() + 3)), startTime: "13:00", duration: "1saat", tur: "Montaj", notes: "Yeni panel montajı",
  },
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

function TrMonthHeader({ weekStartsOn, locale }: any) {
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
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("Tümü");
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [appointments, setAppointments] = useState<Appointment[]>(fakeAppointments);
  const [customers, setCustomers] = useState<Customer[]>(customerList);

  const [ekipModal, setEkipModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLeader, setNewTeamLeader] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState("");

  const [appointmentModal, setAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerContact, setNewCustomerContact] = useState("");

  const [serviceTypes, setServiceTypes] = useState<string[]>(servicesList);
  const [selectedService, setSelectedService] = useState(firstService);
  const [newServiceModal, setNewServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");

  const [timeInput, setTimeInput] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState("1saat");
  const [selectedTeamId, setSelectedTeamId] = useState<number>(initialTeams[0]?.id || 0);
  const [notlar, setNotlar] = useState("");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [memberInput, setMemberInput] = useState("");
  const [memberAddTeamId, setMemberAddTeamId] = useState<number | null>(null);
  const [memberRemoveModal, setMemberRemoveModal] = useState(false);
  const [removeTeamId, setRemoveTeamId] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const now = new Date();
  const scrollOffset = now.getHours() * 60 + now.getMinutes() - 30;

  const filteredAppointments = selectedTeamFilter === "Tümü"
    ? appointments
    : appointments.filter((a) => a.ekip === selectedTeamFilter);

  const events: ScheduleEvent[] = filteredAppointments.map((a) => {
    const { h, m } = parseSaat(a.startTime);
    const start = new Date(a.tarih);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + durationToMs(a.duration));
    const team = teams.find((t) => t.id === a.ekipId);
    return {
      title: `${a.customerName} - ${a.tur} (${a.ekip})`,
      start,
      end,
      renk: team?.color || "#3B82F6",
    };
  });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerDropdownOpen(false);
    setCustomerSearch("");
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim() || !newTeamLeader.trim()) {
      Alert.alert("Uyarı", "Ekip adı ve lider zorunludur.");
      return;
    }
    const renkler = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    const yeni: Team = {
      id: Math.max(...teams.map((t) => t.id), 0) + 1,
      name: newTeamName.trim(),
      leader: newTeamLeader.trim(),
      color: renkler[teams.length % renkler.length],
      members: newTeamMembers.split(",").map((p) => p.trim()).filter((p) => p),
    };
    setTeams((prev) => [...prev, yeni]);
    setNewTeamName("");
    setNewTeamLeader("");
    setNewTeamMembers("");
    setEkipModal(false);
  };

  const handlePersonelEkleAc = (teamId: number) => {
    setMemberAddTeamId(teamId);
    setMemberInput("");
    setMemberModal(true);
  };

  const handlePersonelEkle = () => {
    if (memberInput.trim() && memberAddTeamId !== null) {
      setTeams((prev) =>
        prev.map((t) =>
          t.id === memberAddTeamId
            ? { ...t, members: [...t.members, memberInput.trim()] }
            : t
        )
      );
      setMemberModal(false);
      setMemberInput("");
      setMemberAddTeamId(null);
    }
  };

  const handleTeamDelete = (teamId: number) => {
    Alert.alert(
      "Ekip Sil",
      "Bu ekibi silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            setTeams((prev) => prev.filter((t) => t.id !== teamId));
            setAppointments((prev) => prev.filter((a) => a.ekipId !== teamId));
          },
        },
      ]
    );
  };

  const handlePersonelCikarAc = (teamId: number) => {
    setRemoveTeamId(teamId);
    setSelectedMembers([]);
    setMemberRemoveModal(true);
  };

  const togglePersonelSec = (personel: string) => {
    setSelectedMembers((prev) =>
      prev.includes(personel)
        ? prev.filter((p) => p !== personel)
        : [...prev, personel]
    );
  };

  const handleSelectedRemove = () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Uyarı", "Lütfen en az bir personel seçin.");
      return;
    }

    const teamId = removeTeamId;
    if (teamId === null) {
      Alert.alert("Hata", "Ekip bilgisi bulunamadı.");
      return;
    }

    const mevcutEkip = teams.find((t) => t.id === teamId);
    console.log("🔍 Mevcut ekip:", mevcutEkip?.name);
    console.log("🔍 Mevcut personeller:", mevcutEkip?.members);
    console.log("🔍 Çıkarılacak personeller:", selectedMembers);

    Alert.alert(
      "Personel Çıkar",
      `${selectedMembers.length} kişiyi ekipten çıkarmak istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: () => {
            const secilenler = [...selectedMembers];
            const hedefEkip = teams.find((t) => t.id === teamId);

            if (!hedefEkip) {
              Alert.alert("Hata", "Ekip bulunamadı.");
              return;
            }

            const guncelPersoneller = hedefEkip.members.filter(
              (p) => !secilenler.includes(p)
            );

            console.log("🔍 Yeni personel listesi:", guncelPersoneller);

            setTeams((prev) => {
              const updated = prev.map((t) => {
                if (t.id === teamId) {
                  return {
                    ...t,
                    members: guncelPersoneller
                  };
                }
                return t;
              });
              console.log("🔍 Güncellenmiş teams:", updated);
              return updated;
            });

            setMemberRemoveModal(false);
            setSelectedMembers([]);
            setRemoveTeamId(null);
          },
        },
      ]
    );
  };

  const handleCellPress = (date: Date) => {
    setSelectedDate(date);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setTimeInput("09:00");
    setSelectedDuration("1saat");
    setSelectedService(serviceTypes[0] || firstService);
    setSelectedTeamId(teams[0]?.id || 0);
    setNotlar("");
    setAppointmentModal(true);
  };

  const handleEventPress = (event: ScheduleEvent) => {
    const atama = appointments.find(
      (a) => event.title.startsWith(`${a.customerName} - ${a.tur}`)
    );
    if (atama) {
      Alert.alert(
        `Servis Detayı`,
        `Müşteri: ${atama.customerName}\nEkip: ${atama.ekip}\nTarih: ${atama.tarih.toLocaleDateString("tr-TR")}\nSaat: ${atama.startTime}\nSüre: ${atama.duration}\nTür: ${atama.tur}\nNotlar: ${atama.notes}`
      );
    }
  };

  const handleYeniServisEkle = () => {
    if (!newServiceName.trim()) {
      Alert.alert("Uyarı", "Servis adı girin.");
      return;
    }
    setServiceTypes((prev) => [...prev, newServiceName.trim()]);
    setSelectedService(newServiceName.trim());
    setNewServiceName("");
    setNewServiceModal(false);
  };

  const handleYeniMusteriEkle = () => {
    if (!newCustomerName.trim()) {
      Alert.alert("Uyarı", "Müşteri adı zorunludur.");
      return;
    }
    const yeni: Customer = {
      id: Math.max(...customers.map((m) => m.id), 0) + 1,
      companyName: newCustomerName.trim(),
      contactPerson: newCustomerContact.trim() || "-",
    };
    setCustomers((prev) => [...prev, yeni]);
    setSelectedCustomer(yeni);
    setCustomerSearch(yeni.companyName);
    setNewCustomerName("");
    setNewCustomerContact("");
    setNewCustomerModal(false);
  };

  const handleAppointmentSave = () => {
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
    const yeni: Appointment = {
      id: Date.now(),
      customerName: customerName,
      ekip: team?.name || "",
      ekipId: selectedTeamId,
      tarih: selectedDate,
      startTime: timeInput,
      duration: selectedDuration,
      tur: selectedService,
      notes: notlar,
    };
    setAppointments((prev) => [...prev, yeni]);
    setAppointmentModal(false);
  };

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
              <Text
                className={`text-xs font-medium ${
                  mode === m ? "text-white" : "text-gray-400"
                }`}
              >
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

        <View className="bg-[#111] rounded-2xl border border-[#1F1F1F] overflow-hidden mb-6">
          <Calendar
            mode={mode}
            events={events}
            height={500}
            swipeEnabled
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
                setNewTeamMembers("");
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
                      className="p-1 rounded-lg"
                      onPress={() => handleTeamDelete(team.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
                        className="p-1 rounded-lg"
                        onPress={() => handlePersonelCikarAc(team.id)}
                      >
                        <Ionicons name="person-remove-outline" size={20} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="p-1 rounded-lg"
                        onPress={() => handlePersonelEkleAc(team.id)}
                      >
                        <Ionicons name="person-add-outline" size={20} color="#3B82F6" />
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
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Lider adını girin"
                placeholderTextColor="#555"
                value={newTeamLeader}
                onChangeText={setNewTeamLeader}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Personeller (virgülle ayırın)</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-4"
                placeholder="Mehmet, Ayşe, Ali"
                placeholderTextColor="#555"
                value={newTeamMembers}
                onChangeText={setNewTeamMembers}
              />
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

        <Modal visible={appointmentModal} transparent animationType="fade" onRequestClose={() => setAppointmentModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">Servis Atama</Text>
                <TouchableOpacity onPress={() => setAppointmentModal(false)}>
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
                        <Text
                          className={`text-xs ${
                            selectedDuration === s.value ? "text-[#3B82F6]" : "text-gray-400"
                          }`}
                        >
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
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: t.color }}
                        />
                        <Text
                          className={`text-xs ${
                            selectedTeamId === t.id ? "text-[#3B82F6]" : "text-gray-400"
                          }`}
                        >
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
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setAppointmentModal(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={handleAppointmentSave}
                >
                  <Text className="text-white font-medium">Atama Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={newServiceModal} transparent animationType="fade" onRequestClose={() => setNewServiceModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-4">
              <Text className="text-white text-lg font-bold mb-4">Yeni Servis Türü</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-4"
                placeholder="Servis adı girin"
                placeholderTextColor="#555"
                value={newServiceName}
                onChangeText={setNewServiceName}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setNewServiceModal(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={handleYeniServisEkle}
                >
                  <Text className="text-white font-medium">Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={newCustomerModal} transparent animationType="fade" onRequestClose={() => setNewCustomerModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-md p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-bold">Yeni Müşteri</Text>
                <TouchableOpacity onPress={() => setNewCustomerModal(false)}>
                  <Ionicons name="close" size={24} color="#555" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 text-xs font-medium mb-1">Müşteri Adı</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-3"
                placeholder="Müşteri adı"
                placeholderTextColor="#555"
                value={newCustomerName}
                onChangeText={setNewCustomerName}
              />
              <Text className="text-gray-400 text-xs font-medium mb-1">Sorumlu Kişi</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-4"
                placeholder="Sorumlu kişi (opsiyonel)"
                placeholderTextColor="#555"
                value={newCustomerContact}
                onChangeText={setNewCustomerContact}
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => setNewCustomerModal(false)}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={handleYeniMusteriEkle}
                >
                  <Text className="text-white font-medium">Ekle</Text>
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
                    m.contactPerson.toLowerCase().includes(customerSearch.toLowerCase())
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
                      const gecici: Customer = {
                        id: Date.now(),
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
              <TouchableOpacity
                className="flex-row items-center justify-center h-10 bg-[#3B82F6]/10 rounded-lg mt-3"
                onPress={() => {
                  setServiceDropdownOpen(false);
                  setNewServiceName("");
                  setNewServiceModal(true);
                }}
              >
                <Ionicons name="add" size={18} color="#3B82F6" />
                <Text className="text-[#3B82F6] text-sm font-medium ml-2">Yeni Servis Türü Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={memberModal} transparent animationType="fade" onRequestClose={() => setMemberModal(false)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-4">
              <Text className="text-white text-lg font-bold mb-4">Personel Ekle</Text>
              <TextInput
                className="w-full h-10 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 text-white text-sm mb-4"
                placeholder="Personel adını girin"
                placeholderTextColor="#555"
                value={memberInput}
                onChangeText={setMemberInput}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => {
                    setMemberModal(false);
                    setMemberInput("");
                    setMemberAddTeamId(null);
                  }}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#3B82F6] rounded-lg items-center justify-center"
                  onPress={handlePersonelEkle}
                >
                  <Text className="text-white font-medium">Ekle</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={memberRemoveModal} transparent animationType="fade" onRequestClose={() => { setMemberRemoveModal(false); setRemoveTeamId(null); setSelectedMembers([]); }}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <View className="bg-[#1A1A1A] rounded-2xl w-11/12 max-w-sm p-4">
              <Text className="text-white text-lg font-bold mb-4">Personel Çıkar</Text>
              <Text className="text-gray-400 text-sm mb-3">Çıkarmak istediğiniz personeli seçin:</Text>
              <ScrollView className="max-h-60">
                {teams
                  .find((t) => t.id === removeTeamId)
                  ?.members.map((p) => (
                    <TouchableOpacity
                      key={p}
                      className={`flex-row items-center justify-between py-3 px-2 border-b border-[#2A2A2A] ${selectedMembers.includes(p) ? "bg-[#3B82F6]/10" : ""}`}
                      onPress={() => togglePersonelSec(p)}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className={`w-5 h-5 rounded border items-center justify-center ${selectedMembers.includes(p) ? "bg-[#3B82F6] border-[#3B82F6]" : "border-[#555]"}`}>
                          {selectedMembers.includes(p) && (
                            <Ionicons name="checkmark" size={14} color="white" />
                          )}
                        </View>
                        <Text className="text-white text-sm">{p}</Text>
                      </View>
                      <Ionicons name="remove-circle-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              <View className="flex-row gap-3 mt-3">
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#2A2A2A] rounded-lg items-center justify-center"
                  onPress={() => {
                    setMemberRemoveModal(false);
                    setRemoveTeamId(null);
                    setSelectedMembers([]);
                  }}
                >
                  <Text className="text-gray-300 font-medium">İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-10 bg-[#EF4444] rounded-lg items-center justify-center"
                  onPress={handleSelectedRemove}
                >
                  <Text className="text-white font-medium">Seçilenleri Çıkar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}
