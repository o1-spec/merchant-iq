import { apiGet } from "./api-client";

export interface MerchantInfo {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
}

export interface SummaryData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashPosition: number;
  transactionCount: number;
  bestSalesDay: string;
  topRevenueCategory: string;
  topExpenseCategory: string;
  revenueTrendPercent: number;
  expenseTrendPercent: number;
}

export interface CashflowData {
  currentCash: number;
  averageDailyInflow: number;
  averageDailyOutflow: number;
  runwayDays: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  warning: string;
}

export interface CreditReadinessData {
  score: number;
  riskLevel: string;
  strengths: string[];
  weaknesses: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string | null;
  date: string;
  direction: "INFLOW" | "OUTFLOW";
  status: string;
  paymentMethod: string;
  source: string;
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
}

export interface DashboardData {
  merchant: MerchantInfo;
  summary: SummaryData;
  cashflow: CashflowData;
  creditReadiness: CreditReadinessData;
  recentTransactions: Transaction[];
  latestInsights: Insight[];
}

export function getDashboard(): Promise<DashboardData> {
  return apiGet<DashboardData>("/api/dashboard");
}
