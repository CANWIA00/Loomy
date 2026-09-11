export interface ExistingStockValues {
  unitPrice: number | null;
  vatRate: number | null;
  unit?: string | null;
}

export interface IncomingStockValues {
  unitPrice?: number | null;
  vatRate?: number | null;
  unit?: string | null;
}

export interface MergedStockValues {
  unitPrice: number | null;
  vatRate: number;
  unit: string;
}

/**
 * Stok girisinde (fatura ya da manuel) yeni kali bilinen mevcut kalemi birlestirir.
 * Kural:
 *  - Fiyat: her zaman daha yuksek olan kaznir (zam gelmis ise yeni fiyat korunur,
 *    daha ucuz giriste mevcut fiyat dusurulmez).
 *  - KDV orani: her zaman daha yuksek olan kullanilir.
 *  - Birim: mevcut birim korunur, yoksa yeni birim kullanilir.
 */
export function mergeStockEntry(
  existing: ExistingStockValues,
  incoming: IncomingStockValues
): MergedStockValues {
  const currentPrice = existing.unitPrice ?? 0;
  const newPrice = incoming.unitPrice ?? 0;
  const higherPrice = Math.max(currentPrice, newPrice);

  const vatRate = Math.max(existing.vatRate ?? 0, incoming.vatRate ?? 0);
  const unit = existing.unit?.trim() || incoming.unit?.trim() || "AD";

  return {
    unitPrice: higherPrice > 0 ? higherPrice : null,
    vatRate,
    unit,
  };
}