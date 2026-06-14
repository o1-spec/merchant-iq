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
  Activity,
  Heart,
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

  const { merchant, summary, cashflow, businessHealth, forecast, recentTransactions, latestInsights } = data;

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
          title="Business Health"
          value={`${businessHealth.score}/100`}
          subtitle={`${businessHealth.riskLevel === 'LOW' ? 'Healthy operations' : businessHealth.riskLevel === 'MEDIUM' ? 'Stable health' : 'Needs attention'}`}
          icon={<Heart className="w-4 h-4 text-rose-500" />}
        />
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Runway card */}
        <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between group hover:shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Cash Runway
            </p>
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

        {/* 30-Day Forecast Card */}
        <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              30-Day Forecast
            </p>
            <div className="flex items-end gap-1 mt-3">
              <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                {fmt(forecast.netForecastedPosition)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected In</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5 tabular-nums">+{fmt(forecast.forecastedMonthlyInflow)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projected Out</p>
                <p className="text-xs font-bold text-rose-600 mt-0.5 tabular-nums">-{fmt(forecast.forecastedMonthlyOutflow)}</p>
              </div>
            </div>
          </div>
          {forecast.warning && (
            <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100 font-medium truncate">
              {forecast.warning}
            </p>
          )}
        </div>

        {/* Business Health Details Card */}
        <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4 transition-all duration-300 flex flex-col justify-between group hover:shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Business Health Score
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="relative flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#f1f5f9"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke={
                      businessHealth.score >= 75
                        ? '#10b981'
                        : businessHealth.score >= 50
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - businessHealth.score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800">{businessHealth.score}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">/ 100</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider ${riskBadge[businessHealth.riskLevel]}`}>
                    {businessHealth.riskLevel} RISK
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-tight">
                  {businessHealth.score >= 75
                    ? 'Strong credit capability & runway.'
                    : businessHealth.score >= 50
                    ? 'Stable health. Good standing.'
                    : 'High credit risk. Improve inflows.'}
                </p>
              </div>
            </div>
          </div>

          {businessHealth.strengths.length > 0 && (
            <div className="border-t border-slate-100 pt-3 space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Key Drivers</p>
              {businessHealth.strengths.slice(0, 2).map((s) => (
                <p key={s} className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{s}</span>
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
