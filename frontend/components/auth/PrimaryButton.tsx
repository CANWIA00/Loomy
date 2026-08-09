import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface PrimaryButtonProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline";
  onPress?: () => void;
}

export default function PrimaryButton({
  title,
  loading,
  disabled,
  variant = "primary",
  onPress,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  if (variant === "outline") {
    return (
      <TouchableOpacity
        className="w-full h-12 rounded-lg items-center justify-center"
        style={{ backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }}
        onPress={onPress}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text
            style={{ color: isDisabled ? colors.textMuted : colors.primary }}
            className="font-medium text-base"
          >
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="w-full h-12 rounded-lg items-center justify-center"
      style={{ backgroundColor: colors.primary }}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base">{title}</Text>
      )}
    </TouchableOpacity>
  );
}
