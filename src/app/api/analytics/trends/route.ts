import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchantId = user.merchant.id;

    
    const transactions = await prisma.transaction.findMany({
      where: {
        merchantId,
        status: 'COMPLETED',
      },
      orderBy: {
        date: 'asc',
      },
    });

    
    const dailyRevMap: Record<string, number> = {};
    const dailyExpMap: Record<string, number> = {};
    const monthlyRevMap: Record<string, number> = {};
    const catBreakdownMap: Record<string, { category: string; amount: number; direction: string }> = {};

    for (const t of transactions) {
      const dateStr = new Date(t.date).toISOString().split('T')[0]; 
      const monthStr = dateStr.substring(0, 7); 

      if (t.direction === 'INFLOW') {
        dailyRevMap[dateStr] = (dailyRevMap[dateStr] || 0) + t.amount;
        monthlyRevMap[monthStr] = (monthlyRevMap[monthStr] || 0) + t.amount;
      } else {
        dailyExpMap[dateStr] = (dailyExpMap[dateStr] || 0) + t.amount;
      }

      const catKey = `${t.direction}-${t.category}`;
      if (!catBreakdownMap[catKey]) {
        catBreakdownMap[catKey] = {
          category: t.category,
          amount: 0,
          direction: t.direction,
        };
      }
      catBreakdownMap[catKey].amount += t.amount;
    }

    const dailyRevenue = Object.entries(dailyRevMap).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    const dailyExpenses = Object.entries(dailyExpMap).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    const monthlyRevenue = Object.entries(monthlyRevMap).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100,
    }));

    const categoryBreakdown = Object.values(catBreakdownMap).map((c) => ({
      category: c.category,
      amount: Math.round(c.amount * 100) / 100,
      direction: c.direction,
    }));

    return successResponse({
      dailyRevenue,
      dailyExpenses,
      monthlyRevenue,
      categoryBreakdown,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Analytics trends error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
