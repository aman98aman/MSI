'use client';

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import GlassCard from '@/components/glass/GlassCard';

export interface DayActivity {
  dayIndex: number;
  date: string;
  fullDate: string;
  dayOfWeek: string;
  dayNumber: number;
  isActive: boolean;
  activityCount: number;
  studyMinutes: number;
  items: {
    type: 'lecture' | 'test' | 'reading' | 'assignment';
    title: string;
    detail: string;
  }[];
}

interface StudentActivityHeatmapProps {
  studentName?: string;
  onNavigateTab?: (tab: any) => void;
}

export default function StudentActivityHeatmap({
  studentName = 'Student',
  onNavigateTab,
}: StudentActivityHeatmapProps) {
  const daysData: DayActivity[] = useMemo(() => {
    const list: DayActivity[] = [];
    const today = new Date();

    const activeDayIndices = new Set([
      0, 1, 2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 19, 21, 22, 24, 25, 26, 27, 28, 29,
    ]);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const dayIdx = 29 - i;
      const isActive = activeDayIndices.has(dayIdx);

      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const fullDateStr = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const dayOfWeekStr = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNumber = d.getDate();

      let activityCount = 0;
      let studyMinutes = 0;
      const items: DayActivity['items'] = [];

      if (isActive) {
        const seed = (dayIdx * 7) % 4;
        activityCount = seed + 1;
        studyMinutes = 45 + seed * 35;

        if (seed >= 0) {
          items.push({
            type: 'lecture',
            title: 'CrPC Chapter IV: Powers of Courts',
            detail: 'Attended 55-min video masterclass & made notes',
          });
        }
        if (seed >= 1) {
          items.push({
            type: 'test',
            title: 'Daily Prelims Booster #42',
            detail: 'Scored 18/20 (90%) • Judicial Services Mock',
          });
        }
        if (seed >= 2) {
          items.push({
            type: 'reading',
            title: 'Indian Evidence Act, 1872',
            detail: 'Revising Sections 24–30 Confessions',
          });
        }
        if (seed >= 3) {
          items.push({
            type: 'assignment',
            title: 'Constitutional Law Drafting Task',
            detail: 'Drafted writ petition under Article 32',
          });
        }
      }

      list.push({
        dayIndex: dayIdx,
        date: dateStr,
        fullDate: fullDateStr,
        dayOfWeek: dayOfWeekStr,
        dayNumber,
        isActive,
        activityCount,
        studyMinutes,
        items,
      });
    }

    return list;
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  const totalActiveDays = daysData.filter((d) => d.isActive).length;
  const activeRate = Math.round((totalActiveDays / 30) * 100);
  const totalMinutes = daysData.reduce((acc, d) => acc + d.studyMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalTasks = daysData.reduce((acc, d) => acc + d.activityCount, 0);

  let currentStreak = 0;
  for (let i = daysData.length - 1; i >= 0; i--) {
    if (daysData[i].isActive) {
      currentStreak++;
    } else {
      break;
    }
  }

  let maxStreak = 0;
  let tempStreak = 0;
  daysData.forEach((d) => {
    if (d.isActive) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  const activeDayForDisplay = hoveredDay || selectedDay || daysData[daysData.length - 1];

  const getCellBgClass = (day: DayActivity) => {
    if (!day.isActive) {
      return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700';
    }
    if (day.activityCount >= 4) {
      return 'bg-emerald-600 dark:bg-emerald-500 border-emerald-500 text-white shadow-xs shadow-emerald-500/30 hover:bg-emerald-700';
    }
    if (day.activityCount >= 2) {
      return 'bg-emerald-500 dark:bg-emerald-400 border-emerald-400 text-white shadow-xs shadow-emerald-500/20 hover:bg-emerald-600';
    }
    return 'bg-emerald-200 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-300';
  };

  return (
    <GlassCard variant="default" padding="lg" className="space-y-6">
      {/* 1. Header with LeetCode Streak Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-white/5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Last 30 Days Study Activity
            </h3>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Learning Streak
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualizing daily learning consistency, live classes, mock tests & bare act revisions over the last 30 days.
          </p>
        </div>

        {/* Top Badges: Streak & Consistency */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block leading-none">
                Current Streak
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {currentStreak} Days 🔥
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-4 h-4 text-emerald-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block leading-none">
                30-Day Rate
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {totalActiveDays}/30 ({activeRate}%)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Award className="w-4 h-4 text-indigo-500" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block leading-none">
                Max Record
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {maxStreak} Days ⚡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Heatmap Grid (30 Day Blocks) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">
            Monthly Grid • Select any square to view day log:
          </span>
          <div className="flex items-center space-x-2 text-[11px]">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10" title="0 Activities" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-900 border border-emerald-300 dark:border-emerald-700" title="1 Activity" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 dark:bg-emerald-400 border border-emerald-400" title="2-3 Activities" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 border border-emerald-500" title="4+ Activities" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">More</span>
          </div>
        </div>

        {/* 30 Squares Container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/80 dark:border-white/5 overflow-x-auto">
          <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-2 sm:gap-2.5 min-w-[320px]">
            {daysData.map((day) => {
              const isSelected = selectedDay?.dayIndex === day.dayIndex;
              const isToday = day.dayIndex === 29;

              return (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`relative group h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${getCellBgClass(
                    day
                  )} ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10'
                      : 'hover:scale-105 hover:z-10'
                  }`}
                  aria-label={`${day.fullDate}: ${day.isActive ? `${day.activityCount} activities` : 'Inactive'}`}
                >
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                  )}

                  <span className="text-[10px] font-mono font-bold leading-none">
                    {day.date.split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase font-bold opacity-80 leading-tight mt-0.5">
                    {day.dayOfWeek}
                  </span>

                  {day.isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-xs" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Interactive Detail Card for Hovered or Selected Day */}
      {activeDayForDisplay && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/5">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-4 h-4 rounded-md ${
                  activeDayForDisplay.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {activeDayForDisplay.fullDate}
                  {activeDayForDisplay.dayIndex === 29 && (
                    <span className="ml-2 text-[10px] font-mono uppercase bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                      Today
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeDayForDisplay.isActive ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Active Day — {activeDayForDisplay.activityCount} actions completed ({activeDayForDisplay.studyMinutes} mins study time)
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      ✗ Rest Day — No recorded submissions or lectures on this date
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                {activeDayForDisplay.isActive ? 'Green Status' : 'Gray Status'}
              </span>
            </div>
          </div>

          {activeDayForDisplay.isActive ? (
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeDayForDisplay.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 flex items-start space-x-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 border border-emerald-500/20">
                    {item.type === 'lecture' && <BookOpen className="w-3.5 h-3.5" />}
                    {item.type === 'test' && <Award className="w-3.5 h-3.5" />}
                    {item.type === 'reading' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.type === 'assignment' && <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-white/5 text-center">
              <p className="text-xs text-slate-400">
                No activity was logged on {activeDayForDisplay.date}. Regular daily practice keeps your PCS J / CLAT preparation on track.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Quick Monthly Consistency Summary Footer */}
      <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/60 dark:border-white/5 text-center">
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Days</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
            {totalActiveDays} <span className="text-xs text-slate-400 font-normal">/ 30</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Rest Days</span>
          <span className="text-lg font-bold text-slate-600 dark:text-slate-300 block">
            {30 - totalActiveDays} <span className="text-xs text-slate-400 font-normal">Days</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Study Hours</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white block">
            {totalHours}h <span className="text-xs text-slate-400 font-normal">Logged</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Tasks</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 block">
            {totalTasks} <span className="text-xs text-slate-400 font-normal">Items</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
