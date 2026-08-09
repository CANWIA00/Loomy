import { View, Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import type { Appointment } from "../../api/appointments";
import type { ScheduleEvent } from "./types";

const CELL_HEIGHT = Math.max(500 - 30, 1200) / 24;

interface ScheduleEventCardProps {
  event: ScheduleEvent;
  touchableOpacityProps: any;
  containerWidth: number;
  mode: string;
  originalAppointment: Appointment | undefined;
  onDragEnd: (eventId: number, newStartTime: string, newDate: string) => void;
  onPressEvent: (event: ScheduleEvent) => void;
}

export default function ScheduleEventCard({
  event,
  touchableOpacityProps,
  containerWidth,
  mode,
  originalAppointment,
  onDragEnd,
  onPressEvent,
}: ScheduleEventCardProps) {
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
      const minuteDelta = Math.round((translateY.value / CELL_HEIGHT) * 60 / 15) * 15;

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
