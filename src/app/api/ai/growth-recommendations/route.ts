import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, calculateCashflow, TransactionData } from '@/lib/analytics';
import { generateGeminiText } from '@/lib/gemini';
import { buildGrowthRecommendationsPrompt } from '@/lib/ai-prompts';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
    });

    const txData = transactions as unknown as TransactionData[];

    
    const summary = calculateSummary(txData);
    const cashflow = calculateCashflow(txData);

    let forceRegenerate = false;
    try {
      const body = await req.json();
      forceRegenerate = !!body.forceRegenerate;
    } catch {
      
    }

    if (!forceRegenerate) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const existingInsight = await prisma.insight.findFirst({
        where: {
          merchantId: merchant.id,
          category: 'GROWTH_RECOMMENDATION',
          createdAt: {
            gte: startOfToday,
          },
        },
      });

      if (existingInsight) {
        return successResponse({
          insight: existingInsight,
          recommendations: existingInsight.content,
        });
      }
    }

    
    const prompt = buildGrowthRecommendationsPrompt({
      merchant,
      summary,
      cashflow,
      transactions: txData,
    });

    
    const recommendationsText = await generateGeminiText(prompt);

    
    const insight = await prisma.insight.create({
      data: {
        merchantId: merchant.id,
        title: `Growth Recommendations - ${new Date().toLocaleDateString('en-NG')}`,
        content: recommendationsText,
        category: 'GROWTH_RECOMMENDATION',
        type: 'AI',
      },
    });

    return successResponse({
      insight,
      recommendations: recommendationsText,
    });
  } catch (err) {
    const error = err as Error;
    console.error('AI Growth Recommendations error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
