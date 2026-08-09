import { View, Text, Image, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

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
        <Image
          source={{ uri }}
          className="w-20 h-20 rounded-xl"
          style={{ backgroundColor: colors.bgInput }}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5">
        {hint}
      </Text>
    </View>
  );
}
