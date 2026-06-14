import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { passwordUpdateSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const result = passwordUpdateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const { currentPassword, newPassword } = result.data;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      return errorResponse('User not found', 404);
    }

    const isMatch = await comparePassword(currentPassword, fullUser.passwordHash);
    if (!isMatch) {
      return errorResponse('Incorrect current password', 400);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return successResponse({ message: 'Password updated successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('Update password error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
