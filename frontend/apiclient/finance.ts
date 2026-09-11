import apiClient from "./client";

export interface FinanceOverview {
  stockByCurrency: Record<string, number>;
  expenseByCurrency: Record<string, number>;
  paidTotal: number;
  pendingTotal: number;
  paidCount: number;
  pendingCount: number;
}

export const financeApi = {
  getOverview: () => apiClient.get<FinanceOverview>("/finance/overview"),
};