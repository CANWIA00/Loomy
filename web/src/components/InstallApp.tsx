import { useEffect, useState } from "react";
import { useLanguage } from "../i18n";
import { DownloadIcon } from "../icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <div className="install-step">
      <span className="install-step-num">{num}</span>
      <span className="install-step-text">{text}</span>
    </div>
  );
}

export default function InstallApp({ className = "btn-secondary" }: { className?: string }) {
  const { t } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  const platform =
    typeof navigator === "undefined"
      ? "desktop"
      : /iphone|ipad|ipod/i.test(navigator.userAgent)
        ? "ios"
        : /android/i.test(navigator.userAgent)
          ? "android"
          : "desktop";

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setShowHelp(true);
  };

  const steps =
    platform === "ios"
      ? [t.install.stepIos1, t.install.stepIos2, t.install.stepIos3]
      : platform === "android"
        ? [t.install.stepAndroid1, t.install.stepAndroid2, t.install.stepAndroid3]
        : [t.install.stepDesktop1, t.install.stepDesktop2, t.install.stepDesktop3];

  return (
    <>
      <button className={`btn ${className}`} onClick={handleInstall}>
        <DownloadIcon />
        {installed ? t.install.installed : t.install.button}
      </button>

      {showHelp && (
        <div className="install-overlay" onClick={() => setShowHelp(false)}>
          <div className="install-card" onClick={(e) => e.stopPropagation()}>
            <div className="install-card-header">
              <span className="install-card-title">{t.install.helpTitle}</span>
              <button className="install-close" onClick={() => setShowHelp(false)} aria-label={t.install.close}>
                ✕
              </button>
            </div>
            <div className="install-steps">
              {steps.map((s, i) => (
                <Step key={i} num={String(i + 1)} text={s} />
              ))}
              <p className="install-note">
                {t.install.orText} <strong>{t.install.bookmarkFallback}</strong>.
              </p>
            </div>
            <button className="btn btn-primary install-ok" onClick={() => setShowHelp(false)}>
              {t.install.understood}
            </button>
          </div>
        </div>
      )}
    </>
  );
}