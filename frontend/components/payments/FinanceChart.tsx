import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Line, Polyline, Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export type FinanceChartPoint = { label: string; value: number; color: string };

const PLOT_H = 120;
const pad = { top: 8, right: 6, bottom: 4, left: 6 };

function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e6) return "₺" + (abs / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return "₺" + (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "₺" + String(Math.round(abs));
}

export default function FinanceChart({ points }: { points: FinanceChartPoint[] }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();

  const chartW = Math.min(width - 64, 1024);
  const innerW = chartW - pad.left - pad.right;
  const innerH = PLOT_H - pad.top - pad.bottom;

  const maxV = Math.max(1, ...points.map((p) => p.value));
  const slots = Math.max(1, points.length - 1);
  const stepX = innerW / slots;

  const coords = points.map((p, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - (p.value / maxV) * innerH,
  }));

  const grid = [1, 0.5, 0];
  const gridLines = grid.map((g) => ({
    y: pad.top + innerH - g * innerH,
    label: compact(maxV * g),
    dashed: g !== 0 && g !== 1,
  }));

  return (
    <View className="mt-3 overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderRadius: 12 }}>
      <View className="px-3 pt-3 pb-1">
        <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>{t("pay.financeChart")}</Text>
      </View>

      <Svg width={chartW} height={PLOT_H}>
        {gridLines.map((l, i) => (
          <Line
            key={i}
            x1={pad.left}
            y1={l.y}
            x2={chartW - pad.right}
            y2={l.y}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray={l.dashed ? "4 4" : undefined}
          />
        ))}
        {gridLines.map((l, i) => (
          <SvgText
            key={i}
            x={chartW - pad.right}
            y={l.y - 2}
            fontSize={8}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {l.label}
          </SvgText>
        ))}
        {points.length > 1 && (
          <Polyline
            points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          />
        )}
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={4} fill={points[i].color} stroke={colors.bgCard2} strokeWidth={1.5} />
        ))}
      </Svg>

      <View className="flex-row px-3 pb-3">
        {points.map((p, i) => (
          <View key={i} className="flex-1 items-center">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.color, marginBottom: 2 }} />
            <Text className="text-[9px]" style={{ color: colors.textSecondary, textAlign: "center" }} numberOfLines={1}>
              {p.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}