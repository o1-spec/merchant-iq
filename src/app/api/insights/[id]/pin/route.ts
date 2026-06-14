import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const { id } = await params;

    
    const insight = await prisma.insight.findUnique({
      where: { id },
    });

    
    if (!insight || insight.merchantId !== merchantId) {
      return errorResponse('Insight not found', 404);
    }

    
    const updatedInsight = await prisma.insight.update({
      where: { id },
      data: {
        isPinned: !insight.isPinned,
      },
    });

    return successResponse({ insight: updatedInsight });
  } catch (err) {
    const error = err as Error;
    console.error('Pin toggle insight error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
