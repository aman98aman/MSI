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

export interface DayActivity {
  dayIndex: number; // 0 to 29 (0 = 29 days ago, 29 = today)
  date: string; // e.g. "28 Sep"
  fullDate: string; // e.g. "Sun, 28 Sep 2025"
  dayOfWeek: string; // "Sun", "Mon", etc.
  dayNumber: number; // 1-31
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
  // Generate realistic last 30 days data
  const daysData: DayActivity[] = useMemo(() => {
    const list: DayActivity[] = [];
    const today = new Date();

    // Specific deterministic pattern for 30 days: ~23-25 active days
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

      // Activity counts
      let activityCount = 0;
      let studyMinutes = 0;
      const items: DayActivity['items'] = [];

      if (isActive) {
        // Deterministic count based on day
        const seed = (dayIdx * 7) % 4;
        activityCount = seed + 1; // 1 to 4 activities
        studyMinutes = 45 + seed * 35; // 45 to 150 mins

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
            title: 'Mains Judgment Writing Draft',
            detail: 'Submitted to Faculty for evaluation',
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

  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(() => daysData[daysData.length - 1] || null);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  // Active metrics calculation
  const totalActiveDays = daysData.filter((d) => d.isActive).length;
  const activeRate = Math.round((totalActiveDays / 30) * 100);
  const totalHours = Math.round(daysData.reduce((acc, d) => acc + d.studyMinutes, 0) / 60);
  const totalTasks = daysData.reduce((acc, d) => acc + d.activityCount, 0);

  // Compute current streak (counting consecutive active days from today backwards)
  let currentStreak = 0;
  for (let i = daysData.length - 1; i >= 0; i--) {
    if (daysData[i].isActive) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Compute max streak in the 30 days
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

  // Intensity color generator for active green cells (LeetCode style)
  const getCellBgClass = (day: DayActivity) => {
    if (!day.isActive) {
      return 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-400';
    }
    if (day.activityCount >= 4) {
      return 'bg-[#15803d] hover:bg-[#166534] border-[#15803d] text-white shadow-xs shadow-emerald-700/20'; // deep green
    }
    if (day.activityCount >= 2) {
      return 'bg-[#22c55e] hover:bg-[#16a34a] border-[#22c55e] text-white shadow-xs shadow-emerald-500/20'; // bright vibrant green
    }
    return 'bg-[#86efac] hover:bg-[#4ade80] border-[#86efac] text-[#14532d]'; // light green
  };

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-white border-2 border-[#E8DCCB] shadow-sm space-y-6">
      {/* 1. Header with LeetCode Streak Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8DCCB]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Activity className="w-5 h-5" />
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#10233F]">
              Last 30 Days Study Activity
            </h3>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
              LeetCode Streak
            </span>
          </div>
          <p className="text-xs text-[#526174] mt-1">
            Visualizing daily learning consistency, live classes, mock tests & bare act revisions over the last 30 days.
          </p>
        </div>

        {/* Top Badges: Streak & Consistency */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs">
            <Flame className="w-4 h-4 text-amber-600 animate-bounce" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block leading-none">
                Current Streak
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-950">
                {currentStreak} Days 🔥
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-2xs">
            <Zap className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block leading-none">
                30-Day Rate
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-900">
                {totalActiveDays}/30 ({activeRate}%)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 shadow-2xs">
            <Award className="w-4 h-4 text-purple-600" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 block leading-none">
                Max Record
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-purple-950">
                {maxStreak} Days ⚡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Heatmap Grid (30 Day Blocks) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#526174] gap-2">
          <span className="font-semibold text-[#10233F]">
            Monthly Grid • Select any square to view day log:
          </span>
          {/* Color Legend */}
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-gray-500">Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100 border border-gray-300" title="0 Activities (Gray)" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#86efac] border border-[#86efac]" title="1 Activity" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#22c55e] border border-[#22c55e]" title="2-3 Activities" />
            <div className="w-3.5 h-3.5 rounded-sm bg-[#15803d] border border-[#15803d]" title="4+ Activities (Green)" />
            <span className="text-emerald-800 font-bold">More (Active)</span>
          </div>
        </div>

        {/* 30 Squares Container */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9EF]/60 border border-[#E8DCCB] overflow-x-auto">
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
                  className={`relative group h-12 sm:h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${getCellBgClass(
                    day
                  )} ${
                    isSelected
                      ? 'ring-2 ring-[#89190E] ring-offset-2 scale-105 z-10'
                      : 'hover:scale-108 hover:z-10'
                  }`}
                  aria-label={`${day.fullDate}: ${day.isActive ? `${day.activityCount} activities` : 'Inactive'}`}
                >
                  {/* Today Pill */}
                  {isToday && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#89190E] ring-2 ring-white animate-pulse" />
                  )}

                  {/* Day Date */}
                  <span className="text-[10px] font-mono font-bold leading-none">
                    {day.date.split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase font-bold opacity-80 leading-tight mt-0.5">
                    {day.dayOfWeek}
                  </span>

                  {/* Status Indicator Icon */}
                  {day.isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-2xs" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Interactive Detail Card for Hovered or Selected Day */}
      {activeDayForDisplay && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DCCB] shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCB]/60">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-4 h-4 rounded-md ${
                  activeDayForDisplay.isActive ? 'bg-[#22c55e]' : 'bg-gray-200'
                }`}
              />
              <div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#10233F]">
                  {activeDayForDisplay.fullDate}
                  {activeDayForDisplay.dayIndex === 29 && (
                    <span className="ml-2 text-[10px] font-mono uppercase bg-[#89190E] text-white px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h4>
                <p className="text-xs text-[#526174]">
                  {activeDayForDisplay.isActive ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Active Day — {activeDayForDisplay.activityCount} actions completed ({activeDayForDisplay.studyMinutes} mins study time)
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      ✗ Inactive Day — No recorded submissions or lectures on this date
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#FFF9EF] border border-[#E8DCCB] text-[#89190E]">
                {activeDayForDisplay.isActive ? 'Green Status' : 'Gray Status'}
              </span>
            </div>
          </div>

          {/* Action Items List for This Day */}
          {activeDayForDisplay.isActive ? (
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeDayForDisplay.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FFF9EF]/60 border border-[#E8DCCB] flex items-start space-x-2.5"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 flex-shrink-0 mt-0.5">
                    {item.type === 'lecture' && <BookOpen className="w-3.5 h-3.5" />}
                    {item.type === 'test' && <Award className="w-3.5 h-3.5" />}
                    {item.type === 'reading' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.type === 'assignment' && <Sparkles className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#10233F] leading-snug">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-[#526174] mt-0.5 leading-tight">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3.5 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                No activity was logged on {activeDayForDisplay.date}. Regular daily practice keeps your PCS J / CLAT preparation on track.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Quick Monthly Consistency Summary Footer */}
      <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#E8DCCB]/60 text-center">
        <div className="p-2.5 rounded-xl bg-[#FFF9EF]">
          <span className="text-[10px] font-mono uppercase text-[#526174] block">Active Days</span>
          <span className="font-serif text-lg font-bold text-emerald-700 block">
            {totalActiveDays} <span className="text-xs text-gray-500 font-sans font-normal">/ 30</span>
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FFF9EF]">
          <span className="text-[10px] font-mono uppercase text-[#526174] block">Rest Days</span>
          <span className="font-serif text-lg font-bold text-gray-600 block">
            {30 - totalActiveDays} <span className="text-xs text-gray-500 font-sans font-normal">Gray</span>
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FFF9EF]">
          <span className="text-[10px] font-mono uppercase text-[#526174] block">Study Hours</span>
          <span className="font-serif text-lg font-bold text-[#10233F] block">
            {totalHours}h <span className="text-xs text-gray-500 font-sans font-normal">Logged</span>
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FFF9EF]">
          <span className="text-[10px] font-mono uppercase text-[#526174] block">Total Tasks</span>
          <span className="font-serif text-lg font-bold text-[#89190E] block">
            {totalTasks} <span className="text-xs text-gray-500 font-sans font-normal">Items</span>
          </span>
        </div>
      </div>
    </div>
  );
}
