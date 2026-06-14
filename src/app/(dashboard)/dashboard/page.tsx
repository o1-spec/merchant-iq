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
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const result = await getDashboard();
      setData(result);
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

      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {firstName(merchant.businessName)}.
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here&apos;s how your business is performing today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{merchant.businessName}</p>
          <p className="text-xs text-slate-400">{merchant.location}</p>
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

        
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-slate-500">Cash Runway</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {cashflow.runwayDays === 999 ? '∞' : cashflow.runwayDays}
            </p>
            <p className="text-slate-400 text-sm mb-1">days</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${riskBadge[cashflow.riskLevel]}`}>
              {cashflow.riskLevel} RISK
            </span>
          </div>
          {cashflow.warning && (
            <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
              {cashflow.warning}
            </p>
          )}
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-slate-500">Credit Readiness</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{creditReadiness.score}</p>
            <p className="text-slate-400 text-sm mb-1">/ 850</p>
          </div>
          <span className={`inline-block text-xs font-semibold border px-2.5 py-1 rounded-full ${riskBadge[creditReadiness.riskLevel as keyof typeof riskBadge] ?? riskBadge.MEDIUM}`}>
            {creditReadiness.riskLevel} RISK
          </span>

          {creditReadiness.strengths.length > 0 && (
            <div className="border-t border-slate-100 pt-2 space-y-1">
              {creditReadiness.strengths.slice(0, 2).map((s) => (
                <p key={s} className="text-xs text-emerald-600 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">✓</span> {s}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
            <span className="text-xs text-slate-400">{recentTransactions.length} shown</span>
          </div>
          <TransactionTable transactions={recentTransactions} />
        </div>

        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">AI Insights</h2>
            <span className="text-xs text-slate-400">{latestInsights.length} total</span>
          </div>
          {latestInsights.length === 0 ? (
            <InsightsEmptyState />
          ) : (
            <div className="space-y-3">
              {latestInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>
      </div>

      
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Business Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
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
