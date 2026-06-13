import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category') || undefined;

    const where: { merchantId: string; category?: string } = {
      merchantId,
    };

    if (category) {
      where.category = category;
    }

    const insights = await prisma.insight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ insights });
  } catch (err) {
    const error = err as Error;
    console.error('Fetch insights error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
