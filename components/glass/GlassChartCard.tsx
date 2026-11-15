'use client';

import React, { useState } from 'react';
import GlassCard from './GlassCard';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface GlassChartCardProps {
  title: string;
  subtitle?: string;
  type?: 'area' | 'bar' | 'line';
  data: ChartDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  formatValue?: (val: number) => string;
  timeRanges?: string[];
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export default function GlassChartCard({
  title,
  subtitle,
  type = 'area',
  data,
  primaryLabel = 'Current Period',
  secondaryLabel,
  primaryColor = '#6366F1',
  secondaryColor = '#3B82F6',
  formatValue = (v) => v.toLocaleString(),
  timeRanges = ['7D', '30D', '90D', '1Y'],
  onTimeRangeChange,
  className = '',
}: GlassChartCardProps) {
  const [selectedRange, setSelectedRange] = useState(timeRanges[1] || timeRanges[0]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleRangeClick = (range: string) => {
    setSelectedRange(range);
    if (onTimeRangeChange) onTimeRangeChange(range);
  };

  // Compute SVG chart coordinates
  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 10);
  const minVal = 0;
  const rangeVal = maxVal - minVal;

  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 25;
  const paddingY = 20;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.value / rangeVal) * (chartHeight - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.length > 0 ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${chartHeight - paddingY} L ${points[0].x},${chartHeight - paddingY} Z`
      : '';

  return (
    <GlassCard variant="default" padding="lg" className={`relative overflow-hidden ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/5">
        <div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Time Range Pills */}
        {timeRanges && timeRanges.length > 0 && (
          <div className="inline-flex p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 shrink-0 self-start sm:self-auto">
            {timeRanges.map((range) => {
              const active = range === selectedRange;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => handleRangeClick(range)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend & Hover Info */}
      <div className="flex items-center justify-between pt-3 pb-1 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-slate-600 dark:text-slate-400 font-medium">{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span className="text-slate-600 dark:text-slate-400 font-medium">{secondaryLabel}</span>
            </div>
          )}
        </div>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="flex items-center gap-2 font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-500/30">
            <span>{data[hoveredIdx].label}:</span>
            <span>{formatValue(data[hoveredIdx].value)}</span>
          </div>
        )}
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full h-48 sm:h-56 mt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`chart-grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-slate-200/50 dark:text-slate-800/80"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight / 2}
            x2={chartWidth - paddingX}
            y2={chartHeight / 2}
            stroke="currentColor"
            className="text-slate-200/50 dark:text-slate-800/80"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="currentColor"
            className="text-slate-200/80 dark:text-slate-800"
          />

          {/* Area Fill */}
          {type === 'area' && (
            <path
              d={areaD}
              fill={`url(#chart-grad-${title.replace(/\s+/g, '')})`}
              className="transition-all duration-300"
            />
          )}

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Interactive Hover Dots */}
          {points.map((p, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 6 : 3.5}
                fill="#ffffff"
                stroke={primaryColor}
                strokeWidth={hoveredIdx === idx ? 3 : 2}
                className="transition-all duration-150"
              />
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-1 font-mono">
          {data.map((d, i) => (
            <span
              key={i}
              className={`transition-colors ${hoveredIdx === i ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

