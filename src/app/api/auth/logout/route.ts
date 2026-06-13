import { successResponse, errorResponse } from '@/lib/response';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearAuthCookie();
    return successResponse({ message: 'Logged out successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('Logout error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
