'use client';

import React from 'react';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  hoverEffect = false,
  className = '',
  ...props
}: GlassCardProps) {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  const variantMap = {
    default:
      'bg-white/75 dark:bg-[#121A2B]/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.4)]',
    elevated:
      'bg-white/90 dark:bg-[#1A243A]/85 backdrop-blur-2xl border border-white/80 dark:border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]',
    glow:
      'bg-gradient-to-br from-white/80 via-white/70 to-indigo-50/40 dark:from-[#121A2B]/90 dark:via-[#121A2B]/75 dark:to-indigo-950/30 backdrop-blur-xl border border-indigo-200/50 dark:border-indigo-500/20 shadow-[0_10px_35px_rgba(99,102,241,0.08)] dark:shadow-[0_12px_40px_rgba(99,102,241,0.2)]',
    flat:
      'bg-slate-50/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60',
    interactive:
      'bg-white/75 dark:bg-[#121A2B]/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgb(0,0,0,0.4)] hover:border-indigo-400/50 dark:hover:border-indigo-400/30 hover:shadow-[0_16px_40px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_16px_45px_rgba(99,102,241,0.25)] hover:-translate-y-1 cursor-pointer transition-all duration-300',
  };

  const hoverClass = hoverEffect && variant !== 'interactive'
    ? 'hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300/60 dark:hover:border-indigo-500/30 transition-all duration-300'
    : '';

  return (
    <div
      className={`rounded-2xl transition-all duration-300 text-slate-800 dark:text-slate-100 ${variantMap[variant]} ${paddingMap[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

