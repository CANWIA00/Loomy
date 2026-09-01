import { BASE_URL } from "../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TryRatesData {
  rates: Record<string, number>;
  source: "TCMB";
  rateDate: string;
  fetchedAt: number;
}

export interface TryRatesResult {
  data: TryRatesData | null;
  stale: boolean;
}

const SUPPORTED = ["TRY", "USD", "EUR", "GBP"];

const CACHE_TTL = 30 * 60 * 1000;
const STORAGE_KEY = "tryRatesCache";

let cache: TryRatesData | null = null;
let persistedCache: TryRatesData | null | undefined = undefined;

async function loadPersistedOnce(): Promise<TryRatesData | null> {
  if (persistedCache !== undefined) return persistedCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    persistedCache = raw ? (JSON.parse(raw) as TryRatesData) : null;
  } catch {
    persistedCache = null;
  }
  return persistedCache;
}

async function persist(rates: TryRatesData): Promise<void> {
  persistedCache = rates;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch {}
}

function parseRate(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(String(value).trim().replace(",", "."));
  return isNaN(num) ? null : num;
}

function parseTcmbXml(xml: string): TryRatesData | null {
  const dateMatch = xml.match(/<Tarih_Date[^>]*Tarih="([^"]+)"/);
  const rateDate = dateMatch?.[1] || new Date().toLocaleDateString("tr-TR");
  const rates: Record<string, number> = { TRY: 1 };
  for (const code of SUPPORTED.filter((c) => c !== "TRY")) {
    const blockMatch = xml.match(new RegExp(`<Currency[^>]*CurrencyCode="${code}"[^>]*>([\\s\\S]*?)<\\/Currency>`));
    if (!blockMatch) continue;
    const block = blockMatch[1];
    const banknoteSelling = block.match(/<BanknoteSelling>\s*([\d.]+)/);
    const forexSelling = block.match(/<ForexSelling>\s*([\d.]+)/);
    const rate = parseRate(banknoteSelling?.[1]) ?? parseRate(forexSelling?.[1]);
    if (rate) rates[code] = rate;
  }
  if (!rates.USD && !rates.EUR && !rates.GBP) return null;
  return { source: "TCMB", rateDate, rates, fetchedAt: Date.now() };
}

async function fetchFromBackend(): Promise<TryRatesData | null> {
  try {
    const res = await fetch(`${BASE_URL}/rates/tcmb`);
    if (!res.ok) throw new Error("backend rates failed");
    const data = await res.json();
    if (!data?.rates?.USD && !data?.rates?.EUR && !data?.rates?.GBP) throw new Error("backend empty rates");
    return {
      source: "TCMB",
      rateDate: data.rateDate || new Date().toLocaleDateString("tr-TR"),
      rates: data.rates,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

async function fetchFromTcmbDirect(): Promise<TryRatesData | null> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: {
        Accept: "application/xml",
        "User-Agent": "Mozilla/5.0 (ManagementDashboard)",
      },
    });
    if (!res.ok) throw new Error("tcmb fetch failed");
    const xml = await res.text();
    return parseTcmbXml(xml);
  } catch {
    return null;
  }
}

export async function getTryRates(force = false): Promise<TryRatesResult> {
  if (cache && !force && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return { data: cache, stale: false };
  }

  const fetched = (await fetchFromBackend()) ?? (await fetchFromTcmbDirect());
  if (fetched) {
    cache = fetched;
    await persist(fetched);
    return { data: fetched, stale: false };
  }

  const old = cache ?? (await loadPersistedOnce());
  if (old) {
    return { data: old, stale: true };
  }

  return { data: null, stale: false };
}

export function convertToTry(amount: number, currency: string, rates?: TryRatesData | null): number | null {
  if (!rates) return null;
  const rate = rates.rates[currency];
  if (!rate) return null;
  return amount * rate;
}