import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateCreditReadiness, TransactionData } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
    });

    const txData = transactions as unknown as TransactionData[];

    
    const creditReadiness = calculateCreditReadiness(txData);

    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const completed = txData.filter(t => t.status === 'COMPLETED');
    
    let revenue30 = 0;
    let outflow30 = 0;
    for (const t of completed) {
      const tDate = new Date(t.date);
      if (tDate >= thirtyDaysAgo) {
        if (t.direction === 'INFLOW') {
          revenue30 += t.amount;
        } else {
          outflow30 += t.amount;
        }
      }
    }

    const dscr = outflow30 > 0 ? Math.round((revenue30 / outflow30) * 100) / 100 : 2.0;
    const recommendedLoan = Math.round((revenue30 * 1.5) * 100) / 100;

    
    const profile = await prisma.creditProfile.upsert({
      where: { merchantId },
      update: {
        creditScore: creditReadiness.score,
        riskRating: creditReadiness.riskLevel,
        debtServiceCoverageRatio: dscr,
        recommendedLoanAmount: recommendedLoan,
        analysisDetails: JSON.stringify({
          strengths: creditReadiness.strengths,
          weaknesses: creditReadiness.weaknesses,
          nextSteps: creditReadiness.nextSteps,
          monthlyRevenue30: revenue30,
        }),
      },
      create: {
        merchantId,
        creditScore: creditReadiness.score,
        riskRating: creditReadiness.riskLevel,
        debtServiceCoverageRatio: dscr,
        totalDebt: 0.0,
        recommendedLoanAmount: recommendedLoan,
        analysisDetails: JSON.stringify({
          strengths: creditReadiness.strengths,
          weaknesses: creditReadiness.weaknesses,
          nextSteps: creditReadiness.nextSteps,
          monthlyRevenue30: revenue30,
        }),
      },
    });

    return successResponse({
      ...creditReadiness,
      profileId: profile.id,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Analytics credit readiness error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
