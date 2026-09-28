/**
 * Stok dusmeli (productsMode) servis kayitlarinin "fee" alani 0.00 kaldigi icin
 * odeme listesi 0 gosteriyordu. Bu script etkilenen kayitlari yeniden hesaplar.
 *
 * Kullanim:
 *   npx ts-node src/scripts/backfillServiceTotals.ts            # onizleme (sadece rapor)
 *   npx ts-node src/scripts/backfillServiceTotals.ts --apply     # yaz
 */
import prisma from "../prisma";
import { parseUsedProducts } from "../services/serviceUsedProducts";
import { computeServiceTotal, MissingRateError, roundMoney } from "../utils/serviceTotals";
import { getTryRates } from "../utils/tcmbRates";
import { periodKey, scheduleRecomputePeriods } from "../services/monthlySummaries";

const apply = process.argv.includes("--apply");

export function isZeroFee(fee: string | null | undefined): boolean {
  const n = parseFloat(String(fee ?? "").replace(",", "."));
  return !isFinite(n) || n === 0;
}

/** Duzeltilecek kayitlar: stok dusmeli (productsMode) ve fee 0 olanlar. */
export function selectBackfillCandidates<T extends { fee: string | null }>(records: T[]): T[] {
  return records.filter((r) => isZeroFee(r.fee));
}

async function main() {
  const rates = await getTryRates();
  if (!rates) {
    console.warn("UYARI: TCMB kuru alinamadi, yabanci para birimi olan kayitlar yanlis hesaplanabilir.");
  }

  const records = await prisma.serviceRecord.findMany({
    where: { productsMode: true },
    select: {
      id: true,
      companyId: true,
      customerName: true,
      usedProducts: true,
      labor: true,
      laborCurrency: true,
      kdvRate: true,
      fee: true,
      feeCurrency: true,
      createdAt: true,
    },
  });

  const affected = selectBackfillCandidates(records);
  console.log(`Toplam productsMode kayit: ${records.length}`);
  console.log(`fee = 0 olan (duzeltilecek): ${affected.length}`);

  if (affected.length === 0) {
    console.log("Duzeltilecek kayit yok.");
    return;
  }

  const periodsByCompany = new Map<string, Set<string>>();
  let changed = 0;
  let skipped = 0;

  for (const r of affected) {
    const products = parseUsedProducts(r.usedProducts);
    let fee: string;
    let note = "";
    try {
      fee = roundMoney(
        computeServiceTotal(
          {
            productsMode: true,
            usedProducts: products,
            fee: "0.00",
            feeCurrency: "TRY",
            labor: r.labor,
            laborCurrency: r.laborCurrency,
            kdvRate: r.kdvRate,
          },
          rates
        ).grandTry
      );
    } catch (error) {
      if (error instanceof MissingRateError) {
        skipped += 1;
        console.log(
          `  #${r.id} ${r.customerName}  ATLANDI: kur alinamadi (${error.currencies.join(",")})`
        );
        continue;
      }
      throw error;
    }

    console.log(`  #${r.id} ${r.customerName} fee "${r.fee}" -> "${fee}"${note ? `  [${note}]` : ""}`);

    if (fee === "0.00") {
      console.log(`    atlandi: hesaplanabilir tutar yok`);
      continue;
    }

    if (apply) {
      await prisma.serviceRecord.update({
        where: { id: r.id },
        data: { fee, feeCurrency: "TRY" },
      });
    }
    changed += 1;

    const period = periodKey(r.createdAt as Date);
    if (!periodsByCompany.has(r.companyId)) periodsByCompany.set(r.companyId, new Set());
    periodsByCompany.get(r.companyId)!.add(period);
  }

  console.log(`${apply ? "Guncellendi" : "Guncellenecek"} kayit sayisi: ${changed}`);
  if (skipped > 0) console.log(`Atlandi (kur eksik): ${skipped}`);

  if (!apply) {
    console.log("\nBu bir onizlemedir. Yazmak icin: npx ts-node src/scripts/backfillServiceTotals.ts --apply");
    return;
  }

  for (const [companyId, periods] of periodsByCompany) {
    const list = [...periods];
    console.log(`  ${companyId}: ${list.join(", ")} ozetleri yeniden hesaplama kuyruguna aliniyor...`);
    await scheduleRecomputePeriods(companyId, list);
  }
}

// Yalnizca dogrudan calistirildiginda (import edildiginde degil) veritabanina dokun.
if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("Backfill hatasi:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
