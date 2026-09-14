import { Prisma } from "@prisma/client";

export const REASON_SERVICE = "SERVICE";

export interface UsedProductInput {
  name: string;
  quantity: number;
  unit?: string;
  unitPrice?: number | null;
  currency?: string;
  vatRate?: number | null;
}

export interface UsedProductRecord extends UsedProductInput {
  stockItemId: number | null;
  inStock: boolean;
  deducted: boolean;
  transactionId: number | null;
}

export function parseUsedProducts(json: string | null | undefined): UsedProductRecord[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function normalizeUsedProductInput(list: any): UsedProductInput[] {
  if (!Array.isArray(list)) return [];
  const result: UsedProductInput[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const name = String(raw.name ?? "").trim();
    const quantity = Number(raw.quantity);
    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue;
    const unitPrice =
      raw.unitPrice != null && raw.unitPrice !== "" ? Number(raw.unitPrice) : null;
    result.push({
      name,
      quantity,
      unit: raw.unit ? String(raw.unit) : undefined,
      unitPrice: unitPrice != null && Number.isFinite(unitPrice) ? unitPrice : null,
      currency: raw.currency ? String(raw.currency) : undefined,
      vatRate: raw.vatRate != null ? Number(raw.vatRate) : null,
    });
  }
  return result;
}

/**
 * Stoktaki ürünler servis raporu için düşülür. Ürün stokta yoksa düşüm yapılmaz,
 * rapora "stokta değil" durumu eklenir.
 *
 * Eski kayıttaki düşümler önce geri alınır (stok geri eklenir + hareket silinir),
 * ardından yeni liste uygulanır. Böylece düzenleme idempotent olur.
 */
export async function applyUsedProductsTx(
  tx: Prisma.TransactionClient,
  companyId: string,
  recordId: number,
  oldJson: string | null | undefined,
  newList: any
): Promise<UsedProductRecord[]> {
  const old = parseUsedProducts(oldJson);
  const input = normalizeUsedProductInput(newList);
  const resolved: UsedProductRecord[] = [];

  for (const prev of old) {
    if (!prev.deducted || !prev.transactionId || !prev.stockItemId) continue;
    const item = await tx.stockItem.findFirst({
      where: { id: prev.stockItemId, companyId },
    });
    if (!item) continue;
    await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: Math.max(0, item.quantity + prev.quantity) },
    });
    await tx.stockTransaction.delete({ where: { id: prev.transactionId } });
  }

  for (const p of input) {
    const item = await tx.stockItem.findFirst({
      where: { companyId, name: { equals: p.name, mode: "insensitive" } },
    });

    if (!item) {
      resolved.push({
        ...p,
        stockItemId: null,
        inStock: false,
        deducted: false,
        transactionId: null,
      });
      continue;
    }

    const price = p.unitPrice != null ? Number(p.unitPrice) : null;
    const currency = p.currency?.trim() || item.currency || "TRY";
    const vatRate = item.vatRate ?? (p.vatRate != null ? Number(p.vatRate) : null);
    const vatAmount =
      price != null ? Math.round(price * p.quantity * (vatRate || 0)) / 100 : null;

    await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: Math.max(0, item.quantity - p.quantity) },
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        stockItemId: item.id,
        change: -p.quantity,
        reason: REASON_SERVICE,
        unitPrice: price,
        currency,
        vatRate: vatRate != null ? vatRate : null,
        vatAmount,
        note: `Servis kaydı #${recordId}`,
        companyId,
      },
    });

    resolved.push({
      ...p,
      stockItemId: item.id,
      inStock: true,
      deducted: true,
      transactionId: transaction.id,
    });
  }

  return resolved;
}

/**
 * Servis kaydı silinirken daha önce düşülen stoklar geri eklenir.
 */
export async function reverseUsedProductsTx(
  tx: Prisma.TransactionClient,
  companyId: string,
  usedProductsJson: string | null | undefined
): Promise<boolean> {
  const old = parseUsedProducts(usedProductsJson);
  let reversed = false;
  for (const prev of old) {
    if (!prev.deducted || !prev.transactionId || !prev.stockItemId) continue;
    const item = await tx.stockItem.findFirst({
      where: { id: prev.stockItemId, companyId },
    });
    if (!item) continue;
    await tx.stockItem.update({
      where: { id: item.id },
      data: { quantity: Math.max(0, item.quantity + prev.quantity) },
    });
    await tx.stockTransaction.delete({ where: { id: prev.transactionId } });
    reversed = true;
  }
  return reversed;
}