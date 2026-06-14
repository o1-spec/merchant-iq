import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateCreditReadiness, TransactionData } from '@/lib/analytics';

const LENDERS = [
  {
    id: 'lender-renmoney',
    name: 'Renmoney Business Loans',
    logo: 'R',
    minScore: 650,
    baseInterestRate: 3.5, // monthly %
    maxLoanMultiplier: 1.5, // 1.5x of monthly revenue
    repaymentTerm: '3 to 24 months',
    description: 'Provides convenient loans for small business expansion and inventory purchases.',
  },
  {
    id: 'lender-fairmoney',
    name: 'FairMoney SME Retailer Credit',
    logo: 'F',
    minScore: 550,
    baseInterestRate: 4.5,
    maxLoanMultiplier: 0.8,
    repaymentTerm: '1 to 12 months',
    description: 'Designed for quick cash injection, inventory restocking, and urgent working capital.',
  },
  {
    id: 'lender-carbon',
    name: 'Carbon Capital Growth Loan',
    logo: 'C',
    minScore: 600,
    baseInterestRate: 4.0,
    maxLoanMultiplier: 1.2,
    repaymentTerm: '2 to 12 months',
    description: 'Quick access to business finance to buy equipment, rent space, or expand your stock.',
  },
  {
    id: 'lender-rensource',
    name: 'RenSource Asset & Equipment Finance',
    logo: 'S',
    minScore: 700,
    baseInterestRate: 2.8,
    maxLoanMultiplier: 2.5,
    repaymentTerm: '6 to 36 months',
    description: 'Higher limits and lower interest rates for established merchants needing asset upgrades.',
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
    const creditReadiness = calculateCreditReadiness(txData);

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

    const offers = LENDERS.map(l => {
      const eligible = creditReadiness.score >= l.minScore;
      let rate = l.baseInterestRate;
      
      // Adjust interest rate dynamically based on credit score strength
      if (creditReadiness.score >= 750) {
        rate = Math.max(1.5, rate - 0.8);
      } else if (creditReadiness.score >= 700) {
        rate = Math.max(2.0, rate - 0.4);
      } else if (creditReadiness.score < 600) {
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
          ? 'You meet the minimum credit requirements.' 
          : `Requires a score of ${l.minScore} (Current: ${creditReadiness.score}).`,
      };
    });

    return successResponse({
      creditScore: creditReadiness.score,
      riskLevel: creditReadiness.riskLevel,
      monthlyRevenueEst: Math.round(revenue30),
      lenders: offers,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Get credit lenders error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
