import { View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface AnimatedBarProps {
  percentage: number;
  color: string;
}

export default function AnimatedBar({ percentage, color }: AnimatedBarProps) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bgInput }} className="rounded-full h-2 overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          backgroundColor: color,
          width: `${Math.min(Math.max(percentage, 0), 100)}%`,
        }}
      />
    </View>
  );
}
