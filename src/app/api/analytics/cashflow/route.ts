import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateCashflow, TransactionData } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    // Fetch all transactions for the current merchant
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
    });

    const cashflow = calculateCashflow(transactions as unknown as TransactionData[]);

    return successResponse(cashflow);
  } catch (err) {
    const error = err as Error;
    console.error('Analytics cashflow error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
