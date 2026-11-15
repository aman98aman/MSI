'use client';

import React, { useState } from 'react';

export interface GlassTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function GlassTooltip({
  content,
  children,
  position = 'top',
  className = '',
}: GlassTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionMap = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionMap[position]} px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-lg shadow-lg pointer-events-none z-50 whitespace-nowrap animate-fadeIn`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

