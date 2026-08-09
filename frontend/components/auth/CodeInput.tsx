import { forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import type { TextInput as TextInputType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../contexts/ThemeContext";

const CODE_LENGTH = 6;

export interface CodeInputHandle {
  focusFirst: () => void;
}

interface CodeInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  pasteLabel: string;
}

const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(
  ({ value, onChange, pasteLabel }, ref) => {
    const { colors } = useTheme();
    const inputRefs = useRef<(TextInputType | null)[]>([]);

    useImperativeHandle(ref, () => ({
      focusFirst: () => inputRefs.current[0]?.focus(),
    }));

    const handleCodeChange = (text: string, index: number) => {
      const cleaned = text.replace(/[^0-9]/g, "");

      if (cleaned.length > 1) {
        const digits = cleaned.slice(0, CODE_LENGTH).split("");
        const newCode = [...value];
        digits.forEach((d, i) => {
          if (index + i < CODE_LENGTH) newCode[index + i] = d;
        });
        onChange(newCode);
        const focusIdx = Math.min(index + digits.length, CODE_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
        return;
      }

      const newCode = [...value];
      newCode[index] = cleaned;
      onChange(newCode);

      if (cleaned && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyPress = (key: string, index: number) => {
      if (key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newCode = [...value];
        newCode[index - 1] = "";
        onChange(newCode);
      }
    };

    const handlePaste = async () => {
      const clipboardText = await Clipboard.getStringAsync();
      const digits = clipboardText.replace(/\D/g, "").slice(0, CODE_LENGTH);
      if (digits.length === 0) return;
      const newCode = digits
        .split("")
        .concat(Array(CODE_LENGTH - digits.length).fill(""));
      onChange(newCode);
      const focusIndex = Math.min(digits.length, CODE_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    };

    return (
      <>
        <View className="flex-row justify-center gap-3 mb-4">
          {value.map((digit, index) => (
            <TextInput
              key={index}
              ref={(refEl) => {
                inputRefs.current[index] = refEl;
              }}
              className="w-12 h-14 rounded-lg text-center text-xl font-bold"
              style={{
                backgroundColor: colors.bgCard,
                color: colors.text,
                borderColor: colors.border,
                borderWidth: 1.5,
              }}
              maxLength={CODE_LENGTH}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              selectTextOnFocus
            />
          ))}
        </View>
        <TouchableOpacity
          className="flex-row items-center justify-center mb-6 py-2"
          onPress={handlePaste}
        >
          <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="text-sm font-medium ml-1.5">
            {pasteLabel}
          </Text>
        </TouchableOpacity>
      </>
    );
  }
);

CodeInput.displayName = "CodeInput";

export default CodeInput;
