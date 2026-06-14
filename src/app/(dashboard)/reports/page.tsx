'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Printer,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ListTodo
} from 'lucide-react';
import {
  getBusinessHealthReport,
  type BusinessHealthReportResponse
} from '@/lib/reports-client';
import { useToast } from '@/components/ui/toast';

function fmt(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

const riskBadges: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  HIGH: 'bg-red-50 text-red-700 border-red-100',
};

const categoryLabels: Record<string, { label: string; style: string }> = {
  MORNING_BRIEF: { label: 'Morning Brief', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  GROWTH_RECOMMENDATION: { label: 'Growth Tips', style: 'bg-blue-50 text-blue-700 border-blue-100' },
  CREDIT_COACH: { label: 'Credit Coach', style: 'bg-purple-50 text-purple-700 border-purple-100' },
};

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-60" />
          <div className="h-4 bg-slate-100 rounded w-96" />
        </div>
        <div className="h-9 bg-slate-200 rounded w-36 shrink-0" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="h-3 bg-slate-100 rounded w-16" />
            <div className="h-6 bg-slate-200 rounded w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="h-5 bg-slate-200 rounded w-32" />
            <div className="h-10 bg-slate-100 rounded w-full" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-12 bg-slate-50 rounded" />
              <div className="h-12 bg-slate-50 rounded" />
              <div className="h-12 bg-slate-50 rounded" />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="h-5 bg-slate-200 rounded w-40" />
            <div className="h-2 bg-slate-100 rounded-full w-full" />
            <div className="h-20 bg-slate-50 rounded w-full" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-32" />
          <div className="space-y-2">
            <div className="h-14 bg-slate-50 rounded w-full" />
            <div className="h-14 bg-slate-50 rounded w-full" />
            <div className="h-14 bg-slate-50 rounded w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { success, error: toastError } = useToast();
  const [report, setReport] = useState<BusinessHealthReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBusinessHealthReport();
      setReport(data);
      if (isRefresh) {
        success('Business health report refreshed successfully.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not retrieve business report.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(false);
  }, []);

  const handlePrint = () => {
    success('Preparing print layout...');
    window.print();
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
        <AlertCircle className="w-10 h-10 text-red-500 shrink-0" />
        <h3 className="font-semibold text-slate-900 text-sm">We couldn't load your business report</h3>
        <p className="text-xs text-slate-500 max-w-sm">{error ?? 'Something went wrong.'}</p>
        <button
          onClick={() => loadReport(false)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors mt-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry loading
        </button>
      </div>
    );
  }

  const scorePercent = Math.min(100, Math.max(0, ((report.creditReadiness.score - 300) / 550) * 100));

  return (
    <div className="space-y-6 max-w-[1200px] print-full">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            aside, header, nav, button, .print-hide, .no-print {
              display: none !important;
            }
            main, .print-full {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `
      }} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print-hide">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Business Health Report</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            A complete view of your cashflow, performance, credit readiness, and AI insights.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadReport(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh Report
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">MerchantIQ Business Health Report</h1>
            <p className="text-xs text-slate-500 mt-1">Generated automatically on {fmtDate(report.generatedAt)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
            M
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <p className="text-slate-400 font-medium">Business Name</p>
          <p className="text-slate-800 font-semibold mt-0.5 truncate">{report.merchant.businessName}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Industry Category</p>
          <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {report.merchant.businessCategory}
          </p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Location</p>
          <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {report.merchant.location}
          </p>
        </div>
        <div>
          <p className="text-slate-400 font-medium">Last Updated</p>
          <p className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {fmtDate(report.generatedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{fmt(report.summary.totalRevenue)}</p>
          <div className="mt-1 flex items-center gap-1">
            {report.summary.revenueTrendPercent >= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                +{report.summary.revenueTrendPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                <TrendingDown className="w-2.5 h-2.5 shrink-0" />
                {report.summary.revenueTrendPercent}%
              </span>
            )}
            <span className="text-[10px] text-slate-400">vs. last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Total Expenses</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{fmt(report.summary.totalExpenses)}</p>
          <div className="mt-1 flex items-center gap-1">
            {report.summary.expenseTrendPercent <= 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <TrendingDown className="w-2.5 h-2.5 shrink-0" />
                {report.summary.expenseTrendPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                +{report.summary.expenseTrendPercent}%
              </span>
            )}
            <span className="text-[10px] text-slate-400">vs. last month</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Net Profit</p>
          <p className={`text-lg font-bold mt-1 ${report.summary.netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {fmt(report.summary.netProfit)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Profit margin: {report.summary.totalRevenue > 0 
              ? Math.round((report.summary.netProfit / report.summary.totalRevenue) * 100) 
              : 0}%
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">Cash Position</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{fmt(report.summary.cashPosition)}</p>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Ledger transactions: {report.summary.transactionCount} records
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Cashflow Analysis</h3>
              <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${riskBadges[report.cashflow.riskLevel]}`}>
                {report.cashflow.riskLevel} Risk
              </span>
            </div>

            {report.cashflow.warning && (
              <div className={`flex items-start gap-2 border rounded-lg p-3 text-xs leading-relaxed
                ${report.cashflow.riskLevel === 'HIGH' 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{report.cashflow.warning}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Average Daily Inflow</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{fmt(report.cashflow.averageDailyInflow)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Average Daily Outflow</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">{fmt(report.cashflow.averageDailyOutflow)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Remaining Runway</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {report.cashflow.runwayDays === 999 ? '30+ Days' : `${report.cashflow.runwayDays} Days`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Credit Readiness</h3>
              <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${riskBadges[report.creditReadiness.riskLevel]}`}>
                {report.creditReadiness.riskLevel} Risk
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500 font-medium">FICO-equivalent Credit Score</span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">{report.creditReadiness.score}</span>
              </div>
              
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    report.creditReadiness.riskLevel === 'LOW' 
                      ? 'bg-emerald-600' 
                      : report.creditReadiness.riskLevel === 'MEDIUM' 
                        ? 'bg-amber-500' 
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                <span>300 (Poor)</span>
                <span>550 (Fair)</span>
                <span>700 (Good)</span>
                <span>850 (Excellent)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Key Strengths
                </p>
                {report.creditReadiness.strengths.length === 0 ? (
                  <p className="text-slate-400 italic">No specific strengths detected yet.</p>
                ) : (
                  <ul className="space-y-1.5 text-slate-600 pl-5 list-disc">
                    {report.creditReadiness.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  Areas to Improve
                </p>
                {report.creditReadiness.weaknesses.length === 0 ? (
                  <p className="text-slate-400 italic">No specific weaknesses detected.</p>
                ) : (
                  <ul className="space-y-1.5 text-slate-600 pl-5 list-disc">
                    {report.creditReadiness.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {report.creditReadiness.nextSteps && report.creditReadiness.nextSteps.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-purple-600 shrink-0" />
                  Recommended Next Steps
                </p>
                <ul className="space-y-1.5 text-slate-600 pl-5 list-decimal">
                  {report.creditReadiness.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              Latest AI Insights
            </h3>

            {report.aiInsights.length === 0 ? (
              <div className="text-center p-6 space-y-2">
                <FileText className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No AI insights found</p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Generate AI CFO insights to enrich this report.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {report.aiInsights.map((insight) => {
                  const badge = categoryLabels[insight.category] ?? { label: insight.category, style: 'bg-slate-50 text-slate-600 border-slate-100' };
                  return (
                    <div key={insight.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-1.5 text-xs">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-semibold text-slate-800 line-clamp-1">{insight.title}</p>
                        <span className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${badge.style}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-slate-500 line-clamp-3 leading-relaxed whitespace-pre-wrap">{insight.content}</p>
                      <p className="text-[9px] text-slate-400 font-medium pt-1">
                        {new Date(insight.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
