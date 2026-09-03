import React from 'react';
import { type LucideProps, TrendingUp, TrendingDown } from 'lucide-react';
import { CountUp } from '../animations/CountUp';

type LucideIcon = React.FC<LucideProps>;

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'blue',
  subtitle,
  onClick,
}) => {
  const colorClasses: Record<string, string> = {
    blue:     'bg-gradient-to-br from-blue-600 to-teal-500',
    teal:     'bg-gradient-to-br from-teal-500 to-green-500',
    green:    'bg-gradient-to-br from-emerald-500 to-cyan-500',
    orange:   'bg-gradient-to-br from-orange-500 to-red-500',
    coral:    'bg-gradient-to-br from-orange-500 to-rose-500',
    lavender: 'bg-gradient-to-br from-violet-500 to-blue-500',
    yellow:   'bg-gradient-to-br from-amber-500 to-orange-500',
    pink:     'bg-gradient-to-br from-rose-500 to-pink-500',
    cyan:     'bg-gradient-to-br from-sky-500 to-blue-600',
  };

  const gradientClass = colorClasses[color] ?? colorClasses.blue;
  const isNumeric = typeof value === 'number';

  return (
    <div
      className={`${gradientClass} rounded-xl relative overflow-hidden transition-all duration-200 flex flex-row min-h-[80px] ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]' : ''
      } shadow-sm`}
      onClick={onClick}
    >
      {/* Decorative overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/10 pointer-events-none" />
      <div className="absolute -top-5 -right-5 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-4 -left-3 w-14 h-14 bg-black/8 rounded-full pointer-events-none" />

      {/* Icon column */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-center px-3 border-r border-white/20">
        <div className="p-2 bg-white/25 backdrop-blur-sm rounded-xl border border-white/30">
          <Icon size={16} className="text-white" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-3 py-3 flex flex-col justify-center min-w-0 gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-2xl font-black text-white leading-none tabular-nums">
            {isNumeric ? (
              <CountUp end={value as number} duration={1200} />
            ) : (
              value
            )}
          </p>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
              trendUp ? 'bg-white/20 text-white' : 'bg-black/20 text-white/80'
            }`}>
              {trendUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {trend}
            </span>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-tight truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-white/65 leading-tight mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20" />
    </div>
  );
};
