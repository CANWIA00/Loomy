import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";

function RootLayoutInner() {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="dev" />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
