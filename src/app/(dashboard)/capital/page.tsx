'use client';

import React, { useEffect, useState } from 'react';
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  Activity,
  ChevronRight,
  Info,
  Calendar,
  Percent,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface Lender {
  id: string;
  name: string;
  logo: string;
  minScore: number;
  interestRate: number;
  maxAmount: number;
  repaymentTerm: string;
  description: string;
  eligible: boolean;
  reason: string;
}

interface Application {
  id: string;
  lenderId: string;
  lenderName: string;
  requestedAmount: number;
  status: string;
  packagedProfile: {
    creditScore: number;
    riskRating: string;
    monthlyRevenueEst: number;
    qualifiedMaxAmount: number;
    strengths?: string[];
    weaknesses?: string[];
    rejectionReason?: string;
  };
  createdAt: string;
}

interface BusinessHealth {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  breakdown: {
    consistency: number;
    cashflow: number;
    stability: number;
    growth: number;
    credit: number;
  };
}

interface CapitalData {
  creditScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  monthlyRevenueEst: number;
  fundingReadiness: 'LOW' | 'MEDIUM' | 'HIGH';
  minCapacity: number;
  maxCapacity: number;
  lenders: Lender[];
  applications: Application[];
  businessHealth: BusinessHealth;
  healthHistory: { month: string; score: number }[];
}

function fmt(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusBadge: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const riskBadge: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

const readinessBadge: Record<string, string> = {
  LOW: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function CapitalPage() {
  const { success: showToastSuccess, error: showToastError } = useToast();

  const [data, setData] = useState<CapitalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Simulation states
  const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
  const [simAmount, setSimAmount] = useState<number>(0);
  const [simTerm, setSimTerm] = useState<number>(6); // Default 6 months
  const [applying, setApplying] = useState(false);
  const [applicationResult, setApplicationResult] = useState<any | null>(null);

  async function loadData() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/credit/lenders');
      if (!res.ok) throw new Error('Failed to fetch lenders');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openSimulator = (lender: Lender) => {
    setSelectedLender(lender);
    setSimAmount(Math.min(lender.maxAmount, Math.round(lender.maxAmount / 2)));
    setSimTerm(6);
    setApplicationResult(null);
  };

  const handleApply = async () => {
    if (!selectedLender) return;
    setApplying(true);
    try {
      const res = await fetch('/api/credit/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId: selectedLender.id,
          requestedAmount: simAmount,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApplicationResult(json.data.application);
        showToastSuccess('Simulation evaluated successfully!');
      } else {
        showToastError(json.error || 'Failed to process simulation.');
      }
    } catch (err) {
      console.error(err);
      showToastError('Network error running simulation.');
    } finally {
      setApplying(false);
    }
  };

  const closeSimulator = () => {
    setSelectedLender(null);
    setApplicationResult(null);
    loadData(); // Reload to pick up the new application in history
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Analyzing transaction ledger readiness...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="font-semibold text-slate-800">Failed to load funding readiness calculations.</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const { creditScore, riskLevel, monthlyRevenueEst, fundingReadiness, minCapacity, maxCapacity, lenders, applications, businessHealth, healthHistory } = data;

  // Interest breakdown
  const monthlyRate = selectedLender?.interestRate || 0;
  const totalInterest = simAmount * (monthlyRate / 100) * simTerm;
  const totalRepayment = simAmount + totalInterest;
  const monthlyRepayment = totalRepayment / simTerm;

  // Evaluate cashflow impact
  const repPercent = monthlyRevenueEst > 0 ? (monthlyRepayment / monthlyRevenueEst) * 100 : 0;
  let cashflowImpact = 'SAFE';
  let cashflowImpactColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
  let cashflowImpactDesc = 'This monthly repayment consumes less than 15% of your average ledger inflows, representing low operational stress.';

  if (repPercent >= 30) {
    cashflowImpact = 'HIGH RISK';
    cashflowImpactColor = 'text-rose-600 bg-rose-50 border-rose-100';
    cashflowImpactDesc = 'This simulated payment consumes over 30% of average monthly inflows. This represents severe operational cashflow strain!';
  } else if (repPercent >= 15) {
    cashflowImpact = 'MODERATE';
    cashflowImpactColor = 'text-amber-600 bg-amber-50 border-amber-100';
    cashflowImpactDesc = 'Monthly repayment falls between 15% and 30% of inflows. Monitor recurring expenditures to ensure coverage.';
  }

  // Calculate dynamic historical spark points from healthHistory
  const hasHistory = healthHistory && healthHistory.length >= 3;
  let trendDiff = 0;
  let points: { x: number; y: number; score: number; month: string }[] = [];
  let pointsPath = '';

  if (hasHistory) {
    trendDiff = healthHistory[healthHistory.length - 1].score - healthHistory[0].score;
    const gap = 350 / (healthHistory.length - 1);
    points = healthHistory.map((item, i) => {
      const x = 40 + i * gap;
      const y = 110 - (item.score / 100) * 80; // maps score 0-100 to y 110-30
      return { x, y, score: item.score, month: item.month };
    });
    pointsPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  return (
    <div className="space-y-8 max-w-[1200px]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-card-border">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capital Readiness Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Evaluate your ledger trust indicators, identify operational blocks, and simulate borrowing limits.
          </p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Verified Ledger Analysis</span>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Business Health
            </p>
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-3xl font-black text-slate-900">{creditScore}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
            </div>
          </div>
          <span className={`inline-block text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider w-fit ${riskBadge[riskLevel]}`}>
            {riskLevel} RISK
          </span>
        </div>

        <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Funding Readiness
            </p>
            <div className="text-2xl font-black text-slate-900 mt-2.5 capitalize">{fundingReadiness.toLowerCase()}</div>
          </div>
          <span className={`inline-block text-[9px] font-extrabold border px-2 py-0.5 rounded-full uppercase tracking-wider w-fit ${readinessBadge[fundingReadiness]}`}>
            {fundingReadiness} CONFIDENCE
          </span>
        </div>

        <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Monthly Revenue Run-Rate
            </p>
            <div className="text-2xl font-black text-slate-900 mt-2.5">{fmt(monthlyRevenueEst)}</div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold leading-tight">Average 30d completed inflows</p>
        </div>

        <div className="bg-white border border-card-border rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              Estimated Capacity Range
            </p>
            <div className="text-xl font-black text-slate-900 mt-2.5">
              {maxCapacity > 0 ? `${fmt(minCapacity)} - ${fmt(maxCapacity)}` : '₦0'}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold leading-tight">Defendable estimate based on score</p>
        </div>
      </div>

      {/* 2-Column Diagnostics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Diagnostics & Spark History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Diagnostics Card */}
          {(businessHealth.weaknesses.length > 0 || businessHealth.nextSteps.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-105" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold tracking-tight uppercase">Why Your Funding Capacity is Limited</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Underwriting models evaluate cashflow health based on ledger consistency, velocity, and reserves.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/80">
                {businessHealth.weaknesses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Identified Weak Areas</h4>
                    <ul className="space-y-2">
                      {businessHealth.weaknesses.map((w, idx) => (
                        <li key={idx} className="text-xs text-rose-300 font-semibold flex items-start gap-2">
                          <span className="text-rose-500 shrink-0 font-bold mt-0.5">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {businessHealth.nextSteps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Readiness Improvement Blueprint</h4>
                    <ul className="space-y-2">
                      {businessHealth.nextSteps.map((stepText, idx) => (
                        <li key={idx} className="text-xs text-slate-350 font-semibold flex items-start gap-2">
                          <span className="text-emerald-400 shrink-0 font-bold mt-0.5">✓</span>
                          <span>{stepText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2 text-[10px] text-indigo-300 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                <span>💡 Target score: Improve Business Health above 65 to unlock growth capital scenarios.</span>
              </div>
            </div>
          )}

          {/* SVG Trend History Chart */}
          <div className="bg-white border border-card-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0 border border-primary-light/50">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-850 text-sm">Business Health History Trend</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Monthly Ledger Progression</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-455 font-bold">Trend: </span>
                {hasHistory ? (
                  <span className={`text-xs font-bold ${trendDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trendDiff >= 0 ? `+${trendDiff}` : trendDiff} points
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold">N/A</span>
                )}
              </div>
            </div>

            {hasHistory ? (
              <div className="pt-4 flex items-center justify-center">
                <svg className="w-full max-w-[500px] h-40" viewBox="0 0 460 160">
                  {/* Background grids */}
                  <line x1="40" y1="30" x2="390" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                  <line x1="40" y1="70" x2="390" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
                  <line x1="40" y1="110" x2="390" y2="110" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {/* Chart line path */}
                  <path
                    d={pointsPath}
                    fill="none"
                    stroke="url(#chart-gradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Area fill under the line */}
                  <path
                    d={`${pointsPath} L ${points[points.length - 1].x} 110 L 40 110 Z`}
                    fill="url(#area-gradient)"
                    opacity="0.1"
                  />

                  {/* Markers & Labels */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      {/* Marker dot */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4.5"
                        fill="#4f46e5"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {/* Score value above dot */}
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        className="text-[10px] font-extrabold text-slate-800"
                      >
                        {p.score}
                      </text>
                      {/* Month label below chart */}
                      <text
                        x={p.x}
                        y="130"
                        textAnchor="middle"
                        className="text-[9px] font-bold text-slate-400 uppercase tracking-wider"
                      >
                        {p.month}
                      </text>
                    </g>
                  ))}

                  {/* Gradients definitions */}
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <TrendingUp className="w-8 h-8 text-slate-300" />
                <h4 className="font-extrabold text-slate-700 text-sm">Insufficient Trend History</h4>
                <p className="text-[11px] text-slate-400 max-w-[340px] leading-relaxed font-semibold">
                  SME financial identity analysis requires at least 3 months of historical ledger transactions to compute a reliable progression trend.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Breakdown Card */}
        <div>
          <div className="bg-white border border-card-border rounded-2xl p-6 space-y-5 hover:shadow-sm transition-shadow h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Business Health Breakdown</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dynamic Score Allocation</p>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                {/* Consistency */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Ledger Consistency</span>
                    <span className="text-slate-800">{businessHealth.breakdown.consistency} <span className="text-slate-400 font-medium">/ 20</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${(businessHealth.breakdown.consistency / 20) * 100}%` }} className="h-full bg-indigo-500 rounded-full" />
                  </div>
                </div>

                {/* Cashflow */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Operating Cashflow</span>
                    <span className="text-slate-800">{businessHealth.breakdown.cashflow} <span className="text-slate-400 font-medium">/ 30</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${(businessHealth.breakdown.cashflow / 30) * 100}%` }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>

                {/* Stability */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Outflow Stability</span>
                    <span className="text-slate-800">{businessHealth.breakdown.stability} <span className="text-slate-400 font-medium">/ 15</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${(businessHealth.breakdown.stability / 15) * 100}%` }} className="h-full bg-sky-500 rounded-full" />
                  </div>
                </div>

                {/* Growth */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Revenue Growth</span>
                    <span className="text-slate-800">{businessHealth.breakdown.growth} <span className="text-slate-400 font-medium">/ 15</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${(businessHealth.breakdown.growth / 15) * 100}%` }} className="h-full bg-violet-500 rounded-full" />
                  </div>
                </div>

                {/* Trust/Credit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Underwriting Trust</span>
                    <span className="text-slate-800">{businessHealth.breakdown.credit} <span className="text-slate-400 font-medium">/ 20</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${(businessHealth.breakdown.credit / 20) * 100}%` }} className="h-full bg-amber-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 text-[10px] text-slate-400 font-semibold leading-relaxed">
              * Score weights: Consistency (20%), Operating Cashflow (30%), Stability (15%), Growth Trends (15%), Underwriting/Credit (20%).
            </div>
          </div>
        </div>

      </div>

      {/* Lenders List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Funding Capacity Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lenders.map((lender) => (
            <div
              key={lender.id}
              className={`bg-white border border-card-border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-sm ${
                !lender.eligible ? 'opacity-85' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white uppercase text-xs tracking-widest shadow-sm">
                      {lender.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{lender.name}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{lender.repaymentTerm} Term</p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      lender.eligible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {lender.eligible ? 'Qualified' : 'Ineligible'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {lender.description}
                </p>

                {lender.eligible ? (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Capacity</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5 tabular-nums">
                        {fmt(lender.maxAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Underwriting Rate</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-0.5">
                        {lender.interestRate}% <span className="text-[10px] text-slate-400 font-medium">/ mo</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-655 bg-red-50/50 border border-red-100 p-2 rounded-xl flex items-start gap-1.5 font-semibold">
                    <Info className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{lender.reason}</span>
                  </p>
                )}
              </div>

              <div className="pt-5 border-t border-slate-50 mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => openSimulator(lender)}
                  disabled={!lender.eligible}
                  className={`flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-colors cursor-pointer`}
                >
                  Simulate Scenario
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Simulations */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Simulation History</h2>
        {applications.length === 0 ? (
          <div className="bg-white border border-card-border rounded-2xl p-10 text-center space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">No simulations executed yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Simulate operational scenarios above and record readiness packages.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-card-border rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-card-border text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Scenario Tier</th>
                    <th className="py-3.5 px-5">Simulated Amount</th>
                    <th className="py-3.5 px-5">Readiness Check</th>
                    <th className="py-3.5 px-5">Capacity Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {new Date(app.createdAt).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-5 text-slate-900">{app.lenderName}</td>
                      <td className="py-4 px-5 text-slate-900 tabular-nums">{fmt(app.requestedAmount)}</td>
                      <td className="py-4 px-5">
                        <span className={`inline-block text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${statusBadge[app.status] ?? statusBadge.PENDING}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 tabular-nums">
                        {fmt(app.packagedProfile.qualifiedMaxAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Simulator Modal */}
      {selectedLender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white uppercase text-sm">
                  {selectedLender.logo}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedLender.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Readiness Scenario Simulator</p>
                </div>
              </div>
              {!applying && !applicationResult && (
                <button
                  type="button"
                  onClick={closeSimulator}
                  className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {!applicationResult ? (
              // Simulator view
              <div className="space-y-6">
                
                {/* Amount Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Simulated Amount</label>
                    <span className="text-lg font-black text-slate-900 tabular-nums">{fmt(simAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={selectedLender.maxAmount}
                    step={5000}
                    value={simAmount}
                    onChange={(e) => setSimAmount(parseInt(e.target.value))}
                    disabled={applying}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{fmt(20000)} min</span>
                    <span>Max Capacity: {fmt(selectedLender.maxAmount)}</span>
                  </div>
                </div>

                {/* Term Select */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Repayment Term</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 6, 12].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSimTerm(term)}
                        disabled={applying}
                        className={`py-3 px-4 border rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 ${
                          simTerm === term
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{term} Months</span>
                        <span className={`text-[10px] ${simTerm === term ? 'text-slate-300' : 'text-slate-400'}`}>
                          (Term Limit)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Output Metrics */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3.5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Details</h4>
                  
                  <div className="space-y-2.5 text-xs font-semibold text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Principal</span>
                      <span className="tabular-nums">{fmt(simAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Underwriting Rate (Monthly)</span>
                      <span>{selectedLender.interestRate}% / month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Total Simulated Interest</span>
                      <span className="text-slate-900 tabular-nums">+{fmt(totalInterest)}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 border-t border-slate-200">
                      <span className="text-slate-400 font-medium">Total Repayment</span>
                      <span className="text-slate-900 tabular-nums">{fmt(totalRepayment)}</span>
                    </div>
                    <div className="flex justify-between pt-2.5 border-t border-slate-200 items-baseline">
                      <span className="text-slate-850 font-bold">Estimated Monthly Repayment</span>
                      <span className="text-base font-black text-slate-900 tabular-nums">{fmt(monthlyRepayment)}</span>
                    </div>
                  </div>
                </div>

                {/* Cashflow Impact Indicator */}
                <div className={`border p-4 rounded-2xl space-y-1.5 transition-all duration-300 ${cashflowImpactColor}`}>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider">Impact on Cashflow: {cashflowImpact}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    {cashflowImpactDesc}
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeSimulator}
                    disabled={applying}
                    className="px-5 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={applying}
                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                  >
                    {applying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      <>
                        Evaluate Underwriting Package
                      </>
                    )}
                  </button>
                </div>

              </div>
            ) : (
              // Application outcome view
              <div className="space-y-6 text-center">
                {applicationResult.status === 'APPROVED' && (
                  <div className="space-y-5">
                    <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900">Simulation Passed!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                        Your business health logs successfully qualify for the <strong>{selectedLender.name}</strong> scenario metrics.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2 text-left max-w-sm mx-auto text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Qualified Principal</span>
                        <span className="text-slate-900 tabular-nums">{fmt(applicationResult.requestedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Estimated Monthly</span>
                        <span className="text-slate-900 tabular-nums">{fmt(monthlyRepayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Scenario Category</span>
                        <span className="text-slate-900">{selectedLender.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {applicationResult.status === 'PENDING' && (
                  <div className="space-y-5">
                    <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-amber-500 mx-auto">
                      <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900">Simulation Review Required</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                        This scenario is flagged for closer analysis. Manual risk reviews of your cashflow consistency ratios would be required.
                      </p>
                    </div>
                  </div>
                )}

                {applicationResult.status === 'REJECTED' && (
                  <div className="space-y-5">
                    <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-500 mx-auto">
                      <XCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900">Simulation Unsuccessful</h4>
                      <p className="text-xs text-red-600 bg-red-50/50 border border-red-100 p-3.5 rounded-2xl text-left leading-relaxed font-semibold max-w-sm mx-auto mt-2">
                        {applicationResult.packagedProfile.rejectionReason || 'Underwriting triggers were not satisfied.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={closeSimulator}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Close & Refresh Page
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
