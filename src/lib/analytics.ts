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

export interface CreditReadinessData {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
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

export function calculateCashflow(transactions: TransactionData[]): CashflowData {
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

  
  const now = new Date();
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

export function calculateCreditReadiness(transactions: TransactionData[]): CreditReadinessData {
  const completed = transactions.filter(t => t.status === 'COMPLETED');
  const now = new Date();

  
  
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
  const consistencyScore = (activeWeeks / 8) * 25;

  
  
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let inflow30 = 0;
  let outflow30 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= thirtyDaysAgo) {
      if (t.direction === 'INFLOW') {
        inflow30 += t.amount;
      } else {
        outflow30 += t.amount;
      }
    }
  }
  const netProfitPast30 = inflow30 - outflow30;
  let profitScore = 0;
  if (netProfitPast30 > 200000) {
    profitScore = 25;
  } else if (netProfitPast30 > 50000) {
    profitScore = 15;
  } else if (netProfitPast30 > 0) {
    profitScore = 10;
  }

  
  
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
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
  let ratioScore = 0;
  if (ratio >= 1.2) {
    ratioScore = 20;
  } else if (ratio >= 1.05) {
    ratioScore = 15;
  } else if (ratio >= 1.0) {
    ratioScore = 10;
  }

  
  let historyScore = 0;
  let durationDays = 0;
  if (completed.length >= 2) {
    const dates = completed.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    durationDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24));

    if (durationDays >= 60) {
      historyScore = 15;
    } else if (durationDays >= 30) {
      historyScore = 10;
    } else if (durationDays >= 14) {
      historyScore = 5;
    }
  }

  
  
  let outflowPrev60 = 0;
  for (const t of completed) {
    const tDate = new Date(t.date);
    if (tDate >= sixtyDaysAgo && tDate < thirtyDaysAgo) {
      if (t.direction === 'OUTFLOW') {
        outflowPrev60 += t.amount;
      }
    }
  }
  const volatilityRatio = outflowPrev60 > 0 ? Math.abs(outflow30 - outflowPrev60) / outflowPrev60 : 0;
  let volatilityScore = 0;
  if (volatilityRatio < 0.2) {
    volatilityScore = 15;
  } else if (volatilityRatio < 0.5) {
    volatilityScore = 10;
  } else if (volatilityRatio < 1.0) {
    volatilityScore = 5;
  }

  
  const subScoreSum = consistencyScore + profitScore + ratioScore + historyScore + volatilityScore;
  const creditScore = Math.min(850, Math.max(300, 300 + Math.round(subScoreSum * 5.5)));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'HIGH';
  if (creditScore >= 700) {
    riskLevel = 'LOW';
  } else if (creditScore >= 550) {
    riskLevel = 'MEDIUM';
  }

  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const nextSteps: string[] = [];

  if (activeWeeks >= 6) {
    strengths.push('Consistent weekly transaction history logged.');
  } else {
    weaknesses.push('Inconsistent week-over-week sales logging.');
    nextSteps.push('Log transactions daily to establish a steady, active weekly profile.');
  }

  if (netProfitPast30 > 100000) {
    strengths.push('Strong monthly net profitability margins.');
  } else if (netProfitPast30 <= 0) {
    weaknesses.push('Net loss or negative cash flow balance over the last 30 days.');
    nextSteps.push('Implement operational cost cutting or optimize pricing to return to net profit.');
  } else {
    strengths.push('Maintained positive net cash flow.');
  }

  if (ratio >= 1.15) {
    strengths.push('Revenue inflows comfortably exceed cash outflows.');
  } else if (ratio < 1.0) {
    weaknesses.push('Expense outflows exceed inbound revenue.');
    nextSteps.push('Track cash allocation to ensure outflows do not outpace revenue.');
  }

  if (durationDays >= 45) {
    strengths.push('Established business activity history (45+ days).');
  } else {
    weaknesses.push('Limited transaction record history length.');
    nextSteps.push('Keep utilizing MerchantIQ for regular accounting to build credit history duration.');
  }

  if (volatilityRatio < 0.3) {
    strengths.push('Stable expense run-rate month-over-month.');
  } else if (volatilityRatio > 0.8) {
    weaknesses.push('High volatility in monthly business expenses.');
    nextSteps.push('Plan bulk purchases or utility payments to stabilize monthly cash outflows.');
  }

  if (nextSteps.length === 0) {
    nextSteps.push('Maintain current operating habits and keep debt low.');
  }

  return {
    score: creditScore,
    riskLevel,
    strengths,
    weaknesses,
    nextSteps,
  };
}
