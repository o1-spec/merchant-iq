import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateBusinessHealth, TransactionData } from '@/lib/analytics';

const SCENARIOS = [
  {
    id: 'tier-conservative',
    name: 'Scenario A: Conservative Capacity',
    logo: 'A',
    minScore: 50,
    baseInterestRate: 4.5, // monthly %
    maxLoanMultiplier: 0.8, // 0.8x of monthly revenue
    repaymentTerm: '1 to 12 months',
    description: 'Based on current cash runway and transaction consistency.',
  },
  {
    id: 'tier-growth',
    name: 'Scenario B: Growth Capacity',
    logo: 'B',
    minScore: 65,
    baseInterestRate: 3.5,
    maxLoanMultiplier: 1.5,
    repaymentTerm: '3 to 24 months',
    description: 'Estimated capacity achievable if Business Health improves to 65+.',
  },
  {
    id: 'tier-expansion',
    name: 'Scenario C: Expansion Capacity',
    logo: 'C',
    minScore: 80,
    baseInterestRate: 2.8,
    maxLoanMultiplier: 2.5,
    repaymentTerm: '6 to 36 months',
    description: 'Estimated capacity achievable if Business Health improves to 80+.',
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    // Fetch transactions to compute latest credit status
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
    });
    const txData = transactions as unknown as TransactionData[];
    const businessHealth = calculateBusinessHealth(txData);

    // Calculate real monthly Business Health history trend
    let earliestTxDate: Date | null = null;
    const completedTxs = txData.filter(t => t.status === 'COMPLETED');
    if (completedTxs.length > 0) {
      const dates = completedTxs.map(t => new Date(t.date).getTime());
      earliestTxDate = new Date(Math.min(...dates));
    }

    const healthHistory: { month: string; score: number }[] = [];
    if (earliestTxDate) {
      const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
        const year = targetDate.getFullYear();
        const monthIdx = targetDate.getMonth();
        const monthName = monthsList[monthIdx];
        
        const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
        const earliestTxMonthStart = new Date(earliestTxDate.getFullYear(), earliestTxDate.getMonth(), 1, 0, 0, 0, 0);
        
        if (monthEnd < earliestTxMonthStart) {
          continue;
        }
        
        const isCurrentMonth = year === now.getFullYear() && monthIdx === now.getMonth();
        const refDate = isCurrentMonth ? now : monthEnd;
        
        const filteredTx = txData.filter(t => new Date(t.date) <= refDate);
        const healthForMonth = calculateBusinessHealth(filteredTx, refDate);
        
        healthHistory.push({
          month: monthName,
          score: healthForMonth.score,
        });
      }
    }

    // Compute monthly revenue run-rate (past 30 days completed inflows)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const completed = txData.filter(t => t.status === 'COMPLETED');
    
    let revenue30 = 0;
    for (const t of completed) {
      const tDate = new Date(t.date);
      if (tDate >= thirtyDaysAgo && t.direction === 'INFLOW') {
        revenue30 += t.amount;
      }
    }

    // Fallback if no recent transactions to prevent dividing or outputting zeros
    if (revenue30 === 0 && completed.length > 0) {
      // average from all completed inflows
      const inflows = completed.filter(t => t.direction === 'INFLOW');
      if (inflows.length > 0) {
        const totalInflows = inflows.reduce((sum, t) => sum + t.amount, 0);
        revenue30 = totalInflows / Math.max(1, completed.length / 10); // estimate monthly
      }
    }
    if (revenue30 === 0) {
      revenue30 = 100000; // base default for calculation
    }

    const offers = SCENARIOS.map(l => {
      const eligible = businessHealth.score >= l.minScore;
      let rate = l.baseInterestRate;
      
      // Adjust interest rate dynamically based on health score strength (0-100 scale)
      if (businessHealth.score >= 80) {
        rate = Math.max(1.5, rate - 0.8);
      } else if (businessHealth.score >= 65) {
        rate = Math.max(2.0, rate - 0.4);
      } else if (businessHealth.score < 50) {
        rate = rate + 0.5;
      }
      rate = Math.round(rate * 10) / 10;

      const maxAmount = eligible ? Math.round((revenue30 * l.maxLoanMultiplier) / 1000) * 1000 : 0;

      return {
        id: l.id,
        name: l.name,
        logo: l.logo,
        minScore: l.minScore,
        interestRate: rate,
        maxAmount,
        repaymentTerm: l.repaymentTerm,
        description: l.description,
        eligible,
        reason: eligible 
          ? 'You meet the minimum health requirements for this scenario.' 
          : `Requires a Business Health score of ${l.minScore} (Current: ${businessHealth.score}).`,
      };
    });

    const eligibleOffers = offers.filter(o => o.eligible);
    let minCapacity = 0;
    let maxCapacity = 0;
    if (eligibleOffers.length > 0) {
      maxCapacity = Math.max(...eligibleOffers.map(o => o.maxAmount));
      minCapacity = Math.round((revenue30 * 0.3) / 1000) * 1000;
      if (minCapacity >= maxCapacity) {
        minCapacity = Math.round(maxCapacity * 0.5);
      }
    }

    // Determine readiness rating confidence
    let fundingReadiness: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (businessHealth.score >= 65) {
      fundingReadiness = 'HIGH';
    } else if (businessHealth.score >= 50) {
      fundingReadiness = 'MEDIUM';
    }

    const applications = await prisma.loanApplication.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      creditScore: businessHealth.score,
      riskLevel: businessHealth.riskLevel,
      monthlyRevenueEst: Math.round(revenue30),
      fundingReadiness,
      minCapacity,
      maxCapacity,
      lenders: offers,
      applications: applications.map(app => ({
        id: app.id,
        lenderId: app.lenderId,
        lenderName: app.lenderName,
        requestedAmount: app.requestedAmount,
        status: app.status,
        packagedProfile: JSON.parse(app.packagedProfile),
        createdAt: app.createdAt.toISOString(),
      })),
      businessHealth,
      healthHistory,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Get credit lenders error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
