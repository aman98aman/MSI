'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import GlassButton from './GlassButton';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
  showCloseButton?: boolean;
}

export default function GlassModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
}: GlassModalProps) {
  // Lock body scroll when open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Translucent Backdrop Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 dark:bg-slate-950/70 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
      />

      {/* Modal Card Surface */}
      <div
        className={`relative w-full ${maxWidthMap[maxWidth]} my-8 rounded-3xl bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.3)] text-slate-900 dark:text-slate-100 z-10 overflow-hidden transform transition-all duration-300 animate-slideUp`}
      >
        {/* Soft Ambient Header Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 dark:border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-150 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[calc(85vh-140px)] overflow-y-auto relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

