'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Sparkles,
  Clock,
  TrendingUp,
  Coins,
  Bookmark,
  BookmarkCheck,
  Trash2,
  AlertCircle,
  Loader2,
  Info as InfoIcon,
  Calendar,
  X,
  FileText
} from 'lucide-react';
import {
  generateMorningBrief,
  generateGrowthRecommendations,
  generateCreditCoach,
  getInsights,
  togglePinInsight,
  deleteInsight,
  type Insight
} from '@/lib/ai-client';
import { useToast } from '@/components/ui/toast';
import { MarkdownFormatter } from '@/components/ui/MarkdownFormatter';

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(#{1,6})\s+/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italics
    .replace(/^[*•-]\s+/gm, '') // list items
    .replace(/^\d+\.\s+/gm, ''); // numbered list items
}

function fmtDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

const categoryDetails: Record<string, { label: string; icon: any; style: string; textStyle: string }> = {
  MORNING_BRIEF: {
    label: 'Morning Brief',
    icon: Clock,
    style: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    textStyle: 'text-emerald-700'
  },
  GROWTH_RECOMMENDATION: {
    label: 'Growth Tips',
    icon: TrendingUp,
    style: 'bg-blue-50 text-blue-700 border-blue-100',
    textStyle: 'text-blue-700'
  },
  CREDIT_COACH: {
    label: 'Credit Coach',
    icon: Coins,
    style: 'bg-purple-50 text-purple-700 border-purple-100',
    textStyle: 'text-purple-700'
  },
};

const TABS = [
  { label: 'All Insights', value: '' },
  { label: 'Morning Briefs', value: 'MORNING_BRIEF' },
  { label: 'Growth Recommendations', value: 'GROWTH_RECOMMENDATION' },
  { label: 'Credit Coach', value: 'CREDIT_COACH' },
];

function SkeletonsList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-5 bg-slate-100 rounded-full w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-3 bg-slate-100 rounded w-24" />
            <div className="flex gap-2">
              <div className="h-7 w-7 bg-slate-100 rounded" />
              <div className="h-7 w-7 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto flex flex-col`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function DeleteInsightConfirm({
  title,
  onConfirm,
  onCancel,
  deleting,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <Modal title="Delete advisory report" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to delete this AI CFO insight report? This action cannot be undone.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-medium text-slate-700">
          {title}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700
              disabled:bg-slate-300 text-white rounded-lg transition-colors"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AiCfoPage() {

  const { success, error: toastError, info } = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);


  const [selectedCategory, setSelectedCategory] = useState<string>('');


  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadingBriefRegen, setLoadingBriefRegen] = useState(false);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
  const [loadingCredit, setLoadingCredit] = useState(false);


  const [activeResult, setActiveResult] = useState<{
    title: string;
    category: string;
    content: string;
    createdAt?: string;
    insight: Insight;
  } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [deleteInsightId, setDeleteInsightId] = useState<string | null>(null);
  const [deletingInsight, setDeletingInsight] = useState(false);


  const loadInsights = useCallback(async (categoryValue: string) => {
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await getInsights(categoryValue || undefined);
      setInsights(res.insights);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Could not fetch saved insights.');
    } finally {
      setLoadingInsights(false);
    }
  }, []);


  useEffect(() => {
    loadInsights(selectedCategory);
  }, [selectedCategory, loadInsights]);


  const handleGenerateBrief = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setLoadingBriefRegen(true);
    } else {
      setLoadingBrief(true);
    }
    setGenerationError(null);
    try {
      const res = await generateMorningBrief(forceRegenerate);
      setActiveResult({
        title: res.insight.title,
        category: res.insight.category,
        content: res.brief,
        createdAt: res.insight.createdAt,
        insight: res.insight
      });

      loadInsights(selectedCategory);
      success('Morning Brief generated successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate Morning Brief. Please try again.';
      setGenerationError(msg);
      toastError(msg);
    } finally {
      setLoadingBrief(false);
      setLoadingBriefRegen(false);
    }
  };


  const handleGenerateGrowth = async () => {
    setLoadingGrowth(true);
    setGenerationError(null);
    try {
      const res = await generateGrowthRecommendations();
      setActiveResult({
        title: res.insight.title,
        category: res.insight.category,
        content: res.recommendations,
        createdAt: res.insight.createdAt,
        insight: res.insight
      });
      loadInsights(selectedCategory);
      success('Growth Tips generated successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate Growth Tips. Please try again.';
      setGenerationError(msg);
      toastError(msg);
    } finally {
      setLoadingGrowth(false);
    }
  };


  const handleGenerateCredit = async () => {
    setLoadingCredit(true);
    setGenerationError(null);
    try {
      const res = await generateCreditCoach();
      setActiveResult({
        title: res.insight.title,
        category: res.insight.category,
        content: res.explanation,
        createdAt: res.insight.createdAt,
        insight: res.insight
      });
      loadInsights(selectedCategory);
      success('Credit Advice generated successfully.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not generate Credit Advice. Please try again.';
      setGenerationError(msg);
      toastError(msg);
    } finally {
      setLoadingCredit(false);
    }
  };


  const handleTogglePin = async (insightId: string) => {
    try {
      const res = await togglePinInsight(insightId);


      setInsights((prev) =>
        prev.map((ins) => (ins.id === insightId ? res.insight : ins))
      );


      if (activeResult && activeResult.insight.id === insightId) {
        setActiveResult((prev) => prev ? { ...prev, insight: res.insight } : null);
      }

      if (res.insight.isPinned) {
        success('Insight pinned to dashboard.');
      } else {
        info('Insight unpinned.');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to pin/unpin insight.');
    }
  };


  const handleDeleteInsightConfirm = async () => {
    if (!deleteInsightId) return;
    setDeletingInsight(true);
    try {
      await deleteInsight(deleteInsightId);

      setInsights((prev) => prev.filter((ins) => ins.id !== deleteInsightId));

      if (activeResult && activeResult.insight.id === deleteInsightId) {
        setActiveResult(null);
      }
      setDeleteInsightId(null);
      success('Advisory report deleted successfully.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Failed to delete insight.');
    } finally {
      setDeletingInsight(false);
    }
  };

  const handleSelectInsight = (insight: Insight) => {
    setActiveResult({
      title: insight.title,
      category: insight.category,
      content: insight.content,
      createdAt: insight.createdAt,
      insight
    });

    document.getElementById('result-view-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const isAnyLoading = loadingBrief || loadingBriefRegen || loadingGrowth || loadingCredit;

  return (
    <div className="space-y-6 max-w-[1200px]">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">AI CFO</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              Powered by Gemini
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Generate plain-language business advice from your transaction data.
          </p>
        </div>
      </div>


      {generationError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="space-y-1">
            <p className="font-semibold text-red-950">Generation failed</p>
            <p className="text-red-700/90 text-xs">
              {generationError.includes('API key') || generationError.includes('GEMINI_API_KEY')
                ? 'Your Gemini API key is missing or invalid. Please check your backend configuration.'
                : generationError}
            </p>
          </div>
        </div>
      )}


      {activeResult && (
        <Modal
          title={activeResult.title}
          onClose={() => setActiveResult(null)}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {(() => {
                  const details = categoryDetails[activeResult.category];
                  if (!details) return null;
                  const IconComponent = details.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${details.style}`}>
                      <IconComponent className="w-3 h-3 shrink-0" />
                      {details.label}
                    </span>
                  );
                })()}
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {activeResult.createdAt ? fmtDate(activeResult.createdAt) : 'Just Generated'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTogglePin(activeResult.insight.id)}
                  className={`p-1.5 rounded-lg border transition-colors hover:bg-slate-100
                    ${activeResult.insight.isPinned
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'text-slate-400 border-slate-200'
                    }`}
                  title={activeResult.insight.isPinned ? 'Unpin report' : 'Pin report'}
                >
                  {activeResult.insight.isPinned ? (
                    <BookmarkCheck className="w-4 h-4 shrink-0" />
                  ) : (
                    <Bookmark className="w-4 h-4 shrink-0" />
                  )}
                </button>

                <button
                  onClick={() => setDeleteInsightId(activeResult.insight.id)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            <div className="text-slate-700 text-sm leading-relaxed font-sans font-normal selection:bg-emerald-100 max-h-[60vh] overflow-y-auto pr-1">
              <MarkdownFormatter content={activeResult.content} />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveResult(null)}
                className="px-4 py-2 text-sm font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Morning Brief</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get a daily summary of sales, cashflow risks, and suggested actions. Runs metrics checking automatically.
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <button
              onClick={() => handleGenerateBrief(false)}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shrink-0"
            >
              {loadingBrief ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Brief...
                </>
              ) : (
                'Generate Morning Brief'
              )}
            </button>

            <button
              onClick={() => handleGenerateBrief(true)}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
            >
              {loadingBriefRegen ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Force Regenerate'
              )}
            </button>
          </div>
        </div>


        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Growth Insights</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find sales patterns, category velocity analyses, and practical, direct options to expand revenue streams.
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={handleGenerateGrowth}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shrink-0"
            >
              {loadingGrowth ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Tips...
                </>
              ) : (
                'Generate Growth Tips'
              )}
            </button>
          </div>
        </div>


        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all group">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                <Coins className="w-4 h-4 text-purple-600 shrink-0" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Credit Coach</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Understand your credit readiness, operational health scores, and structured paths to access working loans.
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={handleGenerateCredit}
              disabled={isAnyLoading}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shrink-0"
            >
              {loadingCredit ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Advice...
                </>
              ) : (
                'Generate Credit Advice'
              )}
            </button>
          </div>
        </div>

      </div>


      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Saved Advisory History</h2>
            <p className="text-slate-400 text-xs mt-0.5">Browse through previously generated business insights.</p>
          </div>


          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/60 self-start sm:self-auto">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                disabled={loadingInsights}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${selectedCategory === tab.value
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  } disabled:opacity-50`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>


        {loadingInsights ? (
          <SkeletonsList />
        ) : insightsError ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="font-semibold text-slate-800 text-sm">Failed to load insights</p>
            <p className="text-xs text-slate-500 max-w-sm">{insightsError}</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No advisory reports found</p>
            <p className="text-xs text-slate-400 max-w-xs">
              {selectedCategory
                ? 'No saved insights match this filter. Try checking other categories.'
                : 'Generate your first AI CFO insight to begin.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins) => {
              const details = categoryDetails[ins.category];
              const badgeLabel = details?.label ?? ins.category;
              const badgeStyle = details?.style ?? 'bg-slate-50 text-slate-700 border-slate-200';

              return (
                <div
                  key={ins.id}
                  onClick={() => handleSelectInsight(ins)}
                  className={`group bg-white border rounded-xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-sm hover:border-slate-300
                    ${activeResult?.insight.id === ins.id ? 'border-emerald-500 shadow-sm' : 'border-slate-200'}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-emerald-700 transition-colors">
                        {ins.title}
                      </h4>
                      <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${badgeStyle}`}>
                        {badgeLabel}
                      </span>
                    </div>


                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {stripMarkdown(ins.content)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {fmtDate(ins.createdAt)}
                    </span>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>

                      <button
                        onClick={() => handleTogglePin(ins.id)}
                        className={`p-1.5 rounded-md border transition-colors hover:bg-slate-50
                          ${ins.isPinned
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'text-slate-400 border-slate-200'
                          }`}
                        title={ins.isPinned ? 'Unpin' : 'Pin'}
                      >
                        {ins.isPinned ? (
                          <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>


                      <button
                        onClick={() => setDeleteInsightId(ins.id)}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(() => {
        const deletingInsightObj = insights.find(ins => ins.id === deleteInsightId) || (activeResult?.insight.id === deleteInsightId ? activeResult.insight : null);
        if (deleteInsightId && deletingInsightObj) {
          return (
            <DeleteInsightConfirm
              title={deletingInsightObj.title}
              onConfirm={handleDeleteInsightConfirm}
              onCancel={() => setDeleteInsightId(null)}
              deleting={deletingInsight}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}
