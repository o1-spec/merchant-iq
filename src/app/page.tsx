'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMe } from '@/lib/auth-client';
import {
  Menu,
  X,
  BarChart2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Upload,
  Sparkles,
  Check,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Package,
} from 'lucide-react';

const problems = [
  {
    icon: AlertTriangle,
    title: 'Cash runs out unexpectedly',
    description:
      'Money leaves the account before you have a chance to plan. Rent, supplier payments, and restocking all hit at once.',
  },
  {
    icon: Package,
    title: 'Stock decisions are based on guesswork',
    description:
      'You reorder when shelves look empty, not based on what actually sold. That leads to overstocking slow items and running out of bestsellers.',
  },
  {
    icon: CreditCard,
    title: 'Credit applications lack clear financial proof',
    description:
      'When you apply for a loan, lenders ask for income proof you do not have in a form they accept. MerchantIQ helps you build that record.',
  },
];

const features = [
  {
    icon: BarChart2,
    title: 'Cashflow Warnings',
    description:
      'See upcoming payments before they arrive. MerchantIQ flags rent, supplier dues, and low balance periods based on your transaction history.',
  },
  {
    icon: FileText,
    title: 'Daily Business Brief',
    description:
      'A short morning summary of what your business did yesterday, what to expect today, and one thing to act on. No jargon.',
  },
  {
    icon: TrendingUp,
    title: 'Credit Readiness Coach',
    description:
      'Get a plain-language view of what your financials look like to a lender, and specific steps to improve your position over time.',
  },
];

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload bank or POS statement',
    description:
      'Export a CSV from your bank or POS app and upload it. It takes under a minute.',
  },
  {
    icon: BarChart2,
    number: 2,
    title: 'MerchantIQ organises the data',
    description:
      'Transactions are categorised, patterns are identified, and your cashflow picture comes together automatically.',
  },
  {
    icon: Sparkles,
    number: 3,
    title: 'Gemini explains what to do next',
    description:
      'You get a clear summary and practical suggestions written in plain language — not a financial report.',
  },
];

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [briefState, setBriefState] = useState<'initial' | 'loading' | 'updated'>('initial');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    getMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const handleRefreshBrief = () => {
    setBriefState('loading');
    setTimeout(() => setBriefState('updated'), 1600);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">


      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">


          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">MerchantIQ</span>
          </Link>


          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => smoothScrollTo('features')} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
              Features
            </button>
            <button onClick={() => smoothScrollTo('how-it-works')} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
              How It Works
            </button>
            <button onClick={() => smoothScrollTo('business-model')} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
              Business Model
            </button>
            <button onClick={() => smoothScrollTo('why-merchantiq')} className="text-sm text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
              Why MerchantIQ
            </button>
          </nav>


          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated === true ? (
              <Link
                href="/dashboard"
                className="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : isAuthenticated === false ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md transition-colors"
                >
                  Try Demo
                </Link>
              </>
            ) : (
              <div className="w-20 h-8" />
            )}
          </div>


          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>


        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4">
            <nav className="flex flex-col gap-3">
              <button onClick={() => { smoothScrollTo('features'); setMobileMenuOpen(false); }} className="text-sm text-slate-600 py-1 text-left">Features</button>
              <button onClick={() => { smoothScrollTo('how-it-works'); setMobileMenuOpen(false); }} className="text-sm text-slate-600 py-1 text-left">How It Works</button>
              <button onClick={() => { smoothScrollTo('business-model'); setMobileMenuOpen(false); }} className="text-sm text-slate-600 py-1 text-left">Business Model</button>
              <button onClick={() => { smoothScrollTo('why-merchantiq'); setMobileMenuOpen(false); }} className="text-sm text-slate-600 py-1 text-left">Why MerchantIQ</button>
            </nav>
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              {isAuthenticated === true ? (
                <Link href="/dashboard" className="text-sm text-center font-semibold bg-primary text-white py-2.5 rounded-md">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-center text-slate-700 py-2">Login</Link>
                  <Link href="/login" className="text-sm text-center font-semibold bg-primary text-white py-2.5 rounded-md">Try Demo</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>


        <section className="pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-100 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">


              <div>
                <p className="text-sm font-medium text-primary mb-5">
                  Built for traders, provision stores, POS agents, and small retailers.
                </p>

                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5">
                  Know what your business is really doing
                </h1>

                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  MerchantIQ turns transaction records into cashflow warnings, growth suggestions,
                  and credit-readiness guidance for small business owners.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  {isAuthenticated === true ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-slate-950 text-white font-semibold px-7 py-3.5 rounded-lg transition-all text-sm"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-slate-950 text-white font-semibold px-7 py-3.5 rounded-lg transition-all text-sm"
                      >
                        Try Demo
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 rounded-lg transition-all text-sm"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>


                <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-8">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">₦184k</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">Avg daily sales tracked</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">3 mins</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">To get your first brief</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">Free</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">To start, no card needed</p>
                  </div>
                </div>
              </div>


              <div className="hidden lg:block">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">


                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">F</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Femi&apos;s Store</p>
                        <p className="text-xs text-slate-400">Balogun Market · Lagos</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">Live</span>
                  </div>


                  <div className="grid grid-cols-2 gap-px bg-slate-100">
                    <div className="bg-white px-5 py-4">
                      <p className="text-xs text-slate-400 mb-1">Yesterday&apos;s sales</p>
                      <p className="text-xl font-bold text-slate-900">₦184,000</p>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">↑ 18% vs Mon</p>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="text-xs text-slate-400 mb-1">Cash balance</p>
                      <p className="text-xl font-bold text-slate-900">₦310,500</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">After expenses</p>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="text-xs text-slate-400 mb-1">Cash runway</p>
                      <p className="text-xl font-bold text-slate-900">42 days</p>
                      <span className="inline-block text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded mt-0.5">Low risk</span>
                    </div>
                    <div className="bg-white px-5 py-4">
                      <p className="text-xs text-slate-400 mb-1">Credit readiness</p>
                      <p className="text-xl font-bold text-slate-900">740</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">of 850 · Excellent</p>
                    </div>
                  </div>


                  <div className="border-t border-slate-200 bg-amber-50 px-5 py-3.5 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Cashflow warning</p>
                      <p className="text-xs text-amber-700 mt-0.5">Shop rent of ₦120,000 is due in 6 days. Restock beverages before Friday peak.</p>
                    </div>
                  </div>


                  <div className="px-5 py-3 flex items-center gap-1.5 border-t border-slate-100">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs text-slate-400">Powered by Gemini · Updated 7:02 AM</p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>


        <section id="why-merchantiq" className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Most merchants see transactions. Few see the full picture.
              </h2>
              <p className="text-slate-600 text-base">
                Your payment app tells you what came in and went out. MerchantIQ helps you understand what it means for tomorrow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {problems.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{p.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        <section id="features" className="py-20 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Three things MerchantIQ does for you
              </h2>
              <p className="text-slate-600 text-base">
                No accounting degree needed. Upload your data and get clear answers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="border border-slate-200 rounded-xl p-6 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-emerald-700" />
                      </div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">0{i + 1}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        <section className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">


              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                  Your morning business summary, every day
                </h2>
                <p className="text-slate-600 text-base leading-relaxed mb-6">
                  Instead of opening your POS reports and trying to work it out yourself, MerchantIQ sends
                  you a plain-language summary of what happened yesterday and what needs your attention today.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'How much you made yesterday',
                    'Whether a payment or expense is coming up soon',
                    'One practical suggestion for the day',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleRefreshBrief}
                  disabled={briefState === 'loading'}
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {briefState === 'initial' && 'See a sample brief'}
                  {briefState === 'loading' && 'Generating...'}
                  {briefState === 'updated' && 'See another version'}
                </button>
              </div>


              <div className="max-w-sm w-full">


                <div className="bg-[#e5ddd5] rounded-2xl p-4 border border-slate-200">


                  <div className="flex items-center gap-3 bg-[#075e54] rounded-xl px-4 py-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-300 flex items-center justify-center shrink-0">
                      <span className="text-emerald-900 font-bold text-sm">M</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">MerchantIQ</p>
                      <p className="text-emerald-200 text-xs">Daily brief · just now</p>
                    </div>
                  </div>


                  <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3.5 text-sm text-slate-800 leading-relaxed space-y-2">
                    {briefState === 'loading' ? (
                      <div className="flex items-center gap-2 py-3 text-slate-400 text-xs">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                        </span>
                        MerchantIQ is thinking...
                      </div>
                    ) : briefState === 'updated' ? (
                      <>
                        <p className="font-semibold text-slate-900">Good morning, Femi. 👋</p>
                        <p>Here is how yesterday went and what to watch today.</p>
                        <div className="border-t border-slate-100 pt-2 space-y-1.5">
                          <p>📊 <span className="font-medium">Sales yesterday:</span> ₦184,000</p>
                          <p>📉 <span className="font-medium">Cashflow warning:</span> Rent is due in 6 days. You have ₦310,000 in balance — that covers it, but do not spend down further before then.</p>
                          <p>💡 <span className="font-medium">Suggestion:</span> Beverages sold out twice last week. Restock before Friday to avoid missing peak weekend sales.</p>
                        </div>
                        <p className="text-xs text-slate-400 pt-1">Powered by Gemini · Updated 7:02 AM</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-900">Good morning, Femi. 👋</p>
                        <div className="border-t border-slate-100 pt-2 space-y-1.5">
                          <p>📊 <span className="font-medium">Yesterday&apos;s sales:</span> ₦184,000</p>
                          <p>⚠️ <span className="font-medium">Cashflow warning:</span> Rent is due in 6 days.</p>
                          <p>💡 <span className="font-medium">Suggestion:</span> Restock beverages before Friday peak sales.</p>
                        </div>
                        <p className="text-xs text-slate-400 pt-1">Powered by Gemini · 7:02 AM</p>
                      </>
                    )}
                  </div>


                  <p className="text-right text-xs text-slate-500 mt-2 px-1">✓✓ Delivered</p>
                </div>

                <p className="text-xs text-slate-400 mt-3 text-center">
                  This is a preview. Your actual brief is based on your own transaction data.
                </p>
              </div>

            </div>
          </div>
        </section>


        <section id="how-it-works" className="py-20 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                How it works
              </h2>
              <p className="text-slate-600 text-base">
                No installation, no technical setup. Just upload what you already have.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="flex gap-5">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full border-2 border-emerald-600 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm">
                        {s.number}
                      </div>
                      <div className="w-px flex-1 bg-slate-200 mt-3 mb-0 hidden md:block" />
                    </div>
                    <div className="pb-8 md:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="business-model" className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Hackathon Pitch Focus
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                How MerchantIQ Makes Money
              </h2>
              <p className="text-slate-600 text-base">
                Our business model scales with small business owners while unlocking high-margin referral and API revenue from financial partners.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Pro Subscription */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                    1
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">MerchantIQ Pro</h3>
                  <p className="text-xs text-slate-400 mb-4">SME Software-as-a-Service</p>
                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Free Tier</span>
                      <ul className="text-[11px] text-slate-500 space-y-1">
                        <li>• Upload statement logs</li>
                        <li>• Basic financial summary</li>
                        <li>• Basic cashflow insights</li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block mb-1">Pro Tier <span className="text-slate-400 font-normal">(₦2,000 - ₦5,000/mo)</span></span>
                      <ul className="text-[11px] text-slate-600 space-y-1">
                        <li>• Unlimited statement uploads</li>
                        <li>• Daily AI CFO morning brief</li>
                        <li>• Credit-readiness coaching reports</li>
                        <li>• Advanced runway forecasting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Referral Fees */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Credit Marketplace</h3>
                  <p className="text-xs text-slate-400 mb-4">Referrals & Matchmaking</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    We earn referral and matching commissions from lending institutions when qualified merchants access financing options.
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Lending Partners</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Automated credit readiness metrics pre-qualify SMEs, reducing acquisition costs for partner banks and micro-lenders.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. API Subscriptions */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Embedded Underwriting API</h3>
                  <p className="text-xs text-slate-400 mb-4">B2B Financial Intelligence</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Fintechs, banks, and lending companies pay to query MerchantIQ&apos;s alternative credit readiness score to evaluate non-formal SME credit risks.
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Alternative Data</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Turns raw, unstructured PDF/CSV transaction statement records into standardized underwriting signals in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-24 bg-white border-t border-slate-100">
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 mb-6 text-blue-600 shadow-sm">
              <ShoppingBag className="w-7 h-7" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5 leading-tight tracking-tight">
              Every small business owner deserves to understand their own money.
            </h2>
            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              MerchantIQ is free to try. Upload your first statement and see what your transactions are telling you — in plain language.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated === true ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-slate-950 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-sm hover:shadow-md text-base"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-slate-950 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-sm hover:shadow-md text-base"
                  >
                    Try Demo
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl transition-all text-base"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            <p className="text-slate-400 text-xs mt-6">No credit card required &nbsp;·&nbsp; Takes under 3 minutes</p>
          </div>
        </section>

      </main>


      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-slate-800 text-sm">MerchantIQ</span>
          </div>
          <p className="text-xs text-slate-400 text-center sm:text-right">
            AI-powered business intelligence for African SMEs. &copy; {new Date().getFullYear()} MerchantIQ.
          </p>
        </div>
      </footer>

    </div>
  );
}
