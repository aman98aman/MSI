'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  LogOut,
  Globe,
  ChevronDown,
  Menu,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { TeacherProfile } from './data/teacherMockData';
import ThemeToggle from '@/components/glass/ThemeToggle';

interface TeacherHeaderProps {
  teacher: TeacherProfile;
  allTeachers: TeacherProfile[];
  onSwitchTeacher: (teacherId: string) => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export default function TeacherHeader({
  teacher,
  allTeachers,
  onSwitchTeacher,
  onLogout,
  onToggleSidebar,
}: TeacherHeaderProps) {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="sticky top-0 z-30 glass-nav px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300">
      {/* Left: Mobile trigger & Portal Brand */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/teacher/dashboard" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-200/60 dark:border-white/10 shadow-sm flex-shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/images/msi-crest.png"
              alt="MSI Official Seal"
              fill
              sizes="44px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-black text-sm sm:text-lg text-slate-900 dark:text-white tracking-tight leading-none truncate block">
                MSI Faculty Portal
              </span>
              <span
                className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex-shrink-0 border ${
                  teacher.stream === 'Law'
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}
              >
                {teacher.stream} Discipline
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tracking-wide mt-0.5 font-medium hidden sm:block truncate">
              {teacher.department}
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Switch Stream, Theme Toggle, Notifications, User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {/* Switch Faculty Demonstration Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-[11px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 transition-all shadow-xs"
            title="Demonstrate Faculty Stream Data Isolation Rule"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden md:inline">Stream:</span>
            <span className="underline">{teacher.stream}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {showSwitchMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-slideDown">
              <div className="px-2 py-1.5 text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 border-b border-slate-200/60 dark:border-white/5">
                Role-Based Stream Isolation Test
              </div>
              <div className="space-y-1 mt-2">
                {allTeachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSwitchTeacher(t.id);
                      setShowSwitchMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      t.id === teacher.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-500/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{t.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.stream} • {t.title}</p>
                    </div>
                    {t.id === teacher.id && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Return to Public Website */}
        <Link
          href="/"
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md transition-colors"
          title="Return to Main Institute Website"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Main Site</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl p-4 z-50 animate-slideDown">
              <span className="text-xs font-bold text-slate-900 dark:text-white block pb-2 border-b border-slate-200/60 dark:border-white/5">
                Faculty Announcements
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                All scheduled batch lectures and syllabus targets are synced with MongoDB cloud database.
              </p>
            </div>
          )}
        </div>

        {/* Faculty Profile Quick Badge */}
        <div className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-left">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0">
            <Image
              src={teacher.avatarUrl || '/images/avatars/avatar-2.webp'}
              alt={teacher.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {teacher.name}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
              {teacher.title}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-1"
            title="Sign Out Faculty Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
