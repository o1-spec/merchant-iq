import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, TransactionData } from '@/lib/analytics';

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

    const summary = calculateSummary(transactions as unknown as TransactionData[]);

    return successResponse(summary);
  } catch (err) {
    const error = err as Error;
    console.error('Analytics summary error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
