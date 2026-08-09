import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "../../../contexts/ThemeContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useSchedule } from "../ScheduleContext";
import ModalShell from "../ModalShell";

interface TeamFilterModalProps {
  target: "calendar" | "list";
}

export default function TeamFilterModal({ target }: TeamFilterModalProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {
    teamFilterTarget,
    closeTeamFilter,
    teams,
    selectedTeamFilter,
    setSelectedTeamFilter,
    listTeamFilter,
    setListTeamFilter,
  } = useSchedule();

  const visible = teamFilterTarget === target;
  const current = target === "calendar" ? selectedTeamFilter : listTeamFilter;
  const setCurrent = target === "calendar" ? setSelectedTeamFilter : setListTeamFilter;

  return (
    <ModalShell
      visible={visible}
      onRequestClose={closeTeamFilter}
      onBackdropPress={closeTeamFilter}
      maxWidth="max-w-64"
      padded={false}
    >
      <ScrollView className="max-h-60" nestedScrollEnabled bounces={false}>
        <TouchableOpacity
          className="px-4 py-3 border-b"
          style={{ borderColor: colors.border }}
          onPress={() => {
            setCurrent(t("sch.allTeams"));
            closeTeamFilter();
          }}
        >
          <Text className="text-sm" style={{ color: current === t("sch.allTeams") ? colors.primary : colors.text, fontWeight: current === t("sch.allTeams") ? '600' : '400' }}>
            {t("sch.allTeams")}
          </Text>
        </TouchableOpacity>
        {teams.map((tm) => (
          <TouchableOpacity
            key={tm.id}
            className="px-4 py-3 border-b flex-row items-center"
            style={{ borderColor: colors.border }}
            onPress={() => {
              setCurrent(tm.name);
              closeTeamFilter();
            }}
          >
            <View
              className="w-2.5 h-2.5 rounded-full mr-3"
              style={{ backgroundColor: tm.color }}
            />
            <Text className="text-sm" style={{ color: current === tm.name ? colors.primary : colors.text, fontWeight: current === tm.name ? '600' : '400' }}>
              {tm.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ModalShell>
  );
}
