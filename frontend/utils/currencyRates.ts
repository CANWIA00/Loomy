export interface TryRatesData {
  rates: Record<string, number>;
  source: "TCMB" | "ER-API";
  rateDate: string;
  fetchedAt: number;
}

const SUPPORTED = ["TRY", "USD", "EUR", "GBP"];

const CACHE_TTL = 30 * 60 * 1000;

let cache: TryRatesData | null = null;

function parseRate(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(String(value).trim().replace(",", "."));
  return isNaN(num) ? null : num;
}

async function fetchFromTcmb(): Promise<TryRatesData | null> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: { Accept: "application/xml" },
    });
    if (!res.ok) throw new Error("tcmb fetch failed");
    const xml = await res.text();
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
    if (!rates.USD && !rates.EUR && !rates.GBP) throw new Error("tcmb empty rates");
    return { rates, source: "TCMB", rateDate, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

async function fetchFromErApi(): Promise<TryRatesData | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/TRY");
    if (!res.ok) throw new Error("er-api fetch failed");
    const data = await res.json();
    if (!data?.rates) throw new Error("er-api empty");
    const rates: Record<string, number> = { TRY: 1 };
    for (const code of SUPPORTED.filter((c) => c !== "TRY")) {
      const r = data.rates[code];
      if (typeof r === "number" && r > 0) rates[code] = r;
    }
    if (!rates.USD && !rates.EUR && !rates.GBP) throw new Error("er-api empty rates");
    return {
      rates,
      source: "ER-API",
      rateDate: new Date().toLocaleDateString("tr-TR"),
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function getTryRates(force = false): Promise<TryRatesData | null> {
  if (cache && !force && Date.now() - cache.fetchedAt < CACHE_TTL) return cache;
  const tcmb = await fetchFromTcmb();
  cache = tcmb ?? (await fetchFromErApi());
  return cache;
}

export function convertToTry(amount: number, currency: string, rates?: TryRatesData | null): number | null {
  if (!rates) return null;
  const rate = rates.rates[currency];
  if (!rate) return null;
  return amount * rate;
}