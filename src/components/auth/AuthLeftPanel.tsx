import Link from 'next/link';
import { AlertTriangle, Check } from 'lucide-react';

const bullets = [
  'No accounting knowledge needed',
  'Works with CSV and POS exports',
  'Built for traders and small retailers',
];

export function AuthLeftPanel() {
  return (
    <div className="flex flex-col justify-between h-full min-h-[500px] text-white">
      
      <div className="space-y-8">
        
        {/* Integrated Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">MerchantIQ</span>
          </Link>
        </div>

        {/* Highlight Badge */}
        <div>
          <span className="inline-block text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-3 py-1 rounded-full">
            AI CFO for African SMEs
          </span>
        </div>

        {/* Pitch Headline */}
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Understand your business before the day starts.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            MerchantIQ turns transaction records into cashflow warnings, growth suggestions,
            and credit-readiness guidance — in plain language.
          </p>
        </div>

        {/* Glassmorphism Brief Preview Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden backdrop-blur-md">
          
          <div className="bg-slate-900/80 border-b border-slate-800/60 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900/50 flex items-center justify-center font-bold text-[10px]">
                F
              </div>
              <span className="text-xs font-bold text-slate-200">Today&apos;s Business Brief</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>

          <div className="px-4 py-4 space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Yesterday&apos;s sales</span>
              <span className="font-bold text-white text-sm">₦184,000</span>
            </div>

            <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/40 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-200 text-xs leading-snug">
                <strong>Cashflow warning:</strong> Rent is due in 6 days.
              </span>
            </div>

            <div className="flex items-start gap-2 bg-slate-800/30 border border-slate-800/40 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-xs mt-0.5">💡</span>
              <span className="text-slate-300 text-xs leading-snug">
                <strong>Suggestion:</strong> Restock beverages before Friday peak.
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800/60 px-4 py-2.5 flex items-center gap-1.5 bg-slate-950/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500">Powered by Gemini · Updated 7:02 AM</span>
          </div>
        </div>

        {/* Bullet Points */}
        <ul className="space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-900/50 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
