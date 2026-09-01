import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getTryRates, convertToTry, type TryRatesData } from "../utils/currencyRates";

interface CurrencyContextValue {
  rates: TryRatesData | null;
  loading: boolean;
  error: boolean;
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
  const [rates, setRates] = useState<TryRatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (force: boolean) => {
    if (force) setLoading(true);
    const data = await getTryRates(force);
    if (data) {
      setRates(data);
      setError(false);
    } else if (!force) {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const getRate = useCallback((currency: string) => rates?.rates[currency] ?? null, [rates]);

  const convert = useCallback((amount: number, currency: string) => convertToTry(amount, currency, rates), [rates]);

  const value: CurrencyContextValue = { rates, loading, error, refresh, getRate, convert };
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}