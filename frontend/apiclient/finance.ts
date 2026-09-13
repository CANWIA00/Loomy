import apiClient from "./client";

export interface FinanceOverview {
  period?: string | null;
  availablePeriods?: string[];
  stockByCurrency: Record<string, number>;
  expenseByCurrency: Record<string, number>;
  paidTotal: number;
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
}

export interface FinanceTimeline {
  kind?: "daily" | "monthly";
  months?: number;
  periods: string[];
  stockByCurrency: Record<string, number[]>;
  expenseByCurrency: Record<string, number[]>;
  received: number[];
  pending: number[];
}

export const financeApi = {
  getOverview: (period?: string) =>
    apiClient.get<FinanceOverview>("/finance/overview", { params: period ? { month: period } : undefined }),
  getTimeline: (params?: { month?: string; year?: string; months?: number }) =>
    apiClient.get<FinanceTimeline>("/finance/timeline", { params }),
};