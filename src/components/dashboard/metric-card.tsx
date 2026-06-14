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
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1.5">
          {isPositive && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
          {isFlat && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span
            className={`text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {isPositive ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
