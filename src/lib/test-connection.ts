import { prisma } from './prisma';
import {
  calculateSummary,
  calculateCashflow,
  calculateBusinessHealth,
  TransactionData
} from './analytics';
import { generateGeminiText } from './gemini';
import {
  buildMorningBriefPrompt,
  buildGrowthRecommendationsPrompt,
  buildCreditCoachPrompt,
  buildAskCfoPrompt
} from './ai-prompts';

const mockMerchant = {
  id: 'm1',
  businessName: 'Femi Provision Store',
  businessType: 'Retail',
  businessCategory: 'Convenience Store',
  location: 'Lagos, Nigeria'
};

const mockTransactions: TransactionData[] = [
  {
    id: 't1',
    merchantId: 'm1',
    amount: 150000.0,
    type: 'INCOME',
    category: 'Retail Sales',
    description: 'Bulk order Conv Store',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    source: 'POS',
    paymentMethod: 'POS',
    direction: 'INFLOW',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't2',
    merchantId: 'm1',
    amount: 50000.0,
    type: 'INCOME',
    category: 'Bulk Orders',
    description: 'Order Ref',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    source: 'BANK_STATEMENT',
    paymentMethod: 'TRANSFER',
    direction: 'INFLOW',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't3',
    merchantId: 'm1',
    amount: 25000.0,
    type: 'INCOME',
    category: 'Retail Sales',
    description: 'Daily cash sales',
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    source: 'DEMO',
    paymentMethod: 'CASH',
    direction: 'INFLOW',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't4',
    merchantId: 'm1',
    amount: 40000.0,
    type: 'EXPENSE',
    category: 'Inventory Purchase',
    description: 'Goods stock',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    source: 'CSV',
    paymentMethod: 'TRANSFER',
    direction: 'OUTFLOW',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't5',
    merchantId: 'm1',
    amount: 15000.0,
    type: 'EXPENSE',
    category: 'Electricity & Power',
    description: 'Power prepay',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    source: 'CSV',
    paymentMethod: 'WALLET',
    direction: 'OUTFLOW',
    status: 'COMPLETED',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function main() {
  console.log('--- Phase 4 Sanity Checks ---');

  
  const summary = calculateSummary(mockTransactions);
  const cashflow = calculateCashflow(mockTransactions);
  const businessHealth = calculateBusinessHealth(mockTransactions);

  
  console.log('Compiling Morning Brief prompt...');
  const briefPrompt = buildMorningBriefPrompt({
    merchant: mockMerchant,
    summary,
    cashflow,
    businessHealth
  });
  console.log(`Morning brief prompt length: ${briefPrompt.length}`);

  console.log('Compiling Growth Recommendations prompt...');
  const growthPrompt = buildGrowthRecommendationsPrompt({
    merchant: mockMerchant,
    summary,
    cashflow,
    transactions: mockTransactions
  });
  console.log(`Growth recommendations prompt length: ${growthPrompt.length}`);

  console.log('Compiling Credit Coach prompt...');
  const coachPrompt = buildCreditCoachPrompt({
    merchant: mockMerchant,
    businessHealth,
    summary,
    cashflow
  });
  console.log(`Credit coach prompt length: ${coachPrompt.length}`);

  console.log('Compiling Ask CFO prompt...');
  const askPrompt = buildAskCfoPrompt({
    merchant: mockMerchant,
    question: 'How can I optimize cashflow?',
    summary,
    cashflow,
    businessHealth,
    recentTransactions: mockTransactions
  });
  console.log(`Ask CFO prompt length: ${askPrompt.length}`);

  console.log('All prompts constructed successfully!');

  
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log('GEMINI_API_KEY detected. Running live test with short query...');
    try {
      const response = await generateGeminiText('Hello! Just respond with "Gemini API works!" if you receive this.');
      console.log('Gemini Live Response:', response.trim());
    } catch (err) {
      const error = err as Error;
      console.error('Gemini API call failed:', error.message);
    }
  } else {
    console.log('GEMINI_API_KEY not found in environment. Skipping live API check.');
  }

  
  try {
    const userCount = await prisma.user.count();
    console.log(`\nSuccessfully reached Supabase database. User count: ${userCount}`);
  } catch (err) {
    const error = err as Error;
    console.error('Database query failed:', error.message);
  }

  console.log('Verification checks finished.');
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
