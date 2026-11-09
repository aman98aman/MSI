'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Menu,
  Video,
  Radio,
  Sparkles,
} from 'lucide-react';
import { StudentProfile, StudentNotification } from './data/studentMockData';
import ThemeToggle from '@/components/glass/ThemeToggle';

interface StudentHeaderProps {
  student: StudentProfile;
  notifications: StudentNotification[];
  onOpenNotifications?: () => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  onSwitchStudent?: (studentId: string) => void;
  onOpenProfile?: () => void;
}

export default function StudentHeader({
  student,
  notifications,
  onLogout,
  onToggleSidebar,
  onOpenProfile,
}: StudentHeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeLiveStream, setActiveLiveStream] = useState<{
    isLive: boolean;
    courseId?: string;
    courseTitle?: string;
    teacherName?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeData = localStorage.getItem('msi_active_live_stream');
      if (activeData) {
        try {
          const parsed = JSON.parse(activeData);
          if (parsed.isLive) setActiveLiveStream(parsed);
        } catch {}
      }
    }

    const checkServer = async () => {
      try {
        const res = await fetch('/api/live-stream');
        if (!res.ok) return;
        const data = await res.json();
        if (data.isLive) {
          setActiveLiveStream({
            isLive: true,
            courseId: data.courseId,
            courseTitle: data.streamTitle,
            teacherName: data.teacherName,
          });
        } else {
          setActiveLiveStream(null);
        }
      } catch {}
    };

    checkServer();
    const interval = setInterval(checkServer, 20000);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('msi_live_stream_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'STREAM_STARTED') {
          setActiveLiveStream(event.data);
        } else if (event.data?.type === 'STREAM_ENDED') {
          setActiveLiveStream(null);
        }
      };
    } catch {}

    return () => {
      bc?.close();
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length + (activeLiveStream?.isLive ? 1 : 0);

  return (
    <header className="sticky top-0 z-30 glass-nav px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all duration-300">
      {/* Left: Mobile trigger & Portal Brand */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 transition-colors"
          aria-label="Toggle Sidebar Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/student/dashboard" className="flex items-center space-x-3 group">
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
                MSI Student LMS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tracking-wide mt-0.5 font-medium hidden sm:block truncate">
              {student.batch} • {student.stream}
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Live Pill, Theme Toggle, Public Website, Notifications, Profile Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {/* Live Broadcast Header Pill */}
        {activeLiveStream?.isLive && (
          <Link
            href={`/live-stream?title=${encodeURIComponent(activeLiveStream.courseTitle || 'Live Lecture')}&role=student`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold shadow-md shadow-rose-500/25 animate-pulse transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Class Ongoing →</span>
            <span className="sm:hidden">Live →</span>
          </Link>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Return to Public Website */}
        <Link
          href="/"
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md transition-colors"
          title="Return to Main Institute Website"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Main Website</span>
        </Link>

        {/* Notifications Bell with Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-slate-700 dark:text-slate-200 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-slideDown">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Circulars & Notices</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                    {notifications.length + (activeLiveStream?.isLive ? 1 : 0)} Total
                  </span>
                </div>
                <span className="text-xs text-slate-400">Official Broadcasts</span>
              </div>

              {/* Real-time Live Class Alert inside Tray */}
              {activeLiveStream?.isLive && (
                <div className="p-3 my-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-500/30 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>LIVE NOW</span>
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Broadcasting</span>
                  </div>
                  <h5 className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {activeLiveStream.courseTitle || 'Live Class Started'}
                  </h5>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    Faculty {activeLiveStream.teacherName || 'Dr. Ekta Gahlawat'} is live streaming.
                  </p>
                  <Link
                    href={`/live-stream?title=${encodeURIComponent(activeLiveStream.courseTitle || 'Live Lecture')}&role=student`}
                    onClick={() => setShowNotifs(false)}
                    className="mt-1 inline-flex items-center space-x-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    <Video className="w-3 h-3" />
                    <span>Join Live Lecture Room →</span>
                  </Link>
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-72 overflow-y-auto mt-2">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                    <div className="flex items-start justify-between">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{n.title}</h5>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{n.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{n.message}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-white/5 text-center">
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Close Circulars Tray
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Profile Quick Pill */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-indigo-400 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {student.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 block leading-tight">
                {student.enrollmentNo}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-xs bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-2xl p-3 z-50 animate-slideDown space-y-2">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-white/5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{student.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{student.email}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">Roll No: {student.rollNo}</p>
              </div>

              <div className="pt-1 space-y-1">
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>View & Edit Profile</span>
                  </button>
                )}

                <Link
                  href="/"
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Public Institute Website</span>
                </Link>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
