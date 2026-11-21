import { useEffect, useRef } from "react";
import { Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Masaustu satir islemi: 32px dokunma alani, ustune gelince vurgu ve tarayicinin
 * kendi ipucu balonu (title). Liste kaydirma alaninin icinde kirpilmasin diye
 * ozel bir balon yerine yerel title kullanilir.
 */
export default function RowAction({ icon, color, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const ref = useRef<any>(null);
  useEffect(() => {
    if (Platform.OS === "web" && ref.current?.setAttribute) ref.current.setAttribute("title", label);
  }, [label]);
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ hovered, pressed }: any) => ({
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: hovered || pressed ? colors.bgInput : "transparent",
      })}
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}

