import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        hasCompletedOnboarding: true,
      },
      select: {
        id: true,
        businessName: true,
        hasCompletedOnboarding: true,
      },
    });

    return successResponse({ merchant: updatedMerchant });
  } catch (err) {
    const error = err as Error;
    console.error('Update onboarding error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
