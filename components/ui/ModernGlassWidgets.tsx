'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

/* ── 1. Ambient Background Glow Orbs for Glass Containers ───────────────── */
export function GlassAmbientBackdrop({
  orbs = ['maroon', 'gold', 'navy'],
}: {
  orbs?: Array<'maroon' | 'gold' | 'navy'>;
}) {
  return (
    <div className="ambient-glow-container select-none pointer-events-none">
      {orbs.includes('maroon') && (
        <div className="ambient-orb-maroon top-[-80px] left-[-80px]" />
      )}
      {orbs.includes('gold') && (
        <div className="ambient-orb-gold top-[25%] right-[-100px]" />
      )}
      {orbs.includes('navy') && (
        <div className="ambient-orb-navy bottom-[-120px] left-[30%]" />
      )}
    </div>
  );
}

/* ── 2. Glassmorphic Card Container ────────────────────────────────────── */
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'maroon' | 'holographic';
  hoverEffect?: boolean;
  className?: string;
  glowBorder?: boolean;
}

export function GlassCard({
  children,
  variant = 'light',
  hoverEffect = true,
  className = '',
  glowBorder = false,
  ...props
}: GlassCardProps) {
  const variantClass = {
    light: 'glass-panel',
    dark: 'glass-panel-dark',
    maroon: 'glass-panel-maroon',
    holographic: 'holographic-glass-card',
  }[variant];

  const hoverClass = hoverEffect && variant === 'light' ? 'glass-panel-hover' : '';
  const glowClass = glowBorder ? 'border-[rgba(239,201,136,0.6)] shadow-[0_0_20px_rgba(239,201,136,0.18)]' : '';

  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden ${variantClass} ${hoverClass} ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── 3. Ultra-Modern Glassmorphism Button ──────────────────────────────── */
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'maroon' | 'navy' | 'gold' | 'frost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  href?: string;
  target?: string;
  glow?: boolean;
}

export function GlassButton({
  variant = 'maroon',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  children,
  href,
  target,
  glow = false,
  className = '',
  ...props
}: GlassButtonProps) {
  const variantClasses = {
    maroon: 'glass-btn-maroon',
    navy: 'glass-btn-navy',
    gold: 'glass-btn-gold',
    frost: 'glass-btn-frost',
  }[variant];

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 rounded-2xl gap-2.5',
  }[size];

  const glowClass = glow ? 'shadow-[0_0_20px_rgba(239,201,136,0.35)]' : '';

  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />}
      <span className="font-semibold tracking-wide whitespace-nowrap">{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        className={`glass-btn group ${variantClasses} ${sizeClasses} ${glowClass} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={`glass-btn group ${variantClasses} ${sizeClasses} ${glowClass} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}

/* ── 4. High-Impact Glass KPI Metric Widget ────────────────────────────── */
interface GlassMetricWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badgeText?: string;
  onClick?: () => void;
  className?: string;
}

export function GlassMetricWidget({
  title,
  value,
  subtitle,
  trend,
  trendPositive = true,
  icon: Icon,
  iconColor = 'text-[#89190E]',
  iconBg = 'bg-[#FFF3DD]',
  badgeText,
  onClick,
  className = '',
}: GlassMetricWidgetProps) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between group cursor-pointer transition-all relative overflow-hidden ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8C716C]">
          {title}
        </span>
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Metric Value */}
      <div className="my-1">
        <div className="font-serif text-2xl sm:text-3xl font-extrabold text-[#071B37] tracking-tight group-hover:text-[#89190E] transition-colors">
          {value}
        </div>
        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-bold mt-1 ${
              trendPositive ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${!trendPositive ? 'rotate-180' : ''}`} />
            <span>{trend}</span>
          </div>
        )}
      </div>

      {/* Subtitle / Footer */}
      {(subtitle || badgeText) && (
        <div className="mt-3 pt-2.5 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#58413D]">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {badgeText && (
            <span className="glass-badge glass-badge-gold text-[10px] shrink-0">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 5. Circular Conic Progress Ring Widget ─────────────────────────────── */
interface GlassProgressRingWidgetProps {
  title: string;
  percentage: number;
  label: string;
  subtitle?: string;
  color?: string;
  icon?: LucideIcon;
  badge?: string;
}

export function GlassProgressRingWidget({
  title,
  percentage,
  label,
  subtitle,
  color = '#89190E',
  icon: Icon,
  badge,
}: GlassProgressRingWidgetProps) {
  const safePercent = Math.min(100, Math.max(0, percentage));

  return (
    <div className="glass-panel rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C716C]">
            {title}
          </span>
          {badge && (
            <span className="glass-badge glass-badge-emerald text-[9px]">
              {badge}
            </span>
          )}
        </div>
        <div className="font-serif text-2xl font-bold text-[#071B37]">
          {label}
        </div>
        {subtitle && (
          <p className="text-xs text-[#58413D]">{subtitle}</p>
        )}
      </div>

      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
        <div
          className="w-full h-full rounded-full transition-all duration-700"
          style={{
            background: `conic-gradient(${color} ${safePercent * 3.6}deg, rgba(232, 220, 203, 0.45) ${safePercent * 3.6}deg)`,
          }}
        />
        <div className="absolute inset-2.5 rounded-full bg-white/95 backdrop-blur-md flex flex-col items-center justify-center shadow-inner">
          {Icon ? (
            <Icon className="w-4 h-4 text-[#89190E]" />
          ) : (
            <span className="text-xs font-bold text-[#071B37]">{safePercent}%</span>
          )}
          <span className="text-[9px] font-semibold text-[#8C716C]">Score</span>
        </div>
      </div>
    </div>
  );
}

/* ── 6. Live Activity & System Health Ticker ────────────────────────────── */
interface ActivityItem {
  id: string;
  time: string;
  title: string;
  user?: string;
  badge?: string;
  badgeType?: 'emerald' | 'gold' | 'maroon';
}

export function GlassActivityTicker({
  heading = 'Live Institute Telemetry',
  items,
}: {
  heading?: string;
  items: ActivityItem[];
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-black/[0.05] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="pulse-glow-dot bg-emerald-500" />
          <h4 className="font-serif font-bold text-xs text-[#071B37] tracking-wide uppercase">
            {heading}
          </h4>
        </div>
        <span className="glass-badge glass-badge-emerald text-[9px]">
          REAL-TIME DISK SYNC
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/40 hover:bg-white/80 border border-white/60 transition-all text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] text-[#8C716C] shrink-0">
                {item.time}
              </span>
              <span className="font-medium text-[#071B37] truncate">
                {item.title}
              </span>
              {item.user && (
                <span className="text-[11px] text-[#58413D] hidden sm:inline">
                  • {item.user}
                </span>
              )}
            </div>

            {item.badge && (
              <span
                className={`glass-badge text-[10px] shrink-0 ${
                  item.badgeType === 'maroon'
                    ? 'glass-badge-maroon'
                    : item.badgeType === 'emerald'
                    ? 'glass-badge-emerald'
                    : 'glass-badge-gold'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

