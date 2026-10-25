'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderOpen,
  FileCheck,
  Activity,
  Calendar,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { TeacherProfile } from './data/teacherMockData';

export type TeacherModuleTab =
  | 'dashboard'
  | 'content'
  | 'assessment'
  | 'monitoring'
  | 'classes'
  | 'communication';

interface TeacherSidebarProps {
  activeTab: TeacherModuleTab;
  onSelectTab: (tab: TeacherModuleTab) => void;
  teacher: TeacherProfile;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function TeacherSidebar({
  activeTab,
  onSelectTab,
  teacher,
  isOpenMobile,
  onCloseMobile,
}: TeacherSidebarProps) {
  const navTabs: {
    id: TeacherModuleTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Assigned courses & classes',
      icon: LayoutDashboard,
    },
    {
      id: 'content',
      label: 'Content Hub',
      description: 'Videos, PDFs & Publish/Hide',
      icon: FolderOpen,
      badge: 'Active',
    },
    {
      id: 'assessment',
      label: 'Assessment',
      description: 'Create tests & question bank',
      icon: FileCheck,
      badge: 'New',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      description: 'Attendance & student scores',
      icon: Activity,
    },
    {
      id: 'classes',
      label: 'Classes & Meet',
      description: 'Schedule & take attendance',
      icon: Calendar,
      badge: 'Live',
    },
    {
      id: 'communication',
      label: 'Communication',
      description: 'Announcements & 1-on-1 Meet',
      icon: MessageSquare,
    },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5">
      {/* Navigation Links */}
      <div>
        <div className="px-3 py-2 mb-3">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#89190E] uppercase">
            Faculty Academic Portal
          </span>
          <p className="text-xs text-[#526174] mt-0.5">MSI Teacher Suite</p>
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
                    ? 'bg-[#10233F] text-white shadow-md shadow-[#10233F]/20'
                    : 'text-[#10233F] hover:bg-[#FFF9EF] border border-transparent hover:border-[#E8DCCB]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/15 text-[#EFC988]'
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
                        ? 'bg-emerald-600 text-white animate-pulse'
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

      {/* Stream Isolation Policy Notice */}
      <div className="mt-6 pt-4 border-t border-[#E8DCCB] space-y-3">
        <div className="p-3.5 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#89190E] flex-shrink-0" />
            <span className="text-xs font-bold text-[#10233F]">Stream Filtering Active</span>
          </div>
          <p className="text-[11px] text-[#526174] mt-1 leading-snug">
            Restricted to <strong className="text-[#89190E]">{teacher.stream} Discipline</strong>. Cross-stream student records are segregated.
          </p>
          <div className="mt-2 text-[10px] font-mono text-[#526174]">
            Role: <strong>{teacher.title.split(' ')[0]} {teacher.title.split(' ')[1]}</strong>
          </div>
        </div>

        <div className="text-[10px] text-center text-[#526174]">
          <Link href="/student/dashboard" className="underline font-semibold text-[#89190E]">
            Switch to Student Portal
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
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
