export interface TransactionData {
  id: string;
  merchantId: string;
  amount: number;
  type: string;
  category: string;
  description: string | null;
  date: Date;
  source: string;
  paymentMethod: string;
  direction: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warning: string;
}

export interface BusinessHealthData {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  breakdown: {
    consistency: number;
    cashflow: number;
    stability: number;
    growth: number;
    credit: number;
  };
}

export interface ForecastData {
  forecastedMonthlyInflow: number;
  forecastedMonthlyOutflow: number;
  netForecastedPosition: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warning: string;
}

export function calculateTrendPercent(currentPeriod: number, previousPeriod: number): number {
  if (previousPeriod === 0) {
    return currentPeriod > 0 ? 100 : 0;
  }
  const diff = currentPeriod - previousPeriod;
  return Math.round((diff / previousPeriod) * 1000) / 10; 
}

export function getBestSalesDay(transactions: TransactionData[]): { dayOfWeek: string; count: number; totalAmount: number } | null {
  const inflows = transactions.filter(t => t.direction === 'INFLOW' && t.status === 'COMPLETED');
  if (inflows.length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats: Record<string, { count: number; totalAmount: number }> = {};

  for (const day of dayNames) {
    dayStats[day] = { count: 0, totalAmount: 0 };
  }

  for (const t of inflows) {
    const dayIndex = new Date(t.date).getDay();
    const dayName = dayNames[dayIndex];
    dayStats[dayName].count += 1;
    dayStats[dayName].totalAmount += t.amount;
  }

  let bestDay = dayNames[0];
  let maxAmount = -1;

  for (const day of dayNames) {
    if (dayStats[day].totalAmount > maxAmount) {
      maxAmount = dayStats[day].totalAmount;
      bestDay = day;
    }
  }

  return {
    dayOfWeek: bestDay,
    count: dayStats[bestDay].count,
    totalAmount: Math.round(dayStats[bestDay].totalAmount * 100) / 100,
  };
}

export function getTopCategories(transactions: TransactionData[]): {
  INCOME: { category: string; amount: number }[];
  EXPENSE: { category: string; amount: number }[];
} {
  const incomeCategories: Record<string, number> = {};
  const expenseCategories: Record<string, number> = {};

  for (const t of transactions.filter(t => t.status === 'COMPLETED')) {
    if (t.direction === 'INFLOW') {
      incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
    } else {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    }
  }

  const mapAndSort = (catMap: Record<string, number>) => {
    return Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);
  };

  return {
    INCOME: mapAndSort(incomeCategories),
    EXPENSE: mapAndSort(expenseCategories),
  };
}

export function calculateSummary(transactions: TransactionData[]): SummaryData {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const completed = transactions.filter(t => t.status === 'COMPLETED');

  
  let totalRevenue = 0;
  let totalExpenses = 0;
  for (const t of completed) {
    if (t.direction === 'INFLOW') {
      totalRevenue += t.amount;
    } else {
      totalExpenses += t.amount;
    }
  }

  const netProfit = totalRevenue - totalExpenses;
  const cashPosition = netProfit;

  
  let currentRev = 0;
  let prevRev = 0;
  let currentExp = 0;
  let prevExp = 0;

  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= thirtyDaysAgo) {
      if (t.direction === 'INFLOW') {
        currentRev += t.amount;
      } else {
        currentExp += t.amount;
      }
    } else if (tDate >= sixtyDaysAgo && tDate < thirtyDaysAgo) {
      if (t.direction === 'INFLOW') {
        prevRev += t.amount;
      } else {
        prevExp += t.amount;
      }
    }
  }

  const revenueTrendPercent = calculateTrendPercent(currentRev, prevRev);
  const expenseTrendPercent = calculateTrendPercent(currentExp, prevExp);

  const bestDayResult = getBestSalesDay(transactions);
  const bestSalesDay = bestDayResult ? bestDayResult.dayOfWeek : 'N/A';

  const cats = getTopCategories(transactions);
  const topRevenueCategory = cats.INCOME[0]?.category || 'N/A';
  const topExpenseCategory = cats.EXPENSE[0]?.category || 'N/A';

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    cashPosition: Math.round(cashPosition * 100) / 100,
    transactionCount: transactions.length,
    bestSalesDay,
    topRevenueCategory,
    topExpenseCategory,
    revenueTrendPercent,
    expenseTrendPercent,
  };
}

export function calculateCashflow(transactions: TransactionData[], referenceDate: Date = new Date()): CashflowData {
  const completed = transactions.filter(t => t.status === 'COMPLETED');

  let totalInflow = 0;
  let totalOutflow = 0;
  for (const t of completed) {
    if (t.direction === 'INFLOW') {
      totalInflow += t.amount;
    } else {
      totalOutflow += t.amount;
    }
  }
  const currentCash = totalInflow - totalOutflow;

  
  const now = referenceDate;
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let inflowPast30 = 0;
  let outflowPast30 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= thirtyDaysAgo) {
      if (t.direction === 'INFLOW') {
        inflowPast30 += t.amount;
      } else {
        outflowPast30 += t.amount;
      }
    }
  }

  const averageDailyInflow = Math.round((inflowPast30 / 30) * 100) / 100;
  const averageDailyOutflow = Math.round((outflowPast30 / 30) * 100) / 100;

  let runwayDays = 999;
  if (averageDailyOutflow > 0) {
    runwayDays = Math.max(0, Math.round(currentCash / averageDailyOutflow));
  } else if (currentCash < 0) {
    runwayDays = 0;
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let warningMessage = '';

  if (currentCash < 0 || runwayDays <= 7) {
    riskLevel = 'HIGH';
    warningMessage = 'Critical cash flow runway: less than 7 days of reserves remaining or negative cash position.';
  } else if (runwayDays <= 30) {
    riskLevel = 'MEDIUM';
    warningMessage = 'Moderate runway: less than 30 days of cash reserves. Plan expenses carefully.';
  } else {
    riskLevel = 'LOW';
    warningMessage = 'Healthy cash flow position: sufficient reserves for 30+ days.';
  }

  return {
    currentCash: Math.round(currentCash * 100) / 100,
    averageDailyInflow,
    averageDailyOutflow,
    runwayDays,
    riskLevel,
    warning: warningMessage,
  };
}

export function calculateBusinessHealth(transactions: TransactionData[], referenceDate: Date = new Date()): BusinessHealthData {
  const completed = transactions.filter(t => t.status === 'COMPLETED');
  const now = referenceDate;

  // 1. Consistency (20 points max)
  let activeWeeks = 0;
  for (let w = 0; w < 8; w++) {
    const startOfBucket = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const endOfBucket = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const hasInflow = completed.some(t => {
      const tDate = new Date(t.date);
      return t.direction === 'INFLOW' && tDate >= startOfBucket && tDate < endOfBucket;
    });
    if (hasInflow) activeWeeks += 1;
  }
  const consistencyScore = Math.round((activeWeeks / 8) * 20);

  // 2. Cashflow / Runway (30 points max)
  const cashflow = calculateCashflow(transactions, referenceDate);
  const runwayDays = cashflow.runwayDays;
  let runwayScore = 0;
  if (runwayDays >= 30) runwayScore = 30;
  else if (runwayDays >= 14) runwayScore = 20;
  else if (runwayDays >= 7) runwayScore = 10;
  else runwayScore = 0;

  // 3. Stability (15 points max)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let outflow30 = 0;
  let outflowPrev60 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= thirtyDaysAgo) {
      if (t.direction === 'OUTFLOW') outflow30 += t.amount;
    } else if (tDate >= sixtyDaysAgo && tDate < thirtyDaysAgo) {
      if (t.direction === 'OUTFLOW') outflowPrev60 += t.amount;
    }
  }
  const volatilityRatio = outflowPrev60 > 0 ? Math.abs(outflow30 - outflowPrev60) / outflowPrev60 : 0;
  let stabilityScore = 0;
  if (volatilityRatio < 0.2) stabilityScore = 15;
  else if (volatilityRatio < 0.5) stabilityScore = 10;
  else if (volatilityRatio < 1.0) stabilityScore = 5;

  // 4. Growth (15 points max)
  let inflow30 = 0;
  let inflowPrev60 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= thirtyDaysAgo) {
      if (t.direction === 'INFLOW') inflow30 += t.amount;
    } else if (tDate >= sixtyDaysAgo && tDate < thirtyDaysAgo) {
      if (t.direction === 'INFLOW') inflowPrev60 += t.amount;
    }
  }
  const revGrowth = calculateTrendPercent(inflow30, inflowPrev60);
  let growthScore = 0;
  if (revGrowth >= 15) growthScore = 15;
  else if (revGrowth >= 5) growthScore = 10;
  else if (revGrowth >= 0) growthScore = 5;

  // 5. Credit Readiness (20 points max)
  let inflow60 = 0;
  let outflow60 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= sixtyDaysAgo) {
      if (t.direction === 'INFLOW') {
        inflow60 += t.amount;
      } else {
        outflow60 += t.amount;
      }
    }
  }
  const ratio = outflow60 > 0 ? inflow60 / outflow60 : inflow60 > 0 ? 2 : 1;
  let creditScorePart = 0;
  if (ratio >= 1.2) creditScorePart = 20;
  else if (ratio >= 1.05) creditScorePart = 15;
  else if (ratio >= 1.0) creditScorePart = 10;

  const finalScore = consistencyScore + runwayScore + stabilityScore + growthScore + creditScorePart;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
  if (finalScore >= 80) {
    riskLevel = 'LOW';
  } else if (finalScore >= 50) {
    riskLevel = 'MEDIUM';
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const nextSteps: string[] = [];

  // Consistency Feedback
  if (activeWeeks >= 6) {
    strengths.push('Highly consistent week-over-week transaction activity logged.');
  } else {
    weaknesses.push('Inconsistent weekly sales activity.');
    nextSteps.push('Log sales transactions consistently each week to stabilize your business profile.');
  }

  // Cashflow/Runway Feedback
  if (runwayDays >= 30) {
    strengths.push('Healthy cash runway (30+ days of reserves).');
  } else if (runwayDays < 14) {
    weaknesses.push('Short cash runway reserves (less than 14 days).');
    nextSteps.push('Delay large stock orders or non-essential cash payouts to protect runway.');
  } else {
    strengths.push('Stable cash runway profile.');
  }

  // Stability Feedback
  if (volatilityRatio < 0.3) {
    strengths.push('Stable operating expense run-rate month-over-month.');
  } else if (volatilityRatio > 0.7) {
    weaknesses.push('Highly volatile month-over-month cash outflows.');
    nextSteps.push('Stabilize weekly spending; schedule recurring payments to reduce volatility.');
  }

  // Growth Feedback
  if (revGrowth > 5) {
    strengths.push('Positive inbound revenue growth rate.');
  } else if (revGrowth <= 0) {
    weaknesses.push('Declining or flat revenue trends.');
    nextSteps.push('Review low-performing sales days and offer client discounts or promotions.');
  }

  // Credit Readiness Feedback
  if (ratio >= 1.1) {
    strengths.push('Transaction inflows comfortably cover all debt and outflow commitments.');
  } else if (ratio < 1.0) {
    weaknesses.push('Expenses outpace revenues over the past 60 days.');
    nextSteps.push('Audit supplier costs and cut operational spending to return to positive net balance.');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Maintain current operating habits and keep debt low.');
  }

  return {
    score: finalScore,
    riskLevel,
    strengths,
    weaknesses,
    nextSteps,
    breakdown: {
      consistency: consistencyScore,
      cashflow: runwayScore,
      stability: stabilityScore,
      growth: growthScore,
      credit: creditScorePart
    }
  };
}

export function calculateForecast(transactions: TransactionData[]): ForecastData {
  const completed = transactions.filter(t => t.status === 'COMPLETED');
  const now = new Date();
  
  // Calculate average weekly inflows/outflows over past 8 weeks
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
  const relevantTx = completed.filter(t => new Date(t.date) >= eightWeeksAgo);
  
  let totalInflow = 0;
  let totalOutflow = 0;
  for (const t of relevantTx) {
    if (t.direction === 'INFLOW') {
      totalInflow += t.amount;
    } else {
      totalOutflow += t.amount;
    }
  }
  
  // Find span of days in relevant transactions to scale correctly
  let daysSpan = 56;
  if (relevantTx.length >= 2) {
    const dates = relevantTx.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 5) daysSpan = Math.min(56, diffDays);
  }
  
  const dailyInflow = totalInflow / Math.max(1, daysSpan);
  const dailyOutflow = totalOutflow / Math.max(1, daysSpan);
  
  const forecastedMonthlyInflow = Math.round(dailyInflow * 30);
  const forecastedMonthlyOutflow = Math.round(dailyOutflow * 30);
  const netForecastedPosition = forecastedMonthlyInflow - forecastedMonthlyOutflow;
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let warning = 'Stable projected cash forecast. Expected inflows will cover monthly operations.';
  
  if (netForecastedPosition < 0) {
    riskLevel = 'HIGH';
    warning = 'Forecasted monthly outflows exceed expected inflows. Consider reducing overhead or auditing vendor rates.';
  } else if (forecastedMonthlyInflow > 0 && (netForecastedPosition / forecastedMonthlyInflow) < 0.1) {
    riskLevel = 'MEDIUM';
    warning = 'Tight cash forecast. Projected inflows barely cover monthly expenses.';
  }
  
  return {
    forecastedMonthlyInflow,
    forecastedMonthlyOutflow,
    netForecastedPosition,
    riskLevel,
    warning,
  };
}
