/**
 * TCMB kurlarinin TEK kaynagi.
 * Hem /api/rates/tcmb endpoint'i hem de servis toplam hesabi buradan beslenir,
 * boylece frontend'in gosterdigi toplam ile kaydedilen toplam ayni kurdan gelir.
 *
 * Not: /rates/tcmb endpoint'i her istekte canli veri ceker (frontend kendi
 * 30 dk'lik cache'ine guvenir). Servis kaydi hesabinda ise TCMB'ye her kayit
 * icin istek atilmasin diye onbellek kullanilir.
 */
const CURRENCIES = ["USD", "EUR", "GBP"] as const;

export interface TryRatesData {
  rates: Record<string, number>;
  source: "TCMB";
  rateDate: string;
  fetchedAt: number;
}

export type RatesFailureReason = "http" | "parse" | "network";

export type RatesResult =
  | { ok: true; data: TryRatesData }
  | { ok: false; reason: RatesFailureReason; message: string };

const CACHE_TTL = 30 * 60 * 1000; // 30 dk
let cache: TryRatesData | null = null;

function parseRate(value: string | undefined): number | null {
  if (!value) return null;
  const num = parseFloat(String(value).trim().replace(",", "."));
  return isNaN(num) ? null : num;
}

function parseTcmbXml(xml: string): TryRatesData | null {
  const dateMatch = xml.match(/<Tarih_Date[^>]*Tarih="([^"]+)"/);
  const rateDate = dateMatch?.[1] || new Date().toLocaleDateString("tr-TR");
  const rates: Record<string, number> = { TRY: 1 };
  for (const code of CURRENCIES) {
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

/** Onbelleksiz canli cekme. Hata nedeni ayirt edilir ki endpoint farkli mesaj dondursun. */
export async function fetchTcmbRates(): Promise<RatesResult> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      headers: {
        Accept: "application/xml",
        "User-Agent": "Mozilla/5.0 (ManagementDashboard)",
      },
    });
    if (!res.ok) {
      return { ok: false, reason: "http", message: "TCMB'den yanıt alınamadı." };
    }
    const parsed = parseTcmbXml(await res.text());
    if (!parsed) {
      return { ok: false, reason: "parse", message: "TCMB verisi ayrıştırılamadı." };
    }
    return { ok: true, data: parsed };
  } catch (error: any) {
    return { ok: false, reason: "network", message: "Kur alınamadı: " + (error?.message || error) };
  }
}

/**
 * Onbellekli erisim. Yalnizca basarili yanitlar onbellege alinir; hata durumunda
 * eski (veya hic) veri donulur, gecici bir TCMB kesintisi 30 dk boyunca
 * her kayit kaydini bozmaz.
 */
export async function getTryRates(force = false): Promise<TryRatesData | null> {
  if (cache && !force && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache;
  }
  const result = await fetchTcmbRates();
  if (result.ok) {
    cache = result.data;
    return cache;
  }
  console.warn(`getTryRates: TCMB kuru alinamadi (${result.reason}) - ${result.message}`);
  return cache;
}

export function convertToTry(amount: number, currency: string, rates: TryRatesData | null): number | null {
  if (!rates) return null;
  if (!currency) return null;
  const cur = currency.toUpperCase();
  if (cur === "TRY") return amount;
  const rate = rates.rates[cur];
  if (rate == null || rate <= 0) return null;
  return amount * rate;
}
