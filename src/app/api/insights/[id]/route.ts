import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function DELETE(
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

    // Find the insight record
    const insight = await prisma.insight.findUnique({
      where: { id },
    });

    // Verify ownership
    if (!insight || insight.merchantId !== merchantId) {
      return errorResponse('Insight not found', 404);
    }

    // Delete it safely
    await prisma.insight.delete({
      where: { id },
    });

    return successResponse({ message: 'Insight deleted successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('Delete insight error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
