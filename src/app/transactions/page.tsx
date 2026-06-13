import { TransactionTable } from "@/components/dashboard/TransactionTable";

export default function TransactionsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-muted-foreground mt-1">View and manage all your business transactions.</p>
      </div>

      <TransactionTable />
    </div>
  );
}
