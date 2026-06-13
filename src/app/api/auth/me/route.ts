import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    return successResponse({ user });
  } catch (err) {
    const error = err as Error;
    console.error('Auth check error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
