import { Lightbulb, Pin } from 'lucide-react';
import type { Insight } from '@/lib/dashboard-client';
import { MarkdownFormatter } from '@/components/ui/MarkdownFormatter';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const categoryColors: Record<string, string> = {
  CASHFLOW: 'bg-blue-50 text-blue-700 border-blue-100',
  REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  EXPENSE: 'bg-orange-50 text-orange-700 border-orange-100',
  CREDIT: 'bg-purple-50 text-purple-700 border-purple-100',
  GROWTH: 'bg-teal-50 text-teal-700 border-teal-100',
};

export function InsightCard({ insight }: { insight: Insight }) {
  const colorClass = categoryColors[insight.category] ?? 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2.5 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm font-semibold text-slate-900 leading-snug">{insight.title}</p>
        </div>
        {insight.isPinned && <Pin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
      </div>

      <div className="text-sm text-slate-600 leading-relaxed">
        <MarkdownFormatter content={insight.content} />
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
          {insight.category}
        </span>
        <span className="text-[11px] text-slate-400">{timeAgo(insight.createdAt)}</span>
      </div>
    </div>
  );
}

export function InsightsEmptyState() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
        <Lightbulb className="w-5 h-5 text-amber-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">No insights yet</p>
      <p className="text-xs text-slate-400 max-w-xs">
        Upload transaction data or connect your POS to start receiving AI-powered business insights.
      </p>
    </div>
  );
}
