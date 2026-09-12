import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Line, Polyline, Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export interface FinanceChartSeries {
  name: string;
  color: string;
  values: number[];
}

const PLOT_H = 140;
const pad = { top: 8, right: 6, bottom: 4, left: 6 };

function compact(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e6) return "₺" + (abs / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return "₺" + (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "₺" + String(Math.round(abs));
}

function shortLabel(period: string): string {
  const [y, m] = period.split("-");
  return m + "/" + (y ? y.slice(2) : "");
}

export default function FinanceChart({ periods, series }: { periods: string[]; series: FinanceChartSeries[] }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();

  const chartW = Math.min(width - 64, 1024);
  const innerW = chartW - pad.left - pad.right;
  const innerH = PLOT_H - pad.top - pad.bottom;

  const count = periods.length;
  const maxV = Math.max(1, ...series.flatMap((s) => s.values));
  const slots = Math.max(1, count - 1);
  const stepX = innerW / slots;

  const grid = [1, 0.5, 0];
  const gridLines = grid.map((g) => ({
    y: pad.top + innerH - g * innerH,
    label: compact(maxV * g),
    dashed: g !== 0 && g !== 1,
  }));
  const labelEvery = count > 8 ? 2 : 1;

  return (
    <View className="mt-3 overflow-hidden" style={{ backgroundColor: colors.bgCard2, borderRadius: 12 }}>
      <View className="px-3 pt-3 pb-1">
        <Text className="text-[10px] font-medium" style={{ color: colors.textMuted }}>{t("pay.financeChart")}</Text>
        <Text className="text-[8px]" style={{ color: colors.textMuted }}>{t("pay.financeChartNote")}</Text>
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

        {series.map((s) => (
          <Polyline
            key={s.name}
            points={s.values
              .map((v, i) => {
                const x = pad.left + i * stepX;
                const y = pad.top + innerH - (v / maxV) * innerH;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
          />
        ))}
        {series.map((s) =>
          s.values.map((v, i) => (
            <Circle
              key={s.name + i}
              cx={pad.left + i * stepX}
              cy={pad.top + innerH - (v / maxV) * innerH}
              r={2.5}
              fill={s.color}
              stroke={colors.bgCard2}
              strokeWidth={1}
            />
          ))
        )}
      </Svg>

      <View className="flex-row px-3 pb-2 flex-wrap">
        {series.map((s) => (
          <View key={s.name} className="flex-row items-center mr-3 mb-1">
            <View style={{ width: 8, height: 3, borderRadius: 1.5, backgroundColor: s.color, marginRight: 4 }} />
            <Text className="text-[9px]" style={{ color: colors.textSecondary }} numberOfLines={1}>{s.name}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row px-3 pb-3">
        {periods.map((p, i) =>
          i % labelEvery === 0 ? (
            <View key={p} className="flex-1 items-center">
              <Text className="text-[8px]" style={{ color: colors.textMuted }}>{shortLabel(p)}</Text>
            </View>
          ) : null
        )}
      </View>
    </View>
  );
}