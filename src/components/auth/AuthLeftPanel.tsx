import { AlertTriangle, Check } from 'lucide-react';

const bullets = [
  'No accounting knowledge needed',
  'Works with CSV and POS exports',
  'Built for traders and small retailers',
];

export function AuthLeftPanel() {
  return (
    <div className="flex flex-col justify-between h-full">
      
      <div className="space-y-8">
        
        <span className="inline-block text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          AI CFO for African SMEs
        </span>

        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 leading-snug">
            Understand your business before the day starts.
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            MerchantIQ turns transaction records into cashflow warnings, growth suggestions,
            and credit-readiness guidance — in plain language.
          </p>
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                F
              </div>
              <span className="text-sm font-semibold text-slate-800">Today&apos;s Business Brief</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>

          
          <div className="px-4 py-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Yesterday&apos;s sales</span>
              <span className="font-semibold text-slate-900">₦184,000</span>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-800 text-xs leading-snug">
                <strong>Cashflow warning:</strong> Rent is due in 6 days.
              </span>
            </div>

            <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <span className="text-slate-400 text-xs mt-0.5">💡</span>
              <span className="text-slate-600 text-xs leading-snug">
                <strong>Suggestion:</strong> Restock beverages before Friday peak.
              </span>
            </div>
          </div>

          
          <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Powered by Gemini · Updated 7:02 AM</span>
          </div>
        </div>

        
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm text-slate-600">
              <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
