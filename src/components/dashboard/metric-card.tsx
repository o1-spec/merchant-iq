import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number | null;
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, trend, trendLabel, icon }: MetricCardProps) {
  const isPositive = trend !== undefined && trend !== null && trend > 0;
  const isNegative = trend !== undefined && trend !== null && trend < 0;
  const isFlat = trend === 0;

  return (
    <div className="bg-white border border-card-border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary border border-primary-light">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1.5 leading-snug">{subtitle}</p>}
      </div>

      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isPositive 
                ? 'bg-primary-light text-primary border-primary-light/40' 
                : isNegative 
                  ? 'bg-red-50 text-red-600 border-red-100' 
                  : 'bg-slate-50 text-slate-500 border-slate-100'
            }`}
          >
            {isPositive && <TrendingUp className="w-3 h-3 text-primary shrink-0" />}
            {isNegative && <TrendingDown className="w-3 h-3 text-red-600 shrink-0" />}
            {isFlat && <Minus className="w-3 h-3 text-slate-500 shrink-0" />}
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-slate-400 font-medium">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
