import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgCard2: string;
  bgInput: string;
  border: string;
  borderAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  warning: string;
  danger: string;
  purple: string;
  teal: string;
  pink: string;
  indicatorBg: string;
}

const darkColors: ThemeColors = {
  bg: "#181828",
  bgCard: "#222238",
  bgCard2: "#1E1E30",
  bgInput: "#303048",
  border: "#303048",
  borderAlt: "#2A2A44",
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  primary: "#6080FF",
  primaryLight: "#6080FF",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8060FF",
  teal: "#10B981",
  pink: "#EC4899",
  indicatorBg: "white",
};

const lightColors: ThemeColors = {
  bg: "#FFFFFF",
  bgCard: "#F6F7FB",
  bgCard2: "#EDEEF4",
  bgInput: "#EEF0F6",
  border: "#DEE1EA",
  borderAlt: "#CDD1DC",
  text: "#232C42",
  textSecondary: "#5A6478",
  textMuted: "#8C93A6",
  primary: "#7A6CFD",
  primaryLight: "#7A6CFD",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#7A6CFD",
  teal: "#10B981",
  pink: "#EC4899",
  indicatorBg: "#232C42",
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("theme").then((v) => {
      if (v === "light") setIsDark(false);
      else setIsDark(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
