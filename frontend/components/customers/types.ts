import type { Customer } from "../../api/customers";

export interface TogglePaymentState {
  visible: boolean;
  customer: Customer | null;
}

export const PAGE_SIZE = 20;

export const formatAmount = (amount: string): string => {
  const num = parseFloat(amount) || 0;
  return `₺${num.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
};
