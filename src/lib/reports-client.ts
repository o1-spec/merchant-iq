export interface ReportSummary {
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

export interface ReportCashflow {
  currentCash: number;
  averageDailyInflow: number;
  averageDailyOutflow: number;
  runwayDays: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warning: string | null;
}

export interface ReportCredit {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

export interface ReportMerchant {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
}

export interface ReportInsight {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface BusinessHealthReportResponse {
  merchant: ReportMerchant;
  summary: ReportSummary;
  cashflow: ReportCashflow;
  creditReadiness: ReportCredit;
  aiInsights: ReportInsight[];
  generatedAt: string;
}

export async function getBusinessHealthReport(): Promise<BusinessHealthReportResponse> {
  const res = await fetch('/api/reports/business-health', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? 'Failed to load business health report');
  }

  return json.data as BusinessHealthReportResponse;
}
