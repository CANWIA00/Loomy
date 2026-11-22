import type { ICalendarEventBase } from "react-native-big-calendar";

export interface ScheduleEvent extends ICalendarEventBase {
  renk: string;
  ekipAdi?: string;
  eventId?: number;
  /** done: servis kaydi var · overdue: tarihi gecti, servis formu yok · open */
  durum?: "done" | "overdue" | "open";
  notlar?: string;
}

export interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string;
}

export type PlanFilter = "gun" | "hafta" | "ay" | "tum";

export const TEAM_COLORS = ["#6080FF", "#10B981", "#F59E0B", "#EF4444", "#8060FF", "#EC4899"];
