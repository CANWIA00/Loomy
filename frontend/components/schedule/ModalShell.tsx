import type { ReactNode } from "react";
import { Modal, TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface ModalShellProps {
  visible: boolean;
  onRequestClose: () => void;
  onBackdropPress?: () => void;
  maxWidth?: string;
  padded?: boolean;
  children: ReactNode;
}

export default function ModalShell({
  visible,
  onRequestClose,
  onBackdropPress,
  maxWidth = "max-w-md",
  padded = true,
  children,
}: ModalShellProps) {
  const { colors } = useTheme();

  const panel = (
    <View className={`rounded-2xl w-11/12 ${maxWidth} ${padded ? "p-4" : ""}`} style={{ backgroundColor: colors.bgCard }}>
      {children}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {onBackdropPress ? (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onBackdropPress}>
          {panel}
        </TouchableOpacity>
      ) : (
        <View style={styles.overlay}>{panel}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
  },
});
