import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PlatformKind = "ios" | "android" | "desktop";

function detectPlatform(): PlatformKind {
  if (Platform.OS !== "web") return "desktop";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstallPwaBanner() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);

  const platform = detectPlatform();

  useEffect(() => {
    if (Platform.OS !== "web") return;

    let shownOnce = false;
    const show = () => {
      if (!shownOnce) {
        shownOnce = true;
        setVisible(true);
      }
    };

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      show();
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    const timer = setTimeout(show, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  if (Platform.OS !== "web") return null;
  if (!visible || installed) return null;

  const title = deferred
    ? t("pwa.installTitle")
    : platform === "ios"
      ? t("pwa.iOSTitle")
      : t("pwa.installTitle");

  const desc = deferred
    ? t("pwa.installDesc")
    : platform === "ios"
      ? t("pwa.iOSDesc")
      : platform === "android"
        ? t("pwa.androidDesc")
        : t("pwa.desktopDesc");

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setVisible(false);
      }
    } catch {
      setVisible(false);
    } finally {
      setDeferred(null);
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: 12,
        display: "flex",
        alignItems: "center",
      }}
    >
      <View
        style={{
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
          maxWidth: 420,
          width: "100%",
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ color: colors.text, fontWeight: "700", fontSize: 15 }}>{title}</Text>
          <Pressable onPress={() => setVisible(false)} hitSlop={8} style={{ padding: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 19, marginBottom: 12 }}>{desc}</Text>
        {deferred && (
          <Pressable
            onPress={handleInstall}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{t("pwa.install")}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}