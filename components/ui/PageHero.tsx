'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  breadcrumbs?: Breadcrumb[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
  children?: React.ReactNode;
  className?: string;
  minHeight?: string;
}

export default function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  subtitle,
  bgImage,
  children,
  className = '',
  minHeight = 'min-h-[340px] sm:min-h-[400px]',
}: PageHeroProps) {
  const hasBg = !!bgImage;

  return (
    <div
      className={`relative overflow-hidden ${minHeight} flex flex-col justify-end ${hasBg ? '' : 'bg-gradient-to-br from-[#10233F] via-[#1c355e] to-[#10233F]'} ${className}`}
    >
      {/* Background image */}
      {bgImage && (
        <>
          <Image
            src={bgImage}
            alt={title}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={90}
          />
          {/* Deep gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#10233F] via-[#10233F]/75 to-[#10233F]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#10233F]/90 via-[#10233F]/50 to-transparent pointer-events-none" />
        </>
      )}

      {/* Decorative gold top border */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#89190E] via-[#EFC988] to-[#89190E]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-16 py-14 sm:py-16">
        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center flex-wrap gap-2 text-[11px] sm:text-xs font-semibold mb-6 text-white/60"
          >
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-white/30">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[#EFC988] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#EFC988]">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Eyebrow */}
        {eyebrow && (
          <div className="inline-flex items-center space-x-3 mb-4">
            <span className="h-[2px] w-6 bg-[#EFC988] rounded-full" />
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#EFC988] uppercase">
              {eyebrow}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-3xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-4 text-white/70 text-sm sm:text-base max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Optional children (CTA buttons etc.) */}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
