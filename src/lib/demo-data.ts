import { prisma } from "./prisma";

export function generateSampleTransactions(merchantId: string, count = 200) {
  const transactions = [];
  const categories = {
    INCOME: [
      "Retail Sales",
      "Bulk Orders",
      "Wholesale Revenue",
      "Delivery Services",
    ],
    EXPENSE: [
      "Inventory Purchase",
      "Rent",
      "Electricity & Power",
      "Staff Salaries",
      "Transport & Fuel",
      "Packaging Supplies",
      "Taxes",
      "Repairs & Maintenance",
    ],
  };

  const sources = ["CSV", "DEMO", "POS", "BANK_STATEMENT"];
  const paymentMethods = ["CASH", "TRANSFER", "POS", "WALLET"];

  const now = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(
      now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    );
    const type = Math.random() < 0.6 ? "INCOME" : "EXPENSE";
    const direction = type === "INCOME" ? "INFLOW" : "OUTFLOW";

    const categoryList = categories[type];
    const category =
      categoryList[Math.floor(Math.random() * categoryList.length)];

    let amount = 0;
    if (type === "INCOME") {
      const rand = Math.random();
      if (rand < 0.1) {
        amount = Math.floor(Math.random() * 150000) + 100000;
      } else if (rand < 0.6) {
        amount = Math.floor(Math.random() * 30000) + 5000;
      } else {
        amount = Math.floor(Math.random() * 4500) + 500;
      }
    } else {
      if (category === "Rent") {
        amount = 120000;
      } else if (category === "Staff Salaries") {
        amount = 80000;
      } else if (category === "Inventory Purchase") {
        amount = Math.floor(Math.random() * 200000) + 50000;
      } else {
        amount = Math.floor(Math.random() * 15000) + 2000;
      }
    }

    let description = "";
    if (type === "INCOME") {
      description = `${category} - Ref #${Math.floor(Math.random() * 900000) + 100000}`;
    } else {
      description = `Purchase for ${category.toLowerCase()}`;
    }

    const source = sources[Math.floor(Math.random() * sources.length)];
    let paymentMethod =
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    if (source === "BANK_STATEMENT") {
      paymentMethod = "TRANSFER";
    } else if (source === "POS") {
      paymentMethod = "POS";
    }

    const statusRand = Math.random();
    const status =
      statusRand < 0.92
        ? "COMPLETED"
        : statusRand < 0.97
          ? "PENDING"
          : "FAILED";

    transactions.push({
      merchantId,
      amount,
      type,
      category,
      description,
      date,
      source,
      paymentMethod,
      direction,
      status,
    });
  }

  return transactions;
}

export async function seedDemoMerchantData(merchantId: string) {
  return await prisma.$transaction(
    async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      
      await tx.transaction.deleteMany({ where: { merchantId } });
      await tx.insight.deleteMany({ where: { merchantId } });
      await tx.creditProfile.deleteMany({ where: { merchantId } });

      
      const transactions = generateSampleTransactions(merchantId, 200);
      await tx.transaction.createMany({
        data: transactions,
      });

      
      await tx.creditProfile.create({
        data: {
          merchantId,
          creditScore: 710,
          riskRating: "LOW",
          debtServiceCoverageRatio: 2.3,
          totalDebt: 300000.0,
          recommendedLoanAmount: 2000000.0,
          analysisDetails: JSON.stringify({
            strengths: [
              "Consistent weekly sales volumes.",
              "Low debt utilization.",
            ],
            weaknesses: ["Moderate expense volatility."],
            nextSteps: [
              "Maintain current operating habits and clear pending bills.",
            ],
          }),
        },
      });

      
      await tx.insight.create({
        data: {
          merchantId,
          title: "Morning CFO Briefing",
          content: `### Morning Summary
Good morning Boss! Femi Provision Store is in a healthy operating position. Active sales are looking strong.

### Cash Flow Alert
Your current runway is estimated at **120 days**. Operating cash looks stable.

### Action Item
Consider checking your inventory levels today to prepare for bulk weekend purchases.`,
          category: "MORNING_BRIEF",
          type: "AI",
          isPinned: true,
        },
      });

      await tx.insight.create({
        data: {
          merchantId,
          title: "Key Growth Recommendations",
          content: `* **Optimize Bulk Sales**: Retail sales are your biggest driver. Consider introducing bulk order discounts to lock in wholesale buyers.
* **Reduce Power Overheads**: Spend on power/generator fuels has risen 15% MoM. Consider a transition to commercial solar backup power.
* **Repayment Warning**: Loans should only be backed by proven daily cash cycles. Avoid borrowing unless expanding product categories.`,
          category: "GROWTH_RECOMMENDATION",
          type: "AI",
          isPinned: false,
        },
      });

      return {
        transactionsCount: transactions.length,
        insightsCount: 2,
        hasCreditProfile: true,
      };
    },
  );
}
