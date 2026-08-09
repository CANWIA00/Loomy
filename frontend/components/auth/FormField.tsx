import { View, Text, TextInput } from "react-native";
import type { TextInputProps } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export default function FormField({ label, error, hint, style, ...inputProps }: FormFieldProps) {
  const { colors } = useTheme();

  return (
    <View>
      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
        {label}
      </Text>
      <TextInput
        className="w-full h-11 rounded-lg px-4 text-base"
        style={[
          {
            backgroundColor: colors.bgCard,
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {error ? <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text> : null}
      {!error && hint ? (
        <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5 ml-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
