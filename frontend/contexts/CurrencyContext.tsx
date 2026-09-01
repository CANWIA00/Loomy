import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getTryRates, convertToTry, type TryRatesData } from "../utils/currencyRates";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./LanguageContext";
import CustomAlert from "../components/CustomAlert";

interface CurrencyContextValue {
  rates: TryRatesData | null;
  loading: boolean;
  error: boolean;
  stale: boolean;
  refresh: () => void;
  getRate: (currency: string) => number | null;
  convert: (amount: number, currency: string) => number | null;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [rates, setRates] = useState<TryRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);
  const [showStaleAlert, setShowStaleAlert] = useState(false);

  const load = useCallback(async (force: boolean) => {
    if (force) setLoading(true);
    const result = await getTryRates(force);
    if (result.data) {
      setRates(result.data);
      setError(false);
      setStale(result.stale);
      if (result.stale) setShowStaleAlert(true);
    } else if (!force) {
      setError(true);
      setStale(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const getRate = useCallback((currency: string) => rates?.rates[currency] ?? null, [rates]);

  const convert = useCallback((amount: number, currency: string) => convertToTry(amount, currency, rates), [rates]);

  const value: CurrencyContextValue = { rates, loading, error, stale, refresh, getRate, convert };
  return (
    <CurrencyContext.Provider value={value}>
      {children}
      <CustomAlert
        visible={showStaleAlert}
        type="warning"
        title={t("qot.ratesStaleTitle")}
        message={t("qot.ratesStaleMessage")}
        onClose={() => setShowStaleAlert(false)}
      />
    </CurrencyContext.Provider>
  );
}