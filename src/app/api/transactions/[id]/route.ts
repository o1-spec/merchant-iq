import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { transactionSchema } from '@/lib/validation';

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

    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.merchantId !== merchantId) {
      return errorResponse('Transaction not found', 404);
    }

    const body = await req.json();

    
    const toValidate = {
      amount: body.amount !== undefined ? body.amount : transaction.amount,
      type: body.type !== undefined ? body.type : transaction.type,
      category: body.category !== undefined ? body.category : transaction.category,
      description: body.description !== undefined ? body.description : transaction.description,
      date: body.date !== undefined ? body.date : transaction.date,
      source: body.source !== undefined ? body.source : transaction.source,
      paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : transaction.paymentMethod,
      direction: body.direction !== undefined ? body.direction : transaction.direction,
      status: body.status !== undefined ? body.status : transaction.status,
    };

    const result = transactionSchema.safeParse(toValidate);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const data = result.data;

    
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
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

    return successResponse({ transaction: updatedTransaction });
  } catch (err) {
    const error = err as Error;
    console.error('Update transaction error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

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

    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.merchantId !== merchantId) {
      return errorResponse('Transaction not found', 404);
    }

    
    await prisma.transaction.delete({
      where: { id },
    });

    return successResponse({ message: 'Transaction deleted successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('Delete transaction error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
