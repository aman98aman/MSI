'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  danger?: boolean;
}

export interface GlassDropdownProps {
  label?: string;
  options: DropdownOption[];
  onSelect: (id: string) => void;
  selectedId?: string;
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function GlassDropdown({
  label = 'Select',
  options,
  onSelect,
  selectedId,
  trigger,
  align = 'right',
  className = '',
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === selectedId);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="inline-flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-100 shadow-sm hover:shadow active:scale-95 transition-all"
        >
          <span>{selectedOption ? selectedOption.label : label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-52 rounded-2xl bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-slideDown`}
        >
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onSelect(opt.id);
                setIsOpen(false);
              }}
              type="button"
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                opt.danger
                  ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : selectedId === opt.id
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                {opt.icon && <span className="w-4 h-4 shrink-0">{opt.icon}</span>}
                <span>{opt.label}</span>
              </div>
              {opt.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

