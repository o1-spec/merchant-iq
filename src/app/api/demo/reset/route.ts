import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { seedDemoMerchantData } from '@/lib/demo-data';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }

    
    if (user.email !== 'demo@merchantiq.app' && user.role !== 'JUDGE') {
      return errorResponse('Forbidden: Only the demo merchant account or judges can reset the demo data.', 403);
    }

    const merchantId = user.merchant.id;

    
    const result = await seedDemoMerchantData(merchantId);

    return successResponse({
      message: 'Demo environment reset and seeded successfully.',
      ...result
    });
  } catch (err) {
    const error = err as Error;
    console.error('Demo reset error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
