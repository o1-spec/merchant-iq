import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, calculateCashflow, calculateCreditReadiness, TransactionData } from '@/lib/analytics';
import { generateGeminiText } from '@/lib/gemini';
import { buildMorningBriefPrompt } from '@/lib/ai-prompts';

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
    const creditReadiness = calculateCreditReadiness(txData);

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
          category: 'MORNING_BRIEF',
          createdAt: {
            gte: startOfToday,
          },
        },
      });

      if (existingInsight) {
        return successResponse({
          insight: existingInsight,
          brief: existingInsight.content,
          context: {
            summary,
            cashflow,
            creditReadiness,
          },
        });
      }
    }

    
    const prompt = buildMorningBriefPrompt({
      merchant,
      summary,
      cashflow,
      creditReadiness,
    });

    
    const briefText = await generateGeminiText(prompt);

    
    const insight = await prisma.insight.create({
      data: {
        merchantId: merchant.id,
        title: `Morning Brief - ${new Date().toLocaleDateString('en-NG')}`,
        content: briefText,
        category: 'MORNING_BRIEF',
        type: 'AI',
      },
    });

    return successResponse({
      insight,
      brief: briefText,
      context: {
        summary,
        cashflow,
        creditReadiness,
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error('AI Morning Brief error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
