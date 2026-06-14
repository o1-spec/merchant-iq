import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { preferencesUpdateSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const body = await req.json();
    const result = preferencesUpdateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    const updateData: {
      currency?: string;
      alertThreshold?: number;
      smsNotifications?: boolean;
    } = {};

    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold;
    if (data.smsNotifications !== undefined) updateData.smsNotifications = data.smsNotifications;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        currency: true,
        alertThreshold: true,
        smsNotifications: true,
      },
    });

    return successResponse({ preferences: updatedMerchant });
  } catch (err) {
    const error = err as Error;
    console.error('Update merchant preferences error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
