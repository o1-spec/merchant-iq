import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, calculateCashflow, calculateCreditReadiness, TransactionData } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
      orderBy: { date: 'desc' },
    });

    
    const aiInsights = await prisma.insight.findMany({
      where: {
        merchantId: merchant.id,
        type: 'AI',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    
    const txData = transactions as unknown as TransactionData[];
    const summary = calculateSummary(txData);
    const cashflow = calculateCashflow(txData);
    const creditReadiness = calculateCreditReadiness(txData);

    return successResponse({
      merchant,
      summary,
      cashflow,
      creditReadiness,
      aiInsights,
      generatedAt: new Date(),
    });
  } catch (err) {
    const error = err as Error;
    console.error('Business health report generation error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
