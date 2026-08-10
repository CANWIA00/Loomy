import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export default function FormField({
  label,
  error,
  hint,
  style,
  secureTextEntry,
  ...inputProps
}: FormFieldProps) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = Boolean(secureTextEntry);

  return (
    <View>
      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium mb-1">
        {label}
      </Text>
      <View className="relative">
        <TextInput
          secureTextEntry={isPassword && !showPassword}
          className="w-full h-11 rounded-lg px-4 text-base"
          style={[
            {
              backgroundColor: colors.bgCard,
              color: colors.text,
              borderColor: error ? colors.danger : colors.border,
              borderWidth: 1,
              paddingRight: isPassword ? 44 : undefined,
            },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          {...inputProps}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text> : null}
      {!error && hint ? (
        <Text style={{ color: colors.textMuted }} className="text-xs mt-1.5 ml-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
