import { convertToTry, getTryRates, type TryRatesData } from "./tcmbRates";

export interface UsedProductLike {
  name?: string;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  currency?: string | null;
  vatRate?: number | string | null;
}

export interface ServiceTotalInput {
  productsMode: boolean;
  usedProducts: UsedProductLike[];
  fee?: number | string | null;
  feeCurrency?: string | null;
  labor?: number | string | null;
  laborCurrency?: string | null;
  kdvRate?: number | string | null;
}

/** Gerekli bir para biriminin kuru alinamadi: tutar hesaplanamaz. */
export class MissingRateError extends Error {
  readonly currencies: string[];
  constructor(currencies: string[]) {
    super(`Kur alınamadı: ${currencies.join(", ")}`);
    this.name = "MissingRateError";
    this.currencies = currencies;
  }
}

export interface ServiceTotalBreakdown {
  productTry: number;
  laborTry: number;
  baseTry: number;
  kdvTry: number;
  grandTry: number;
  missingRates: string[];
}

function toNumber(value: number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return isFinite(value) ? value : 0;
  const normalized = String(value).trim().replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

export function computeServiceTotal(
  input: ServiceTotalInput,
  rates: TryRatesData | null
): ServiceTotalBreakdown {
  const missingRates = new Set<string>();

  const perCurrency: Record<string, number> = {};
  for (const p of input.usedProducts || []) {
    const quantity = toNumber(p.quantity);
    const unitPrice = toNumber(p.unitPrice);
    const cur = (p.currency || "TRY").toUpperCase();
    perCurrency[cur] = (perCurrency[cur] || 0) + quantity * unitPrice;
  }

  let productTry = 0;
  for (const [cur, amount] of Object.entries(perCurrency)) {
    if (!amount) continue;
    const converted = convertToTry(amount, cur, rates);
    if (converted == null) {
      missingRates.add(cur);
      // Kur gelemedigi icin bu para birimindeki tum urunler 0 kabul edilir.
      // Kismi toplam (ornegin iscilik + KDV) kaydedilmekten cok veri kaybi yaratir,
      // bu yuzden hesap basarisiz sayilir.
      throw new MissingRateError([...missingRates]);
    }
    productTry += converted;
  }

  let laborTry = 0;
  const laborValue = toNumber(input.labor);
  if (input.productsMode) {
    if (laborValue > 0) {
      const laborCurrency = (input.laborCurrency || "TRY").toUpperCase();
      const converted = convertToTry(laborValue, laborCurrency, rates);
      if (converted == null) {
        missingRates.add(laborCurrency);
        throw new MissingRateError([...missingRates]);
      }
      laborTry += converted;
    }
  } else {
    const feeValue = toNumber(input.fee);
    if (feeValue > 0) {
      const feeCurrency = (input.feeCurrency || "TRY").toUpperCase();
      const converted = convertToTry(feeValue, feeCurrency, rates);
      if (converted == null) {
        missingRates.add(feeCurrency);
        throw new MissingRateError([...missingRates]);
      }
      productTry += converted;
    }
  }

  const kdvRate = input.productsMode ? toNumber(input.kdvRate || 20) / 100 : 0;
  const baseTry = productTry + laborTry;
  const kdvTry = baseTry * kdvRate;
  const grandTry = baseTry + kdvTry;

  return { productTry, laborTry, baseTry, kdvTry, grandTry, missingRates: [...missingRates] };
}

export function roundMoney(value: number): string {
  if (!isFinite(value)) return "0.00";
  const scaled = value * 100;
  // Float temsili tam yarım degerleri asagi yuvarlar (9624.005 -> 9624.00).
  // Kuruş duzeyinde kucuk bir telafi ekleyerek yuvarlama yarisini yukari aliyoruz.
  const epsilon = Math.abs(scaled) < 1e12 ? (scaled < 0 ? -1e-6 : 1e-6) : 0;
  return (Math.round(scaled + epsilon) / 100).toFixed(2);
}

/**
 * Frontend'in toplami gostermek icin kullandigi kur snapshot'ini guvenli hale getirir.
 * Kur tutar hesabini etkiledigi icin istemciden gelen degerler mutlaka sinirlandirilir:
 * aksi halde bozuk/zararli bir istek kasada devasa tutarlar yazabilir.
 */
export function sanitizeClientRates(
  input: unknown,
  neededCurrencies: string[]
): TryRatesData | null {
  const src = (input as any)?.rates;
  if (!src || typeof src !== "object") return null;

  const rates: Record<string, number> = { TRY: 1 };
  for (const cur of neededCurrencies) {
    const code = cur.toUpperCase();
    if (code === "TRY") continue;
    const value = Number((src as Record<string, unknown>)[code] ?? (src as Record<string, unknown>)[cur]);
    if (!isFinite(value) || value <= 0) return null;
    if (value < MIN_RATE || value > MAX_RATE) return null;
    rates[code] = value;
  }
  return {
    source: "TCMB",
    rateDate: String((input as any)?.rateDate ?? ""),
    fetchedAt: Date.now(),
    rates,
  };
}

const MIN_RATE = 0.0001;
const MAX_RATE = 1_000_000;

/**
 * Stok düşmeli (productsMode) kayıtlarda "Servis Ücreti" alanı formda gizlidir,
 * bu yüzden kayıt 0.00 ile yazılır ve ödeme listesi tutarı 0 gösterir.
 * Tutarı ürünler + işçilik + KDV'den hesaplayıp fee alanına yazıyoruz.
 *
 * Kur kaynagi onceligi:
 *   1) clientRates: frontend'in toplami ekranda gosterirken kullandigi anlik kur.
 *      TCMB cagrisina bagimli kalmamak icin tercih edilir; boylece kullaniciya
 *      ekranda gordugu tutarin aynisi kaydedilir.
 *   2) getTryRates: TCMB'den canli (onbellekli) cekme, clientRates yoksa.
 * Ikisi de yoksa null doner; cagiran taraf fee alanina dokunmaz.
 */
export async function resolveProductsModeTotal(
  input: ServiceTotalInput,
  clientRates?: unknown
): Promise<string | null> {
  if (!input.productsMode) return null;

  const foreignCurrencies = new Set<string>();
  for (const p of input.usedProducts || []) {
    const cur = (p.currency || "TRY").toUpperCase();
    if (cur !== "TRY") foreignCurrencies.add(cur);
  }
  const laborCur = (input.laborCurrency || "TRY").toUpperCase();
  if (laborCur !== "TRY" && toNumber(input.labor) > 0) foreignCurrencies.add(laborCur);

  let rates: TryRatesData | null = null;
  if (foreignCurrencies.size > 0) {
    rates = sanitizeClientRates(clientRates, [...foreignCurrencies]);
    if (rates) {
      rates.rateDate = `istemci (${(clientRates as any)?.rateDate ?? "bilinmiyor"})`;
    }
  }

  if (!rates && foreignCurrencies.size > 0) {
    rates = await getTryRates();
  }

  if (!rates) {
    const tryOnly: TryRatesData = {
      source: "TCMB",
      rateDate: "",
      fetchedAt: Date.now(),
      rates: { TRY: 1 },
    };
    rates = tryOnly;
  }

  try {
    return roundMoney(computeServiceTotal(input, rates).grandTry);
  } catch (error) {
    if (error instanceof MissingRateError) {
      console.error(
        `serviceTotal: GENEL TOPLAM HESAPLANAMADI, kur alinamadi (${error.currencies.join(", ")}). ` +
        `Odeme listesinde 0 gorunecek. Istemciden tryRates gonderilmedi ve TCMB cagrisi basarisiz.`
      );
      return null;
    }
    throw error;
  }
}

