'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, UploadCloud, BarChart3, ShieldCheck, ArrowRight, ArrowLeft, X } from 'lucide-react';
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
      }
    },
    {
      title: 'Review business dashboard',
      description: 'We instantly calculate key metrics: total revenue, expenses, net profit, cashflow runway, and credit readiness.',
      icon: BarChart3,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Generate AI CFO insights',
      description: 'Gemini analyzes your statement patterns and generates plain-language financial advice tailored to your growth.',
      icon: ShieldCheck,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden relative transition-all duration-300">
        
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

        {/* Content body */}
        <div className="p-8 flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 ${currentStep.color}`}>
            <StepIcon className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currentStep.title}
          </h2>
          
          <p className="text-slate-500 text-sm mt-3.5 leading-relaxed font-medium">
            {currentStep.description}
          </p>

          {currentStep.cta && (
            <button
              onClick={currentStep.cta.action}
              disabled={loading}
              className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition-all shadow-sm"
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
