'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, UploadCloud, BarChart3, ShieldCheck, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';
import { completeOnboarding } from '@/lib/dashboard-client';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: 'Welcome to MerchantIQ',
      description: 'MerchantIQ helps you understand your business health and creditworthiness directly from transaction data.',
      icon: Sparkles,
      color: 'text-primary bg-primary-light border-primary-light/50',
      features: [
        'No manual bookkeeping – upload bank/POS CSV statements directly.',
        'Alternative credit score – prove your creditworthiness to lenders.',
        'Simple English – zero complex corporate financial jargon.',
      ]
    },
    {
      title: 'Upload transaction data',
      description: 'Start by uploading a bank, POS, or wallet statement. We support OPay, Moniepoint, and other major statements.',
      icon: UploadCloud,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      cta: {
        label: 'Go to Upload',
        action: async () => {
          await handleFinish('/upload');
        }
      },
      features: [
        'Supported statements – Access Bank, GTBank, OPay, Moniepoint, Zenith Bank, etc.',
        'Smart templates – auto-detects and configures custom spreadsheet headers.',
        'Secure parsing – statement details are processed securely and locally.',
      ]
    },
    {
      title: 'Review business dashboard',
      description: 'We instantly calculate key metrics: total revenue, expenses, net profit, cashflow runway, and credit readiness.',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      features: [
        'Runway forecast – see exactly how many days your cash position will last.',
        'Inflow/Outflow trends – track daily and weekly sales patterns.',
        'Expense breakdown – visualize exactly where your operational cash goes.',
      ]
    },
    {
      title: 'Generate AI CFO insights',
      description: 'Gemini analyzes your statement patterns and generates plain-language financial advice tailored to your growth.',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      features: [
        'Daily morning brief – custom checklists and alerts for your day.',
        'Interactive chatbot – ask questions like "Can I afford to restock?" anytime.',
        'Repayment coaching – clear risk warnings before you decide to borrow.',
      ]
    }
  ];

  async function handleFinish(redirectPath?: string) {
    if (loading) return;
    setLoading(true);
    try {
      await completeOnboarding();
      onComplete();
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      onComplete();
    } finally {
      setLoading(false);
    }
  }

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden relative transition-all duration-300 transform animate-in fade-in zoom-in-95 slide-in-from-bottom-8">

        {/* Top bar with Skip/Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Onboarding · {step + 1} of 4
          </span>
          <button
            onClick={() => handleFinish()}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            title="Skip Onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body with anim key */}
        <div key={step} className="p-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-right-5 duration-300">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border mb-6 ${currentStep.color}`}>
            <StepIcon className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentStep.title}
          </h2>

          <p className="text-slate-655 text-base mt-4 leading-relaxed font-medium max-w-md">
            {currentStep.description}
          </p>

          {currentStep.features && (
            <ul className="mt-6 space-y-2.5 text-left w-full max-w-md border-t border-slate-100 pt-5">
              {currentStep.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}

          {currentStep.cta && (
            <button
              onClick={currentStep.cta.action}
              disabled={loading}
              className="mt-6 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {currentStep.cta.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => handleFinish()}
            disabled={loading}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Skip
          </button>

          {/* Stepper Dot Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200'
                  }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-semibold text-xs py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={loading}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition-all"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleFinish()}
                disabled={loading}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition-all shadow-sm"
              >
                {loading ? 'Finishing...' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
