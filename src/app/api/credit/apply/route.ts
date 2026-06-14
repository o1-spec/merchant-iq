import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { loanApplicationSchema } from '@/lib/validation';
import { calculateBusinessHealth, TransactionData } from '@/lib/analytics';

const SCENARIOS = [
  { id: 'tier-conservative', name: 'Scenario A: Conservative Capacity', minScore: 50, maxLoanMultiplier: 0.8 },
  { id: 'tier-growth', name: 'Scenario B: Growth Capacity', minScore: 65, maxLoanMultiplier: 1.5 },
  { id: 'tier-expansion', name: 'Scenario C: Expansion Capacity', minScore: 80, maxLoanMultiplier: 2.5 },
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const body = await req.json();
    const result = loanApplicationSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const { lenderId, requestedAmount } = result.data;
    const scenario = SCENARIOS.find(l => l.id === lenderId);
    if (!scenario) {
      return errorResponse('Funding scenario not found', 404);
    }

    // Fetch transactions to compute credit status
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
    });
    const txData = transactions as unknown as TransactionData[];
    const businessHealth = calculateBusinessHealth(txData);

    // Compute monthly revenue
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
    if (revenue30 === 0) {
      revenue30 = 100000; // base default
    }

    const maxAmount = revenue30 * scenario.maxLoanMultiplier;

    // Decision Engine (0-100 scale)
    let status = 'PENDING';
    let rejectionReason = '';

    if (businessHealth.score < scenario.minScore) {
      status = 'REJECTED';
      rejectionReason = `Business Health score (${businessHealth.score}) is below the minimum required score of ${scenario.minScore} for this tier.`;
    } else if (requestedAmount > maxAmount * 1.1) {
      status = 'REJECTED';
      rejectionReason = `Requested amount exceeds the maximum qualified capacity for this scenario (Capacity: ₦${Math.round(maxAmount).toLocaleString()}).`;
    } else if (businessHealth.score >= 80) {
      status = 'APPROVED';
    } else {
      status = 'PENDING'; // Needs review
    }

    const packagedProfile = {
      creditScore: businessHealth.score,
      riskRating: businessHealth.riskLevel,
      monthlyRevenueEst: Math.round(revenue30),
      qualifiedMaxAmount: Math.round(maxAmount),
      strengths: businessHealth.strengths,
      weaknesses: businessHealth.weaknesses,
      rejectionReason: rejectionReason || undefined,
    };

    const application = await prisma.loanApplication.create({
      data: {
        merchantId,
        lenderId,
        lenderName: scenario.name,
        requestedAmount,
        status,
        packagedProfile: JSON.stringify(packagedProfile),
      },
    });

    return successResponse({
      application: {
        id: application.id,
        lenderName: application.lenderName,
        requestedAmount: application.requestedAmount,
        status: application.status,
        packagedProfile,
        createdAt: application.createdAt,
      }
    });
  } catch (err) {
    const error = err as Error;
    console.error('Submit loan application error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
