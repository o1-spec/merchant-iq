export async function GET() {
  const csvHeaders = 'date,type,category,amount,description,direction,paymentMethod,source,status\n';
  
  const sampleRows = [
    '2026-06-10,INCOME,Retail Sales,15000,Standard counter sales,INFLOW,CASH,POS,COMPLETED',
    '2026-06-09,EXPENSE,Inventory Purchase,50000,Wholesale groceries buy,OUTFLOW,TRANSFER,BANK_STATEMENT,COMPLETED',
    '2026-06-08,INCOME,Bulk Orders,120000,Event supplier bulk supply,INFLOW,TRANSFER,BANK_STATEMENT,COMPLETED',
    '2026-06-07,EXPENSE,Electricity & Power,15000,Generator diesel buy,OUTFLOW,CASH,CSV,COMPLETED',
    '2026-06-06,EXPENSE,Staff Salaries,80000,Monthly helper wage,OUTFLOW,TRANSFER,BANK_STATEMENT,COMPLETED',
    '2026-06-05,INCOME,Retail Sales,4500,Card pos sale,INFLOW,POS,POS,COMPLETED',
    '2026-06-04,INCOME,Retail Sales,1200,Failed transfer check,INFLOW,TRANSFER,BANK_STATEMENT,FAILED',
    '2026-06-03,EXPENSE,Repairs & Maintenance,8000,Broken freezer seal fix,OUTFLOW,WALLET,DEMO,COMPLETED'
  ].join('\n');

  const csvContent = csvHeaders + sampleRows;

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="sample_transactions.csv"',
    },
  });
}
