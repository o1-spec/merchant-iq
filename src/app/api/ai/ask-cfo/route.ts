import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, calculateCashflow, calculateBusinessHealth, TransactionData } from '@/lib/analytics';
import { generateGeminiText } from '@/lib/gemini';
import { buildAskCfoPrompt } from '@/lib/ai-prompts';
import { z } from 'zod';

export const runtime = 'nodejs';

const askCfoSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    const body = await req.json();
    const result = askCfoSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }

    const { question } = result.data;

    
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
      orderBy: { date: 'desc' },
    });

    const txData = transactions as unknown as TransactionData[];

    
    const summary = calculateSummary(txData);
    const cashflow = calculateCashflow(txData);
    const businessHealth = calculateBusinessHealth(txData);
    
    
    const recentTransactions = txData.slice(0, 20);

    
    const prompt = buildAskCfoPrompt({
      merchant,
      question,
      summary,
      cashflow,
      businessHealth,
      recentTransactions,
    });

    
    const answer = await generateGeminiText(prompt);

    return successResponse({
      question,
      answer,
    });
  } catch (err) {
    const error = err as Error;
    console.error('AI Ask CFO error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
