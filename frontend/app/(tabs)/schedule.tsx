import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { Calendar } from "react-native-big-calendar";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { ScheduleProvider, useSchedule } from "../../components/schedule/ScheduleContext";
import ScreenHeader from "../../components/ScreenHeader";
import TeamsSection from "../../components/schedule/TeamsSection";
import CalendarToolbar from "../../components/schedule/CalendarToolbar";
import CalendarNavigator from "../../components/schedule/CalendarNavigator";
import MonthGrid from "../../components/schedule/MonthGrid";
import PlanList from "../../components/schedule/PlanList";
import ScheduleEventCard from "../../components/schedule/ScheduleEventCard";
import TrWeekHeader from "../../components/schedule/TrWeekHeader";
import ConfirmModal from "../../components/schedule/ConfirmModal";
import TeamModal from "../../components/schedule/modals/TeamModal";
import TeamFilterModal from "../../components/schedule/modals/TeamFilterModal";
import AppointmentModal from "../../components/schedule/modals/AppointmentModal";
import CustomerSelectModal from "../../components/schedule/modals/CustomerSelectModal";
import ServiceSelectModal from "../../components/schedule/modals/ServiceSelectModal";
import AddMemberModal from "../../components/schedule/modals/AddMemberModal";
import RemoveMembersModal from "../../components/schedule/modals/RemoveMembersModal";
import DayListModal from "../../components/schedule/modals/DayListModal";
import AppointmentDetailModal from "../../components/schedule/modals/AppointmentDetailModal";
import CustomAlert from "../../components/CustomAlert";
import type { ScheduleEvent } from "../../components/schedule/types";

function ScheduleScreenInner() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    loading,
    events,
    mode,
    calendarDate,
    appointments,
    containerWidth,
    setContainerWidth,
    openDetailFromEvent,
    handleDragEnd,
    openNewAppointment,
    alert,
    setAlertVisible,
    deleteTeamConfirmVisible,
    closeDeleteTeamConfirm,
    confirmDeleteTeam,
    appointmentDeleteConfirmVisible,
    closeAppointmentDeleteConfirm,
    confirmDeleteAppointment,
    deleteLoading,
  } = useSchedule();

  const now = new Date();
  const scrollOffset = now.getHours() * 60 + now.getMinutes() - 30;

  const calendarLocale = {
    monthNames: [t("month.january"), t("month.february"), t("month.march"), t("month.april"), t("month.may"), t("month.june"), t("month.july"), t("month.august"), t("month.september"), t("month.october"), t("month.november"), t("month.december")],
    monthNamesShort: [t("month.january").substring(0, 3), t("month.february").substring(0, 3), t("month.march").substring(0, 3), t("month.april").substring(0, 3), t("month.may").substring(0, 3), t("month.june").substring(0, 3), t("month.july").substring(0, 3), t("month.august").substring(0, 3), t("month.september").substring(0, 3), t("month.october").substring(0, 3), t("month.november").substring(0, 3), t("month.december").substring(0, 3)],
    dayNames: [t("day.monday"), t("day.tuesday"), t("day.wednesday"), t("day.thursday"), t("day.friday"), t("day.saturday"), t("day.sunday")],
    dayNamesShort: [t("dayShort.mon"), t("dayShort.tue"), t("dayShort.wed"), t("dayShort.thu"), t("dayShort.fri"), t("dayShort.sat"), t("dayShort.sun")],
    today: t("dash.today"),
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} indicatorStyle={colors.indicatorBg as any}>
      <View className="w-full max-w-6xl mx-auto px-4 pt-4 pb-8">
        <ScreenHeader title={t("sch.title")} subtitle={t("sch.subtitle")} />
        <TeamsSection />
        <CalendarToolbar />
        <CalendarNavigator />

        <View className="rounded-2xl border overflow-hidden mb-6" style={{ backgroundColor: colors.bgCard2, borderColor: colors.borderAlt }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          {mode === "month" ? (
            <MonthGrid />
          ) : (
            <Calendar
              date={calendarDate}
              mode={mode}
              events={events}
              height={500}
              swipeEnabled={false}
              scrollOffsetMinutes={scrollOffset}
              onPressCell={openNewAppointment}
              onPressEvent={openDetailFromEvent}
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
                  <ScheduleEventCard
                    event={event}
                    touchableOpacityProps={touchableOpacityProps}
                    containerWidth={containerWidth}
                    mode={mode}
                    originalAppointment={originalAppointment}
                    onDragEnd={handleDragEnd}
                    onPressEvent={openDetailFromEvent}
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

        <PlanList />

        <TeamModal />
        <TeamFilterModal target="calendar" />
        <TeamFilterModal target="list" />
        <AppointmentModal />
        <CustomerSelectModal />
        <ServiceSelectModal />
        <AddMemberModal />
        <RemoveMembersModal />
        <DayListModal />
        <AppointmentDetailModal />

        <ConfirmModal
          visible={deleteTeamConfirmVisible}
          title={t("sch.teamDelete")}
          message={t("sch.teamDeleteMsg")}
          confirmLabel={t("sch.yesDelete")}
          cancelLabel={t("sch.cancel")}
          loading={deleteLoading}
          onCancel={closeDeleteTeamConfirm}
          onConfirm={confirmDeleteTeam}
        />
        <ConfirmModal
          visible={appointmentDeleteConfirmVisible}
          title={t("sch.planDelete")}
          message={t("sch.planDeleteMsg")}
          confirmLabel={t("sch.yesDelete")}
          cancelLabel={t("sch.cancel")}
          loading={deleteLoading}
          onCancel={closeAppointmentDeleteConfirm}
          onConfirm={confirmDeleteAppointment}
        />

        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    </ScrollView>
  );
}

export default function ScheduleScreen() {
  return (
    <ScheduleProvider>
      <ScheduleScreenInner />
    </ScheduleProvider>
  );
}
