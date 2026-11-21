import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tr from "../locales/tr.json";
import en from "../locales/en.json";

export type Lang = "tr" | "en";

// Ceviriler locales/*.json dosyalarindadir; yeni metinleri oraya ekleyin.
const translations: Record<Lang, Record<string, string>> = { tr, en };

interface LanguageContextType {
  lang: Lang;
  t: (key: string, params?: Record<string, string>) => string;
  setLanguage: (lang: Lang) => void;
  locale: string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "tr",
  t: (key) => key,
  setLanguage: () => {},
  locale: "tr-TR",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr");

  useEffect(() => {
    AsyncStorage.getItem("language").then((v) => {
      if (v === "en" || v === "tr") setLangState(v);
    });
  }, []);

  const setLanguage = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem("language", l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let text = translations[lang]?.[key] || translations.tr[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        });
      }
      return text;
    },
    [lang]
  );

  const locale = lang === "tr" ? "tr-TR" : "en-US";

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage, locale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
