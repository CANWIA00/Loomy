import React from "react";
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  logoTitle?: string;
  hideTopBar?: boolean;
  customLogo?: React.ReactNode;
  rightButton?: { label: string; onPress: () => void };
}

export default function AuthLayout({
  children,
  title,
  logoTitle = "Loomy",
  hideTopBar,
  customLogo,
  rightButton,
}: AuthLayoutProps) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { lang, setLanguage } = useLanguage();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-10">
          <View className="w-full max-w-sm mx-auto">
            {!hideTopBar && (
              <View className="flex-row items-center justify-between mb-8">
                <TouchableOpacity onPress={toggleTheme}>
                  <Ionicons
                    name={isDark ? "sunny-outline" : "moon-outline"}
                    size={22}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <View className="items-center flex-1 mx-3">
                  {customLogo ?? (
                    <Image
                      source={
                        isDark
                          ? require("../../assets/loomy-dark.png")
                          : require("../../assets/loomy-light.png")
                      }
                      style={{ width: 88, height: 88 }}
                      className="rounded-2xl mb-4"
                      resizeMode="contain"
                    />
                  )}
                  <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">
                    {logoTitle}
                  </Text>
                  {title ? (
                    <Text style={{ color: colors.textMuted }} className="text-sm mt-1.5 tracking-wide">
                      {title}
                    </Text>
                  ) : null}
                </View>
                {rightButton ? (
                  <TouchableOpacity
                    onPress={rightButton.onPress}
                    style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                      {rightButton.label}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setLanguage(lang === "tr" ? "en" : "tr")}
                    style={{ backgroundColor: colors.bgCard2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
                      {lang === "tr" ? "EN" : "TR"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
