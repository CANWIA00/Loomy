import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface SignaturePadProps {
  onSave: (paths: any[]) => void;
}

export default function SignaturePad({ onSave }: SignaturePadProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [paths, setPaths] = useState<any[][]>([]);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });
  const currentPointsRef = useRef<any[]>([]);
  const allPathsRef = useRef<any[][]>([]);
  const [, forceRender] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        currentPointsRef.current = [{ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY }];
      },
      onPanResponderMove: (evt) => {
        currentPointsRef.current = [
          ...currentPointsRef.current,
          { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY },
        ];
        forceRender((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          allPathsRef.current = [...allPathsRef.current, [...currentPointsRef.current]];
          setPaths([...allPathsRef.current]);
        }
        currentPointsRef.current = [];
      },
    }),
  ).current;

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
  };

  const handleClear = () => {
    currentPointsRef.current = [];
    allPathsRef.current = [];
    setPaths([]);
    forceRender((n) => n + 1);
  };

  const handleSave = () => {
    if (allPathsRef.current.length === 0) {
      Alert.alert(t("svc.warning"), t("svc.signatureWarning"));
      return;
    }
    onSave(allPathsRef.current);
  };

  return (
    <>
      <View
        className="border rounded-lg h-56 items-center justify-center"
        style={{ backgroundColor: colors.bgCard2, borderColor: colors.border }}
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && currentPointsRef.current.length === 0 && (
          <Text className="text-sm absolute" style={{ color: colors.textMuted }}>{t("svc.signHere")}</Text>
        )}
        <Svg width="100%" height="100%" viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}>
          {paths.map((points, i) => (
            <Path key={i} d={pointsToPath(points)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {currentPointsRef.current.length > 0 && (
            <Path d={pointsToPath(currentPointsRef.current)} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </Svg>
      </View>
      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.bgInput }}
          onPress={handleClear}
        >
          <Text className="font-medium" style={{ color: colors.textSecondary }}>{t("svc.clear")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleSave}
        >
          <Text className="font-medium" style={{ color: "white" }}>{t("common.confirm")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
