'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { StudentProfile } from './data/studentMockData';

export type StudentModuleTab =
  | 'dashboard'
  | 'profile'
  | 'learning'
  | 'attendance'
  | 'tests'
  | 'fees';

interface StudentSidebarProps {
  activeTab: StudentModuleTab;
  onSelectTab: (tab: StudentModuleTab) => void;
  student: StudentProfile;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function StudentSidebar({
  activeTab,
  onSelectTab,
  student,
  isOpenMobile,
  onCloseMobile,
}: StudentSidebarProps) {
  const navTabs: {
    id: StudentModuleTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeType?: 'blue' | 'green' | 'red';
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Active courses & overview',
      icon: LayoutDashboard,
    },
    {
      id: 'profile',
      label: 'Profile',
      description: 'Credentials & personal info',
      icon: UserCheck,
    },
    {
      id: 'learning',
      label: 'Learning Hub',
      description: 'Videos, notes & PYQs',
      icon: BookOpen,
      badge: '5 New',
      badgeType: 'blue',
    },
    {
      id: 'attendance',
      label: 'Attendance',
      description: 'Class logs & percentage',
      icon: CalendarCheck,
      badge: '84.6%',
      badgeType: 'green',
    },
    {
      id: 'tests',
      label: 'Tests & Mock',
      description: 'Live timed simulations',
      icon: Award,
      badge: 'Live',
      badgeType: 'red',
    },
    {
      id: 'fees',
      label: 'Fees & Dues',
      description: 'Receipts & payment history',
      icon: CreditCard,
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5">
      {/* Navigation Items */}
      <div>
        <div className="flex items-center justify-between px-3 py-2 mb-3">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              Academic Modules
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">MSI Student Hub</p>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1.5">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 text-left group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/80 dark:hover:border-white/5'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block text-xs sm:text-sm font-bold truncate leading-tight ${
                        isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`block text-[10px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeType === 'red'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse'
                        : item.badgeType === 'green'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Course Entitlement Badge */}
      <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 space-y-3">
        <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Active Enrollment</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Course validity secured until <strong className="text-indigo-600 dark:text-indigo-400">{student.validUntil}</strong>
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Entitlement: Unlocked</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified
            </span>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-400">
          Need academic help?{' '}
          <Link href="/contact" className="underline font-semibold text-indigo-600 dark:text-indigo-400">
            Contact Faculty Cell
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 glass-sidebar min-h-[calc(100vh-65px)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
          />
          <div className="relative w-72 max-w-[85%] bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl h-full shadow-2xl z-10 flex flex-col border-r border-slate-200 dark:border-white/10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
