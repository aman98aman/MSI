'use client';

import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  titleClassName?: string;
  accentColor?: 'maroon' | 'gold' | 'navy';
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
  titleClassName = '',
  accentColor = 'maroon',
}: SectionHeadingProps) {
  const alignClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  const accentColorMap = {
    maroon: 'text-[#89190E]',
    gold: 'text-[#EFC988]',
    navy: 'text-[#10233F]',
  };

  return (
    <div className={`flex flex-col ${alignClasses[align]} ${className}`}>
      {eyebrow && (
        <div className="inline-flex items-center space-x-3 mb-3">
          <span className="h-[2px] w-8 bg-[#EFC988] rounded-full" />
          <span
            className={`text-xs sm:text-sm font-bold tracking-[0.25em] uppercase ${accentColorMap[accentColor]}`}
          >
            {eyebrow}
          </span>
          <span className="h-[2px] w-8 bg-[#EFC988] rounded-full" />
        </div>
      )}

      <h2
        className={`font-serif font-bold text-[#10233F] tracking-tight ${titleClassName || 'text-3xl sm:text-4xl lg:text-5xl'}`}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-4 text-[#526174] text-base sm:text-lg leading-relaxed max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
