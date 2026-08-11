import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import SvgAwareImage from "../SvgAwareImage";

interface LogoPickerProps {
  uri: string;
  onPress: () => void;
  label: string;
  hint: string;
}

export default function LogoPicker({ uri, onPress, label, hint }: LogoPickerProps) {
  const { colors } = useTheme();

  return (
    <View className="items-center">
      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
        {label}
      </Text>
      <TouchableOpacity onPress={onPress} className="mt-1">
        <SvgAwareImage
          uri={uri}
          style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.bgInput }}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5">
        {hint}
      </Text>
    </View>
  );
}
