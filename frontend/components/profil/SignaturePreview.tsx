import { Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../contexts/ThemeContext";

interface SignaturePreviewProps {
  signature: string;
  onPress: () => void;
}

export default function SignaturePreview({ signature, onPress }: SignaturePreviewProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ backgroundColor: colors.bgInput, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
        {(() => {
          try {
            const parsed = JSON.parse(signature);
            const pts = Array.isArray(parsed) && parsed.length > 0
              ? (Array.isArray(parsed[0]) ? parsed : [parsed])
              : [];
            if (pts.length === 0) return <Text style={{ color: colors.textSecondary, fontSize: 12 }}>-</Text>;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            pts.forEach((path: any[]) => {
              path.forEach((p: any) => {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
              });
            });
            const pad = 10;
            const vw = maxX - minX + pad * 2;
            const vh = maxY - minY + pad * 2;
            return (
              <Svg width={100} height={28} viewBox={`${minX - pad} ${minY - pad} ${vw} ${vh}`}>
                {pts.map((path: any[], i: number) => {
                  if (!path || path.length === 0) return null;
                  const d = path.map((p: any, j: number) =>
                    j === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                  ).join(" ");
                  return <Path key={i} d={d} stroke={colors.text} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
                })}
              </Svg>
            );
          } catch { return <Text style={{ color: colors.textSecondary, fontSize: 12 }}>-</Text>; }
        })()}
      </View>
    </TouchableOpacity>
  );
}
