import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { generateSampleTransactions } from '@/lib/demo-data';

const DEMO_EMAIL = 'demo@merchantiq.app';
const DEMO_PASSWORD = 'DemoPass123';

export async function POST() {
  try {
    
    let user = await prisma.user.findUnique({
      where: { email: DEMO_EMAIL },
      include: { merchant: true },
    });

    if (!user) {
      const passwordHash = await hashPassword(DEMO_PASSWORD);
      user = await prisma.user.create({
        data: {
          name: 'Demo Provision Store Admin',
          email: DEMO_EMAIL,
          passwordHash,
          role: 'JUDGE',
          merchant: {
            create: {
              businessName: 'Demo Provision Store',
              businessType: 'Retail',
              businessCategory: 'Convenience & Provision Store',
              location: 'Lagos, Nigeria',
            },
          },
        },
        include: { merchant: true },
      });
    }

    const merchant = user.merchant;
    if (!merchant) {
      return errorResponse('Demo merchant profile missing', 500);
    }

    
    await prisma.transaction.deleteMany({
      where: { merchantId: merchant.id },
    });

    
    const sampleTransactions = generateSampleTransactions(merchant.id, 200);
    
    
    await prisma.transaction.createMany({
      data: sampleTransactions,
    });

    
    const existingProfile = await prisma.creditProfile.findUnique({
      where: { merchantId: merchant.id },
    });
    
    if (!existingProfile) {
      await prisma.creditProfile.create({
        data: {
          merchantId: merchant.id,
          creditScore: 720,
          riskRating: 'LOW',
          debtServiceCoverageRatio: 2.4,
          totalDebt: 500000.0,
          recommendedLoanAmount: 2500000.0,
          analysisDetails: JSON.stringify({
            paymentHistory: 'Excellent',
            debtToIncome: '15%',
            monthlyRevenueAvg: 1800000.0,
            growthTrend: 'Positive (+12% MoM)'
          }),
        }
      });
    }

    
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { merchant: true },
    });

    if (!updatedUser) {
      return errorResponse('Demo user retrieval error', 500);
    }

    
    const token = signToken({ userId: updatedUser.id, role: updatedUser.role });

    
    await setAuthCookie(token);

    
    const safeUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      merchant: updatedUser.merchant,
    };

    return successResponse({ user: safeUser });
  } catch (err) {
    const error = err as Error;
    console.error('Demo login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
