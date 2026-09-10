import type { PaymentRecord } from "../../apiclient/payments";

export type PlanFilter = "today" | "tomorrow" | "week";

export interface ToggleAlertState {
  visible: boolean;
  record: PaymentRecord | null;
}
