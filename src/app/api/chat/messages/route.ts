import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { calculateSummary, calculateCashflow, calculateCreditReadiness, TransactionData } from '@/lib/analytics';
import { z } from 'zod';

export const runtime = 'nodejs';

const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    const messages = await prisma.chatMessage.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'asc' },
    });

    return successResponse({ messages });
  } catch (err) {
    const error = err as Error;
    console.error('GET chat messages error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    const body = await req.json();
    const result = chatMessageSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation error', 400, result.error.flatten().fieldErrors);
    }
    const { message } = result.data;

    // 1. Save User's message to the database
    const userMsg = await prisma.chatMessage.create({
      data: {
        merchantId: merchant.id,
        role: 'user',
        content: message,
      },
    });

    // 2. Fetch the recent conversation history (last 11 messages)
    const history = await prisma.chatMessage.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
      take: 11,
    });
    // Reverse to chronological order (asc)
    history.reverse();

    // Ensure our conversation sequence sent to Gemini starts with a user message
    let startIndex = 0;
    while (startIndex < history.length && history[startIndex].role !== 'user') {
      startIndex++;
    }
    const filteredHistory = history.slice(startIndex);

    // 3. Fetch financial context
    const transactions = await prisma.transaction.findMany({
      where: { merchantId: merchant.id },
      orderBy: { date: 'desc' },
    });
    const txData = transactions as unknown as TransactionData[];
    const summary = calculateSummary(txData);
    const cashflow = calculateCashflow(txData);
    const creditReadiness = calculateCreditReadiness(txData);
    const recentTransactions = txData.slice(0, 20);

    const financialContext = `You are MerchantIQ, the AI CFO for ${merchant.businessName}, a ${merchant.businessType} business in ${merchant.location || 'Lagos, Nigeria'}.
Here is the current financial context of the business:
Financial Summary:
- Total Revenue: ₦${summary.totalRevenue.toLocaleString()}
- Total Expenses: ₦${summary.totalExpenses.toLocaleString()}
- Net Profit: ₦${summary.netProfit.toLocaleString()}
- Cash Position: ₦${summary.cashPosition.toLocaleString()}

Cash Flow Details:
- Current Cash Balance: ₦${cashflow.currentCash.toLocaleString()}
- Average Daily Inflow: ₦${cashflow.averageDailyInflow.toLocaleString()}
- Average Daily Outflow: ₦${cashflow.averageDailyOutflow.toLocaleString()}
- Runway: ${cashflow.runwayDays} days (Risk: ${cashflow.riskLevel})

Credit Status:
- Score: ${creditReadiness.score}/850 (Risk level: ${creditReadiness.riskLevel})

Recent Transactions:
${recentTransactions.map(t => `- Date: ${new Date(t.date).toLocaleDateString()}, Category: ${t.category}, Amount: ₦${t.amount.toLocaleString()}, Type: ${t.type}, Direction: ${t.direction}, Method: ${t.paymentMethod}, Status: ${t.status}`).join('\n')}

STRICT REQUIREMENT: Answer only from the provided data. If the data is insufficient to answer the question, state that clearly and politely (e.g., "Based on the records uploaded, I cannot see details for that..."). Do not invent any facts, numbers, or transactions. Speak in simple, clear terms suitable for a Nigerian business owner. Avoid advanced corporate/financial jargon without immediately explaining them simply. Use everyday language. Use Naira (₦). Avoid making guaranteed promises. If the question or answer mentions taking a loan or borrowing, you MUST explicitly explain the repayment and interest rate risks on their daily operating cash.`;

    // 4. Format messages for Gemini API
    const formattedMessages = filteredHistory.map((msg, index) => {
      let text = msg.content;
      if (index === 0) {
        text = `${financialContext}\n\nUser Question: ${text}`;
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text }]
      };
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse('API key not configured', 500);
    }

    const systemInstruction = "You are a friendly, highly practical, expert AI Chief Financial Officer named MerchantIQ for a small business in Nigeria. Provide clear, concise, and highly actionable advice using simple everyday terms. Avoid advanced corporate/financial jargon (like 'liquidity', 'volatility', or 'debt-to-income') without immediately explaining them simply. Use everyday language (e.g. 'cash on hand', 'daily sales', 'money left over', 'bills', 'savings'). Maintain a professional, encouraging, and supportive tone. Keep answers relatively brief but dense with value.";

    // 5. Call Gemini
    const resGemini = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: formattedMessages,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
          }
        }),
      }
    );

    if (!resGemini.ok) {
      const errText = await resGemini.text();
      console.error('Gemini API error:', errText);
      return errorResponse('Failed to communicate with AI provider', 502);
    }

    const data = await resGemini.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // 6. Save model response to the database
    const modelMsg = await prisma.chatMessage.create({
      data: {
        merchantId: merchant.id,
        role: 'model',
        content: replyText,
      },
    });

    return successResponse({
      userMessage: userMsg,
      modelMessage: modelMsg,
    });
  } catch (err) {
    const error = err as Error;
    console.error('POST chat messages error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user.merchant) {
      return errorResponse('Unauthorized', 401);
    }
    const merchant = user.merchant;

    await prisma.chatMessage.deleteMany({
      where: { merchantId: merchant.id },
    });

    return successResponse({ message: 'Chat history cleared successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('DELETE chat messages error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
