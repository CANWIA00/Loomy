export type Tab = "dashboard" | "customers" | "payments" | "keys";

export const MONTHLY_FEE = 350;

export function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "-";
  }
}

export function paymentInfo(paidUntil?: string | null): { paid: boolean; label: string } {
  if (!paidUntil) {
    return { paid: false, label: "Ödeme alınmadı" };
  }
  const until = new Date(paidUntil);
  const now = new Date();
  const diffDays = Math.ceil((until.getTime() - now.getTime()) / 86400000);
  if (until < now) {
    return { paid: false, label: `Ödeme gecikti · ${Math.abs(diffDays)} gün` };
  }
  return { paid: true, label: `Ödeme alındı · ${diffDays} gün kaldı` };
}
