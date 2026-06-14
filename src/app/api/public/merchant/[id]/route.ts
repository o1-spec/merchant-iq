import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateBusinessHealth, TransactionData } from '@/lib/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return errorResponse('Merchant not found', 404);
    }

    const transactions = await prisma.transaction.findMany({
      where: { merchantId: id },
      orderBy: { date: 'desc' },
    });

    const txData = transactions as unknown as TransactionData[];
    const businessHealth = calculateBusinessHealth(txData);

    // Calculate verified duration
    let verifiedDuration = 'No records';
    if (transactions.length > 0) {
      const earliestTx = transactions[transactions.length - 1];
      const latestTx = transactions[0];
      const diffTime = Math.abs(latestTx.date.getTime() - earliestTx.date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        verifiedDuration = `${diffDays} days`;
      } else if (diffDays <= 30) {
        verifiedDuration = `${Math.round(diffDays / 7)} weeks`;
      } else {
        const months = Math.round(diffDays / 30);
        verifiedDuration = `${months} ${months === 1 ? 'month' : 'months'}`;
      }
    }

    // Calculate active weeks out of last 8
    const completed = txData.filter(t => t.status === 'COMPLETED');
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

    const consistencyPercentage = Math.round((activeWeeks / 8) * 100);

    return successResponse({
      id: merchant.id,
      businessName: merchant.businessName,
      businessType: merchant.businessType,
      businessCategory: merchant.businessCategory,
      location: merchant.location,
      verifiedDuration,
      verifiedAt: merchant.updatedAt.toISOString(),
      businessHealth: {
        score: businessHealth.score,
        riskLevel: businessHealth.riskLevel,
        strengths: businessHealth.strengths,
      },
      consistency: {
        activeWeeks,
        percentage: consistencyPercentage,
      },
      riskBand: `${businessHealth.riskLevel} RISK`,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Public merchant fetch error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
