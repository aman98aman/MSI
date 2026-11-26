'use client';

import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Clock, Award, ShieldCheck } from 'lucide-react';

interface LiveMockBreakingTickerProps {
  onOpenRegisterModal: () => void;
}

export default function LiveMockBreakingTicker({
  onOpenRegisterModal,
}: LiveMockBreakingTickerProps) {
  const breakingItems = [
    {
      tag: 'FREE MOCK TEST 2027',
      text: 'Register for Free Mock Test — Official Online CBT & Answer Key Active Now!',
      btnText: 'Register Free',
    },
    {
      tag: 'CLAT & JUDICIARY 2027',
      text: 'New Batch 2027 Admissions Open — Full-Length Mocks & Bare Act Deconstructions',
      btnText: 'Take Test',
    },
    {
      tag: 'ALL-INDIA RANKING',
      text: 'Immediate Scorecard, Negative Marking Simulation & Solved Question Papers',
      btnText: 'Claim Seat',
    },
  ];

  return (
    <aside
      aria-label="Live Breaking News Mock Test"
      className="relative z-30 w-full bg-gradient-to-r from-[#071324] via-[#0E1E38] to-[#89190E] border-y border-[#EFC988]/40 text-white shadow-md overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto flex items-stretch min-h-[42px] sm:min-h-[46px]">
        {/* Left: Breaking News Live Badge */}
        <div className="flex items-center gap-2 px-3 sm:px-5 bg-gradient-to-r from-[#89190E] to-[#b02213] text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-widest shrink-0 border-r border-[#EFC988]/50 shadow-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-90"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="font-sans font-black flex items-center gap-1 text-[#FFF9EF]">
            LIVE BREAKING
          </span>
        </div>

        {/* Center: Running Marquee Content Boxes */}
        <div className="flex-1 overflow-hidden relative flex items-center py-1">
          <div className="flex items-center gap-8 whitespace-nowrap animate-ticker hover:[animation-play-state:paused]">
            {[...breakingItems, ...breakingItems, ...breakingItems].map((item, idx) => (
              <div
                key={idx}
                onClick={onOpenRegisterModal}
                className="inline-flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
              >
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold tracking-wider uppercase">
                  {item.tag}
                </span>
                <span className="text-xs sm:text-[13px] font-medium text-slate-100 group-hover:text-amber-200 transition-colors">
                  {item.text}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/15 group-hover:bg-[#89190E] px-2.5 py-0.5 rounded-full border border-white/20 transition-all">
                  <span>{item.btnText}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-[#EFC988]/60 text-xs">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Direct 1-Click Action Pill */}
        <div className="hidden md:flex items-center px-4 bg-white/10 shrink-0 border-l border-white/10">
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="px-3 py-1 rounded-full bg-[#EFC988] hover:bg-white text-[#10233F] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#89190E]" />
            <span>Register for Free Mock</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
