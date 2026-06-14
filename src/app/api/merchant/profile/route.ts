import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { profileUpdateSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    
    const merchant = user.merchant;
    return successResponse({
      id: merchant.id,
      businessName: merchant.businessName,
      businessType: merchant.businessType,
      businessCategory: merchant.businessCategory,
      location: merchant.location,
      createdAt: merchant.createdAt,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Get merchant profile error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const body = await req.json();
    const result = profileUpdateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    
    const updateData: {
      businessName?: string;
      businessType?: string;
      businessCategory?: string;
      location?: string;
    } = {};
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessType !== undefined) updateData.businessType = data.businessType;
    if (data.businessCategory !== undefined) updateData.businessCategory = data.businessCategory;
    if (data.location !== undefined) updateData.location = data.location;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        businessName: true,
        businessType: true,
        businessCategory: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ merchant: updatedMerchant });
  } catch (err) {
    const error = err as Error;
    console.error('Update merchant profile error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
