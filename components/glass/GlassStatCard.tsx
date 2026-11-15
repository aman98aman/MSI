'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlassCard from './GlassCard';

export interface GlassStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: string | { value: string; isPositive?: boolean };
  trendDirection?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon: React.ReactNode;
  iconGradient?: string;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export default function GlassStatCard({
  title,
  value,
  description,
  trend,
  trendDirection = 'up',
  trendLabel = 'vs last period',
  icon,
  iconGradient = 'from-indigo-500 to-blue-600',
  sparklineData,
  onClick,
  className = '',
}: GlassStatCardProps) {
  const trendText = typeof trend === 'object' && trend !== null ? trend.value : trend;
  const effectiveDirection =
    typeof trend === 'object' && trend !== null && trend.isPositive !== undefined
      ? trend.isPositive
        ? 'up'
        : 'down'
      : trendDirection;

  // Generate SVG Sparkline path if sparklineData is provided
  const sparklineSvg = React.useMemo(() => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 32;
    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  }, [sparklineData]);

  const trendColorClass =
    effectiveDirection === 'up'
      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : effectiveDirection === 'down'
      ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
      : 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <GlassCard
      variant="default"
      padding="md"
      hoverEffect
      onClick={onClick}
      className={`relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Soft Ambient Background Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-blue-500/0 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            {value}
          </h3>
        </div>

        {/* Floating Icon Box */}
        <div
          className={`p-3 rounded-2xl bg-gradient-to-br ${iconGradient} text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300 shrink-0`}
        >
          {icon}
        </div>
      </div>

      {/* Sparkline & Trend Section */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {trendText && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${trendColorClass}`}
            >
              {effectiveDirection === 'up' && <TrendingUp className="w-3 h-3" />}
              {effectiveDirection === 'down' && <TrendingDown className="w-3 h-3" />}
              {effectiveDirection === 'neutral' && <Minus className="w-3 h-3" />}
              {trendText}
            </span>
          )}
          {trendLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {trendLabel}
            </span>
          )}
          {!trend && description && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {description}
            </span>
          )}
        </div>

        {/* Mini SVG Sparkline */}
        {sparklineSvg && (
          <div className="w-20 h-7 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 32" className="w-full h-full overflow-visible">
              <path
                d={sparklineSvg}
                fill="none"
                stroke={trendDirection === 'down' ? '#F43F5E' : '#6366F1'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

