'use client';

import React from 'react';
import GlassCard from './GlassCard';

export interface GlassWidgetProps {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function GlassWidget({
  title,
  badge,
  action,
  children,
  className = '',
}: GlassWidgetProps) {
  return (
    <GlassCard variant="default" padding="md" className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/60 dark:border-white/5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h4>
          {badge}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </GlassCard>
  );
}

