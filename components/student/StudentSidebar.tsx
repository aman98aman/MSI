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
    },
    {
      id: 'attendance',
      label: 'Attendance',
      description: 'Class logs & percentage',
      icon: CalendarCheck,
      badge: '84.6%',
    },
    {
      id: 'tests',
      label: 'Tests & Mock',
      description: 'Live timed simulations',
      icon: Award,
      badge: 'Live',
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
        <div className="px-3 py-2 mb-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#89190E] uppercase">
            Student Academic Modules
          </span>
          <p className="text-xs text-[#526174] mt-0.5">MSI Portal v2.6</p>
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
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all text-left group ${
                  isActive
                    ? 'bg-[#89190E] text-white shadow-md shadow-[#89190E]/20'
                    : 'text-[#10233F] hover:bg-[#FFF9EF] border border-transparent hover:border-[#E8DCCB]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/10 text-[#EFC988]'
                        : 'bg-[#FFF3DD] text-[#89190E] group-hover:bg-[#EFC988]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`block text-xs sm:text-sm font-bold truncate leading-tight ${
                        isActive ? 'text-white' : 'text-[#10233F]'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`block text-[10px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-white/75' : 'text-[#526174]'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                      isActive
                        ? 'bg-[#EFC988] text-[#10233F]'
                        : item.badge === 'Live'
                        ? 'bg-[#89190E] text-white animate-pulse'
                        : 'bg-[#FFF3DD] text-[#89190E] border border-[#EFC988]'
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
      <div className="mt-6 pt-4 border-t border-[#E8DCCB] space-y-3">
        <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB] relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-bold text-[#10233F]">Active Enrollment</span>
          </div>
          <p className="text-[11px] text-[#526174] mt-1">
            Course validity secured until <strong className="text-[#89190E]">{student.validUntil}</strong>
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#526174]">
            <span>Entitlement: Unlocked</span>
            <span className="text-emerald-700 font-bold">Verified ●</span>
          </div>
        </div>

        <div className="text-[10px] text-center text-[#526174]">
          Need technical or mentor help?{' '}
          <Link href="/contact" className="underline font-semibold text-[#89190E]">
            Contact Faculty Cell
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 bg-white border-r border-[#E8DCCB] min-h-[calc(100vh-65px)]">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fadeIn"
          />
          <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
