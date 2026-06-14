'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Printer,
  Copy,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  Activity,
  Award,
  Lock,
} from 'lucide-react';

interface PublicMerchantData {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory: string;
  location: string;
  verifiedDuration: string;
  verifiedAt: string;
  businessHealth: {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    strengths: string[];
  };
  consistency: {
    activeWeeks: number;
    percentage: number;
  };
  riskBand: string;
}

export default function PublicPassportPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<PublicMerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchPassport() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/public/merchant/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
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
    if (id) {
      fetchPassport();
    }
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printPassport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-400 font-medium">Retrieving Verified Trust Record...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Passport Not Found</h1>
            <p className="text-slate-400 text-sm mt-2">
              This passport URL is invalid or has expired. Please contact the merchant to request a new link.
            </p>
          </div>
          <button
            onClick={fetchPassport}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const riskColor =
    data.businessHealth.riskLevel === 'LOW'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
      : data.businessHealth.riskLevel === 'MEDIUM'
        ? 'text-amber-400 border-amber-500/30 bg-amber-500/5'
        : 'text-rose-400 border-rose-500/30 bg-rose-500/5';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-hidden font-sans">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Control Panel (Hidden on print) */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-slate-300 text-sm font-semibold">Verified MerchantIQ Passport</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 text-sm font-semibold transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Passport Link'}
          </button>
          <button
            onClick={printPassport}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* The Slate Passport Document */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Border trim highlight */}
        <div className="h-1.5 bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-500 print:hidden" />

        {/* Passport Header */}
        <div className="p-8 sm:p-10 border-b border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/50 print:bg-transparent">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 print:border-black print:text-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-white uppercase print:text-black">
                MerchantIQ <span className="text-emerald-400 font-semibold text-xs tracking-wider border border-emerald-500/30 px-2 py-0.5 rounded-full ml-1.5 uppercase print:border-black print:text-black">Trust Ledger</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 uppercase mt-3 print:text-black">
              Verified SME Trust Passport
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider print:text-slate-600">
              Alternative Credit Underwriting & Verified Cashflow Ledger
            </p>
          </div>
          <div className="text-left sm:text-right space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider print:text-slate-600">Passport Status</p>
            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase print:border-black print:text-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Ledger
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1 print:text-slate-600">
              ID: {data.id.slice(0, 8).toUpperCase()}-{data.id.slice(9, 13).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Passport Grid Info */}
        <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Column Left: Business Identity */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 print:border-slate-300 print:text-slate-700">
              Verified Identity
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Business Name</p>
                <p className="text-base font-extrabold text-white mt-1 print:text-black">{data.businessName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1 print:text-black">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 print:text-black shrink-0" />
                  {data.location}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operating Segment</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 print:text-black">{data.businessCategory}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Type</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 print:text-black">{data.businessType}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified Duration</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1 print:text-black">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 print:text-black shrink-0" />
                  {data.verifiedDuration} of statements
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verification Date</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 print:text-black">
                  {new Date(data.verifiedAt).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Premium Seal of Trust */}
            <div className="bg-slate-900/60 border border-slate-800 p-4.5 rounded-2xl flex items-start gap-3.5 print:border-slate-200 print:bg-transparent">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 print:border-black print:text-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 print:text-black">Alternative Credit Underwriting Signal</p>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1 print:text-slate-600">
                  This passport transforms raw transaction records into structured, verifiable insights, allowing financial partners to assess risk rapidly without leaking private numbers.
                </p>
              </div>
            </div>
          </div>

          {/* Column Right: Trust & Health Metrics */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 print:border-slate-300 print:text-slate-700">
              Underwriting Signals
            </h2>

            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                    className="print:stroke-slate-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={
                      data.businessHealth.score >= 75
                        ? '#10b981'
                        : data.businessHealth.score >= 50
                          ? '#f59e0b'
                          : '#ef4444'
                    }
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - data.businessHealth.score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white print:text-black">{data.businessHealth.score}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider print:text-slate-600">Health Score</span>
                </div>
              </div>

              {/* Score Breakdown & Risk Rating */}
              <div className="space-y-3 w-full text-center sm:text-left">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Risk Profile</p>
                  <span className={`inline-block text-xs font-bold border px-3 py-1 rounded-full uppercase tracking-wider mt-1.5 ${riskColor} print:border-black print:text-black`}>
                    {data.riskBand}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ledger Consistency</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                    <span className="text-sm font-extrabold text-white print:text-black">{data.consistency.percentage}%</span>
                    <span className="text-xs text-slate-400 print:text-slate-600 font-semibold">
                      ({data.consistency.activeWeeks} of last 8 weeks active)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths list */}
            {data.businessHealth.strengths.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified Drivers of Trust</p>
                <div className="space-y-2">
                  {data.businessHealth.strengths.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-slate-300 print:text-slate-800">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5 print:text-black">✓</span>
                      <p className="font-semibold leading-relaxed">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Lock Banner */}
        <div className="px-8 py-4 sm:px-10 bg-slate-950/40 border-t border-b border-slate-800/80 flex items-center gap-3.5 print:bg-transparent print:border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 print:border-black print:text-black">
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed print:text-slate-600">
            <strong>Privacy Shield Enabled:</strong> Detailed cash-on-hand reserves, precise Naira balances, runway duration counts, and individual transaction lists are securely masked. Only standard relative risk signals are shown.
          </p>
        </div>

        {/* Footer / Printable Stamp */}
        <div className="p-8 sm:p-10 bg-slate-900/50 print:bg-transparent flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="max-w-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Regulatory & Compliance Disclaimer</p>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-1 print:text-slate-600">
              This digital passport is compiled directly from files uploaded by the merchant. MerchantIQ verifies layout integrity and parses details objectively, but cannot cross-reference with central bank credit bureaus. Lenders should execute normal compliance loops.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center bg-slate-950 border border-slate-800 px-5 py-3.5 rounded-2xl print:border-slate-300 print:bg-transparent">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Passport Signature</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-extrabold tracking-wider uppercase print:text-black">
              <ShieldCheck className="w-4 h-4 text-emerald-500 print:text-black" />
              Verified Ledger
            </div>
            <p className="text-[9px] text-slate-500 font-semibold mt-1">MERCHANTIQ TRUST NETWORK</p>
          </div>
        </div>
      </div>
    </div>
  );
}
