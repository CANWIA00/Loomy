import { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
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

  const strokeWidthFor = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const d = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
    return Math.max(1, Math.min(4, 2.8 + 60 / d));
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
          {paths.flatMap((points, si) => {
            const segs: ReactElement[] = [];
            for (let i = 0; i < points.length - 1; i++) {
              segs.push(
                <Path
                  key={`${si}-${i}`}
                  d={`M ${points[i].x} ${points[i].y} L ${points[i + 1].x} ${points[i + 1].y}`}
                  stroke={colors.primary}
                  strokeWidth={strokeWidthFor(points[i], points[i + 1])}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }
            return segs;
          })}
          {currentPointsRef.current.length > 1 &&
            (() => {
              const segs: ReactElement[] = [];
              const pts = currentPointsRef.current;
              for (let i = 0; i < pts.length - 1; i++) {
                segs.push(
                  <Path
                    key={`cur-${i}`}
                    d={`M ${pts[i].x} ${pts[i].y} L ${pts[i + 1].x} ${pts[i + 1].y}`}
                    stroke={colors.primary}
                    strokeWidth={strokeWidthFor(pts[i], pts[i + 1])}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              }
              return segs;
            })()}
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
