import apiClient from "./client";

export interface FinanceOverview {
  stockByCurrency: Record<string, number>;
  expenseByCurrency: Record<string, number>;
  paidTotal: number;
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
}

export interface FinanceTimeline {
  months: number;
  periods: string[];
  stockByCurrency: Record<string, number[]>;
  expenseByCurrency: Record<string, number[]>;
  received: number[];
  pending: number[];
}

export const financeApi = {
  getOverview: () => apiClient.get<FinanceOverview>("/finance/overview"),
  getTimeline: (months?: number) =>
    apiClient.get<FinanceTimeline>("/finance/timeline", { params: months ? { months } : undefined }),
};