'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function GlassButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeMap = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-medium',
    sm: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 rounded-xl font-medium',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl font-medium',
    lg: 'px-6 py-3.5 text-base gap-2.5 rounded-2xl font-semibold',
  };

  const variantMap = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_22px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 border border-indigo-400/30 active:translate-y-0 active:scale-[0.98]',
    secondary:
      'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-white/10 shadow-sm hover:shadow hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
    outline:
      'bg-transparent text-indigo-600 dark:text-indigo-400 border border-indigo-300/80 dark:border-indigo-500/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 active:scale-[0.98]',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white active:scale-[0.98]',
    destructive:
      'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-500/30 hover:bg-red-500/20 shadow-sm active:scale-[0.98]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}

