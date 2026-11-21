import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export interface QuoteJobSync {
  /** Islem sonrasi teklife bagli is (yoksa null) */
  job: { id: number; status: string } | null;
  /** Kabul geri alindi ama is zaten takvimde/tamamlanmis: kullaniciya uyari */
  warning: "scheduled" | "done" | null;
}

function linesSummary(rawLines: string): string {
  try {
    const lines = JSON.parse(rawLines || "[]") as Array<{ name?: string; quantity?: number; unit?: string }>;
    return lines
      .filter((l) => l && l.name)
      .map((l) => `• ${l.name}${l.quantity ? ` x${l.quantity}${l.unit ? ` ${l.unit}` : ""}` : ""}`)
      .join("\n");
  } catch {
    return "";
  }
}

/**
 * Teklif durumu degisince planlama isini senkronlar:
 * - ACCEPTED: atama bekleyen is olusturur (iptal edilmis is varsa yeniden acar).
 * - Diger durumlar: is atama bekliyorsa iptal eder; takvimde/tamamlanmissa
 *   dokunmaz ve uyari doner.
 */
export async function syncQuoteJob(tx: Tx, companyId: string, quoteId: number, status: string): Promise<QuoteJobSync> {
  const quote = await tx.quoteRecord.findFirst({ where: { id: quoteId, companyId } });
  if (!quote) return { job: null, warning: null };
  const existing = await tx.appointment.findFirst({ where: { quoteId, companyId } });

  if (status === "ACCEPTED") {
    if (existing && existing.status !== "CANCELLED") {
      return { job: { id: existing.id, status: existing.status }, warning: null };
    }
    const summary = linesSummary(quote.lines);
    const notes = [`Teklif #${quote.id}${quote.title ? ` · ${quote.title}` : ""}`, summary].filter(Boolean).join("\n");
    const job = existing
      ? await tx.appointment.update({
          where: { id: existing.id },
          data: { status: "AWAITING", teamId: null, teamName: "", date: "", startTime: "", duration: "" },
        })
      : await tx.appointment.create({
          data: {
            companyId,
            quoteId: quote.id,
            customerName: quote.customerName,
            customerId: quote.customerId,
            serviceType: quote.title?.trim() || "Teklif",
            notes,
            status: "AWAITING",
          },
        });
    return { job: { id: job.id, status: job.status }, warning: null };
  }

  if (!existing) return { job: null, warning: null };
  if (existing.status === "AWAITING") {
    const job = await tx.appointment.update({ where: { id: existing.id }, data: { status: "CANCELLED" } });
    return { job: { id: job.id, status: job.status }, warning: null };
  }
  if (existing.status === "SCHEDULED") return { job: { id: existing.id, status: existing.status }, warning: "scheduled" };
  if (existing.status === "DONE") return { job: { id: existing.id, status: existing.status }, warning: "done" };
  return { job: { id: existing.id, status: existing.status }, warning: null };
}
