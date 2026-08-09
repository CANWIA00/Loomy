import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, PanResponder } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface SignaturePadProps {
  onSave: (paths: any[]) => void;
  onClose: () => void;
  initialSignature?: string | null;
}

export default function SignaturePad({ onSave, onClose, initialSignature }: SignaturePadProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [paths, setPaths] = useState<any[][]>([]);
  const [containerSize, setContainerSize] = useState({ width: 300, height: 200 });
  const currentPointsRef = useRef<any[]>([]);
  const allPathsRef = useRef<any[][]>([]);
  const [, forceRender] = useState(0);

  const parseInitial = (): any[][] => {
    if (!initialSignature) return [];
    try {
      const parsed = JSON.parse(initialSignature);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      if (Array.isArray(parsed[0])) return parsed;
      if (parsed[0] && typeof parsed[0].x === "number") return [parsed];
      return [];
    } catch {
      return [];
    }
  };

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
      Alert.alert(t("common.warning"), t("prf.signRequired"));
      return;
    }
    onSave(allPathsRef.current);
  };

  useEffect(() => {
    const initial = parseInitial();
    if (initial.length > 0) {
      allPathsRef.current = initial;
      setPaths([...initial]);
    }
  }, [initialSignature]);

  return (
    <>
      <View
        style={{ backgroundColor: colors.bgCard2, borderColor: colors.border, borderWidth: 1, borderRadius: 8, height: 224, alignItems: "center", justifyContent: "center" }}
        onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && currentPointsRef.current.length === 0 && (
          <Text style={{ color: colors.textMuted, fontSize: 14, position: "absolute" }}>{t("prf.signHere")}</Text>
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
          style={{ flex: 1, height: 40, backgroundColor: colors.bgInput, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
          onPress={handleClear}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: "500" }}>{t("prf.clear")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, height: 40, backgroundColor: colors.primary, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
          onPress={handleSave}
        >
          <Text style={{ color: "white", fontWeight: "500" }}>{t("prf.save")}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
