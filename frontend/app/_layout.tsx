import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import InstallPwaBanner from "../components/InstallPwaBanner";

function RootLayoutInner() {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
      edges={Platform.OS === "web" ? ["top"] : ["top", "bottom", "left", "right"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="templates" />
        <Stack.Screen name="company" />
        <Stack.Screen name="dev" />
        <Stack.Screen name="customer-detail" />
      </Stack>
      <InstallPwaBanner />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <RootLayoutInner />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
