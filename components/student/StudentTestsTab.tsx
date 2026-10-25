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
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#10233F] to-[#1c355e] text-white shadow-xl hud-bracket relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#EFC988]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EFC988] animate-pulse-beacon" />
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
              className="px-5 py-3 rounded-2xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-[#89190E]/40 btn-chamfered active:scale-98 transition-all"
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === type
                ? 'bg-[#89190E] text-white shadow-xs'
                : 'bg-white border border-[#E8DCCB] text-[#526174] hover:text-[#10233F]'
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
          <div
            key={test.id}
            className={`p-6 rounded-3xl border bg-white flex flex-col justify-between transition-all shadow-xs ${
              test.isLocked
                ? 'border-neutral-200 opacity-75'
                : test.status === 'Available'
                ? 'border-[#89190E] ring-1 ring-[#89190E]/20'
                : 'border-[#E8DCCB] hover:border-[#10233F]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    test.type === 'Timed'
                      ? 'bg-[#89190E] text-white'
                      : test.type === 'Formal'
                      ? 'bg-[#10233F] text-white'
                      : 'bg-[#FFF3DD] text-[#89190E]'
                  }`}
                >
                  {test.type} Test
                </span>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    test.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                      : test.status === 'Completed'
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  ● {test.status}
                </span>
              </div>

              <h3 className="font-serif text-base sm:text-lg font-bold text-[#10233F] mt-3 leading-snug">
                {test.title}
              </h3>
              <p className="text-xs text-[#526174] mt-1">{test.subject}</p>

              {/* Assessment Meta */}
              <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB] text-center text-xs">
                <div>
                  <span className="text-[10px] text-[#526174] uppercase block">Duration</span>
                  <span className="font-mono font-bold text-[#10233F]">{test.durationMinutes} Mins</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#526174] uppercase block">Questions</span>
                  <span className="font-mono font-bold text-[#10233F]">{test.totalQuestions} Qs</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#526174] uppercase block">Total Marks</span>
                  <span className="font-mono font-bold text-[#89190E]">{test.totalMarks}</span>
                </div>
              </div>

              {/* Results Breakdown if Completed */}
              {test.status === 'Completed' && test.scoredMarks !== undefined && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Score Obtained:</span>
                    <span className="font-serif font-bold text-sm text-emerald-900">
                      {test.scoredMarks} / {test.totalMarks} Marks
                    </span>
                  </div>
                  {test.percentile && (
                    <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-800">
                      <span>Percentile: {test.percentile}%</span>
                      <span>Rank: {test.rank}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Trigger */}
            <div className="mt-5 pt-4 border-t border-[#E8DCCB] flex items-center justify-between">
              <span className="text-xs text-[#526174] flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{test.scheduledDate}</span>
              </span>

              {test.isLocked ? (
                <span className="inline-flex items-center space-x-1 text-xs text-neutral-400 px-3 py-1.5 border border-dashed border-neutral-300 rounded-xl">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Entitlement Locked</span>
                </span>
              ) : test.status === 'Available' ? (
                <button
                  onClick={() => onStartTest(test)}
                  className="px-4 py-2 rounded-xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold transition-all shadow-md shadow-[#89190E]/20 flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Timed Test</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartTest(test)}
                  className="px-4 py-2 rounded-xl bg-[#FFF9EF] hover:bg-[#E8DCCB] text-[#10233F] border border-[#E8DCCB] text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Review Test Paper</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 4. Performance History Graph / Analytics Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DCCB]">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#89190E]" />
            <h3 className="font-serif text-lg font-bold text-[#10233F]">
              Longitudinal Performance History & Percentile Trends
            </h3>
          </div>
          <span className="text-xs text-[#526174] font-medium">Past 4 Major Assessments</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5">
          {[
            { exam: 'Mock Series #09', date: 'Jul 2025', score: 78, percentile: 86.4, color: 'bg-[#10233F]' },
            { exam: 'Unit Test (CPC)', date: 'Aug 2025', score: 88, percentile: 91.0, color: 'bg-[#10233F]' },
            { exam: 'Mid-Sem Exam V', date: 'Sep 2025', score: 86, percentile: 94.2, color: 'bg-[#89190E]' },
            { exam: 'Timed Drill #12', date: 'Sep 2025', score: 95, percentile: 97.5, color: 'bg-[#89190E]' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FFF9EF]/60 border border-[#E8DCCB] text-center flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-[#526174] uppercase">{item.date}</span>
                <h5 className="font-serif font-bold text-sm text-[#10233F] mt-1">{item.exam}</h5>
              </div>

              <div className="my-4">
                <span className="font-serif text-2xl font-bold text-[#89190E] block">{item.score}%</span>
                <span className="text-[11px] text-[#526174]">Percentile: {item.percentile}</span>
              </div>

              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#E8DCCB]">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
