'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Receipt,
  CreditCard,
  Calendar,
  Tag,
  ShoppingBag,
  Hash,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { getDashboard, type DashboardData } from '@/lib/dashboard-client';
import { MetricCard } from '@/components/dashboard/metric-card';
import { InsightCard, InsightsEmptyState } from '@/components/dashboard/insight-card';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { OnboardingModal } from '@/components/dashboard/OnboardingModal';

function fmt(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(name?: string) {
  return name?.split(' ')[0] ?? 'there';
}

const riskBadge: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

function DashboardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800">We couldn&apos;t load your dashboard.</p>
        <p className="text-sm text-slate-500 mt-1">This may be a network issue. Please try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

function SnapshotItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/70 border border-card-border transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0 border border-primary-light/50">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const result = await getDashboard();
      setData(result);
      if (result.merchant && !result.merchant.hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !data) return <DashboardError onRetry={load} />;

  const { merchant, summary, cashflow, creditReadiness, recentTransactions, latestInsights } = data;

  return (
    <div className="space-y-8 max-w-[1200px]">
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-card-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, <span className="text-primary">{firstName(merchant.businessName)}</span>.
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Here&apos;s a quick snapshot of how your business is performing today.
          </p>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-card-border text-left sm:text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Account</p>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{merchant.businessName}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{merchant.location}</p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Revenue"
          value={fmt(summary.totalRevenue)}
          trend={summary.revenueTrendPercent}
          trendLabel="vs last 30d"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          title="Total Expenses"
          value={fmt(summary.totalExpenses)}
          trend={summary.expenseTrendPercent}
          trendLabel="vs last 30d"
          icon={<Receipt className="w-4 h-4" />}
        />
        <MetricCard
          title="Net Profit"
          value={fmt(summary.netProfit)}
          subtitle="Revenue minus expenses"
          icon={<Wallet className="w-4 h-4" />}
        />
        <MetricCard
          title="Credit Score"
          value={String(creditReadiness.score)}
          subtitle={`out of 850 · ${creditReadiness.riskLevel === 'LOW' ? 'Good standing' : creditReadiness.riskLevel === 'MEDIUM' ? 'Fair' : 'Needs attention'}`}
          icon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        
        <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash Runway</p>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-4xl font-extrabold text-slate-900 tabular-nums">
                {cashflow.runwayDays === 999 ? '∞' : cashflow.runwayDays}
              </p>
              <p className="text-slate-400 text-sm font-semibold mb-1">days</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${riskBadge[cashflow.riskLevel]}`}>
                {cashflow.riskLevel} RISK
              </span>
            </div>
          </div>
          {cashflow.warning && (
            <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100 font-medium">
              {cashflow.warning}
            </p>
          )}
        </div>

        <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Readiness</p>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-4xl font-extrabold text-slate-900 tabular-nums">{creditReadiness.score}</p>
              <p className="text-slate-400 text-sm font-semibold mb-1">/ 850</p>
            </div>
            <div className="mt-3">
              <span className={`inline-block text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${riskBadge[creditReadiness.riskLevel as keyof typeof riskBadge] ?? riskBadge.MEDIUM}`}>
                {creditReadiness.riskLevel} RISK
              </span>
            </div>
          </div>

          {creditReadiness.strengths.length > 0 && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              {creditReadiness.strengths.slice(0, 2).map((s) => (
                <p key={s} className="text-xs text-emerald-700 font-semibold flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-emerald-500 font-bold">✓</span> {s}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      
      {/* Recent Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h2>
          <span className="text-xs font-semibold text-slate-400">{recentTransactions.length} shown</span>
        </div>
        <TransactionTable transactions={recentTransactions} />
      </div>

      {/* AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Insights</h2>
          <span className="text-xs font-semibold text-slate-400">{latestInsights.length} total</span>
        </div>
        {latestInsights.length === 0 ? (
          <InsightsEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>

      
      <div className="bg-white border border-card-border rounded-2xl p-6 transition-all duration-300">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Business Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotItem
            icon={Calendar}
            label="Best sales day"
            value={summary.bestSalesDay}
          />
          <SnapshotItem
            icon={Tag}
            label="Top revenue category"
            value={summary.topRevenueCategory}
          />
          <SnapshotItem
            icon={ShoppingBag}
            label="Top expense category"
            value={summary.topExpenseCategory}
          />
          <SnapshotItem
            icon={Hash}
            label="Total transactions"
            value={summary.transactionCount.toLocaleString()}
          />
        </div>
      </div>

    </div>
  );
}
