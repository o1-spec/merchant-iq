import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { transactionSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const type = searchParams.get('type') || undefined;
    const direction = searchParams.get('direction') || undefined;
    const category = searchParams.get('category') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const where: {
      merchantId: string;
      type?: string;
      direction?: string;
      category?: string;
      date?: { gte?: Date; lte?: Date };
    } = {
      merchantId,
    };

    if (type) {
      where.type = type;
    }
    if (direction) {
      where.direction = direction;
    }
    if (category) {
      where.category = category;
    }

    if (startDateStr || endDateStr) {
      where.date = {};
      if (startDateStr) {
        where.date.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        where.date.lte = new Date(endDateStr);
      }
    }

    const skip = (page - 1) * limit;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return successResponse({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error('Fetch transactions error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    const body = await req.json();
    const result = transactionSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    const transaction = await prisma.transaction.create({
      data: {
        merchantId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        description: data.description || null,
        date: data.date ? new Date(data.date) : new Date(),
        source: data.source,
        paymentMethod: data.paymentMethod,
        direction: data.direction,
        status: data.status,
      },
    });

    return successResponse({ transaction }, 201);
  } catch (err) {
    const error = err as Error;
    console.error('Create transaction error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
