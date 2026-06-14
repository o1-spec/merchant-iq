import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { loanApplicationSchema } from '@/lib/validation';
import { calculateCreditReadiness, TransactionData } from '@/lib/analytics';

const LENDERS = [
  { id: 'lender-renmoney', name: 'Renmoney Business Loans', minScore: 650, maxLoanMultiplier: 1.5 },
  { id: 'lender-fairmoney', name: 'FairMoney SME Retailer Credit', minScore: 550, maxLoanMultiplier: 0.8 },
  { id: 'lender-carbon', name: 'Carbon Capital Growth Loan', minScore: 600, maxLoanMultiplier: 1.2 },
  { id: 'lender-rensource', name: 'RenSource Asset & Equipment Finance', minScore: 700, maxLoanMultiplier: 2.5 },
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
    const lender = LENDERS.find(l => l.id === lenderId);
    if (!lender) {
      return errorResponse('Lender not found', 404);
    }

    // Fetch transactions to compute credit status
    const transactions = await prisma.transaction.findMany({
      where: { merchantId },
    });
    const txData = transactions as unknown as TransactionData[];
    const creditReadiness = calculateCreditReadiness(txData);

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

    const maxAmount = revenue30 * lender.maxLoanMultiplier;

    // Decision Engine
    let status = 'PENDING';
    let rejectionReason = '';

    if (creditReadiness.score < lender.minScore) {
      status = 'REJECTED';
      rejectionReason = `Credit score (${creditReadiness.score}) is below the lender's minimum requirement of ${lender.minScore}.`;
    } else if (requestedAmount > maxAmount * 1.1) {
      status = 'REJECTED';
      rejectionReason = `Requested amount exceeds the maximum qualified limit for this lender (Limit: ₦${Math.round(maxAmount).toLocaleString()}).`;
    } else if (creditReadiness.score >= 700) {
      status = 'APPROVED';
    } else {
      status = 'PENDING'; // Needs manual review
    }

    const packagedProfile = {
      creditScore: creditReadiness.score,
      riskRating: creditReadiness.riskLevel,
      monthlyRevenueEst: Math.round(revenue30),
      qualifiedMaxAmount: Math.round(maxAmount),
      strengths: creditReadiness.strengths,
      weaknesses: creditReadiness.weaknesses,
      rejectionReason: rejectionReason || undefined,
    };

    const application = await prisma.loanApplication.create({
      data: {
        merchantId,
        lenderId,
        lenderName: lender.name,
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
