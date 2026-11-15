'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface GlassNotificationProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function GlassNotification({
  type = 'info',
  title,
  message,
  onDismiss,
  className = '',
}: GlassNotificationProps) {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      style:
        'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-100',
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      style:
        'bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-100',
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
      style:
        'bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-100',
    },
    info: {
      icon: <Info className="w-4 h-4 text-indigo-500" />,
      style:
        'bg-indigo-500/10 border-indigo-500/20 text-indigo-950 dark:text-indigo-100',
    },
  }[type];

  return (
    <div
      className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl backdrop-blur-md border shadow-sm transition-all duration-200 animate-slideDown ${config.style} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="shrink-0 mt-0.5">{config.icon}</span>
        <div className="text-xs">
          {title && <p className="font-bold leading-tight">{title}</p>}
          <p className="mt-0.5 leading-relaxed opacity-90">{message}</p>
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          type="button"
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

