import type { ICalendarEventBase } from "react-native-big-calendar";

export interface ScheduleEvent extends ICalendarEventBase {
  renk: string;
  ekipAdi?: string;
  eventId?: number;
  notlar?: string;
}

export interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string;
}

export type PlanFilter = "gun" | "hafta" | "ay" | "tum";

export const TEAM_COLORS = ["#6080FF", "#10B981", "#F59E0B", "#EF4444", "#8060FF", "#EC4899"];
