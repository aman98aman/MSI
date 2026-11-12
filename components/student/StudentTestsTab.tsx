'use client';

import React, { useState } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  BarChart3,
  TrendingUp,
  Lock,
  Play,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { TestItem } from './data/studentMockData';
import GlassCard from '../glass/GlassCard';

interface StudentTestsTabProps {
  tests: TestItem[];
  onStartTest: (test: TestItem) => void;
}

export default function StudentTestsTab({
  tests,
  onStartTest,
}: StudentTestsTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'Timed' | 'Mock' | 'Formal'>('all');

  const filteredTests = tests.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Simulator Action */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#0E1A2E] via-[#162D50] to-[#6A1610] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#EFC988]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono tracking-widest text-[#EFC988] uppercase font-bold">
                Judicial Examination Diagnostic Center
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1.5">
              Tests, Formal Exams & Timed Speed Drills
            </h2>
            <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
              Standardized multiple-choice and mains simulation designed to emulate the Punjab Civil Services (Judicial) and All-India law entrance examination rigor.
            </p>
          </div>

          {/* Featured Timed Mock Card CTA */}
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                const timed = tests.find((t) => t.type === 'Timed' && t.status === 'Available');
                if (timed) onStartTest(timed);
              }}
              className="px-5 py-3 rounded-2xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-[#89190E]/40 active:scale-98 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#EFC988]" />
              <span>Launch Live Timed Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'Timed', 'Mock', 'Formal'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === type
                ? 'bg-linear-to-r from-[#89190E] to-[#B22222] text-white shadow-xs'
                : 'bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {type === 'all'
              ? 'All Assessments'
              : type === 'Timed'
              ? 'Timed Speed Tests'
              : type === 'Mock'
              ? 'Mock Drills'
              : 'Formal Institute Exams'}
          </button>
        ))}
      </div>

      {/* 3. Tests List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTests.map((test) => (
          <GlassCard
            key={test.id}
            variant="interactive"
            className={`p-6 flex flex-col justify-between transition-all ${
              test.isLocked
                ? 'opacity-70'
                : test.status === 'Available'
                ? 'ring-1 ring-[#89190E]/30 dark:ring-[#EFC988]/30'
                : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    test.type === 'Timed'
                      ? 'bg-[#89190E] text-white'
                      : test.type === 'Formal'
                      ? 'bg-gray-900 text-white dark:bg-white/20'
                      : 'bg-[#89190E]/10 dark:bg-[#89190E]/20 text-[#89190E] dark:text-[#EFC988]'
                  }`}
                >
                  {test.type} Test
                </span>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    test.status === 'Available'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse'
                      : test.status === 'Completed'
                      ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  ● {test.status}
                </span>
              </div>

              <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-3 leading-snug">
                {test.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{test.subject}</p>

              {/* Assessment Meta */}
              <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Duration</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{test.durationMinutes} Mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Questions</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{test.totalQuestions} Qs</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase block">Total Marks</span>
                  <span className="font-mono font-bold text-[#89190E] dark:text-[#EFC988]">{test.totalMarks}</span>
                </div>
              </div>

              {/* Results Breakdown if Completed */}
              {test.status === 'Completed' && test.scoredMarks !== undefined && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300">Score Obtained:</span>
                    <span className="font-serif font-bold text-sm text-emerald-800 dark:text-emerald-300">
                      {test.scoredMarks} / {test.totalMarks} Marks
                    </span>
                  </div>
                  {test.percentile && (
                    <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <span>Percentile: {test.percentile}%</span>
                      <span>Rank: {test.rank}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Trigger */}
            <div className="mt-5 pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{test.scheduledDate}</span>
              </span>

              {test.isLocked ? (
                <span className="inline-flex items-center space-x-1 text-xs text-gray-400 px-3 py-1.5 border border-dashed border-gray-300 dark:border-white/20 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entitlement Locked</span>
                </span>
              ) : test.status === 'Available' ? (
                <button
                  onClick={() => onStartTest(test)}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#89190E]/20 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Timed Test</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartTest(test)}
                  className="px-4 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Review Test Paper</span>
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 4. Performance History Graph / Analytics Card */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              Longitudinal Performance History & Percentile Trends
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Past 4 Major Assessments</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
          {[
            { exam: 'Mock Series #09', date: 'Jul 2025', score: 78, percentile: 86.4, color: 'bg-indigo-600' },
            { exam: 'Unit Test (CPC)', date: 'Aug 2025', score: 88, percentile: 91.0, color: 'bg-indigo-600' },
            { exam: 'Mid-Sem Exam V', date: 'Sep 2025', score: 86, percentile: 94.2, color: 'bg-[#89190E]' },
            { exam: 'Timed Drill #12', date: 'Sep 2025', score: 95, percentile: 97.5, color: 'bg-[#89190E]' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-center flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase">{item.date}</span>
                <h5 className="font-serif font-bold text-sm text-gray-900 dark:text-white mt-1">{item.exam}</h5>
              </div>

              <div className="my-4">
                <span className="font-serif text-2xl font-bold text-[#89190E] dark:text-[#EFC988] block">{item.score}%</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Percentile: {item.percentile}</span>
              </div>

              <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
