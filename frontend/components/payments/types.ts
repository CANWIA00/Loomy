import type { PaymentRecord } from "../../api/payments";

export type TimeFilter = "all" | "gun" | "hafta" | "ay";
export type StatusFilter = "all" | "odendi" | "bekliyor";
export type StatusOption = { label: string; value: string };

export const TIME_FILTERS: TimeFilter[] = ["all", "gun", "hafta", "ay"];
export const LIST_SIZE = 10;

export interface ToggleAlertState {
  visible: boolean;
  record: PaymentRecord | null;
}

export const parseDate = (tarih: string): Date => {
  const sep = tarih.includes(".") ? "." : "/";
  const parts = tarih.split(sep);
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(0);
};
