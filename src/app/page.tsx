import { MetricCard } from "@/components/dashboard/MetricCard";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning, John!</h1>
        <p className="text-muted-foreground mt-1">Here is what's happening with your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Balance" 
          value="₦2,450,000.00" 
          change="+12.5%" 
          trend="up" 
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>}
        />
        <MetricCard 
          title="Total Inflow" 
          value="₦840,500.00" 
          change="+8.2%" 
          trend="up" 
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <MetricCard 
          title="Total Outflow" 
          value="₦120,400.00" 
          change="-2.4%" 
          trend="down" 
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><polyline points="19 15 12 22 5 15"/></svg>}
        />
        <MetricCard 
          title="Active Customers" 
          value="1,204" 
          change="+4.1%" 
          trend="up" 
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TransactionTable />
        </div>
        <div>
          <AIInsightCard />
        </div>
      </div>
    </div>
  );
}
