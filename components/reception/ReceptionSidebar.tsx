'use client';

import React from 'react';
import {
  UserPlus,
  Users,
  History,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  Building,
  X,
  Radio,
} from 'lucide-react';
import { ReceptionStaff } from './data/receptionMockData';

export type ReceptionModuleTab =
  | 'new-visitor'
  | 'active-visitors'
  | 'history'
  | 'leads';

interface ReceptionSidebarProps {
  activeTab: ReceptionModuleTab;
  onSelectTab: (tab: ReceptionModuleTab) => void;
  staff: ReceptionStaff;
  activeCount: number;
  dueLeadsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function ReceptionSidebar({
  activeTab,
  onSelectTab,
  staff,
  activeCount,
  dueLeadsCount,
  isOpenMobile,
  onCloseMobile,
}: ReceptionSidebarProps) {
  const navItems = [
    {
      id: 'new-visitor' as ReceptionModuleTab,
      label: 'New Registration',
      subtitle: 'Visitor Form & Badge Flow',
      icon: UserPlus,
      badge: 'Step Flow',
    },
    {
      id: 'active-visitors' as ReceptionModuleTab,
      label: 'Active in Institute',
      subtitle: 'Currently inside premises',
      icon: Users,
      countBadge: activeCount,
    },
    {
      id: 'history' as ReceptionModuleTab,
      label: 'Visitor History & Logs',
      subtitle: 'Search, repeats & export',
      icon: History,
    },
    {
      id: 'leads' as ReceptionModuleTab,
      label: 'Telecalling & Leads',
      subtitle: 'Enquiries, Calls & Follow-ups',
      icon: PhoneCall,
      badge: dueLeadsCount !== undefined ? `${dueLeadsCount} Due` : '9 Due',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Terminal Station Badge */}
        <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#89190E] dark:text-[#EFC988] font-bold">
              Station Terminal
            </span>
            <span className="flex items-center space-x-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>ONLINE</span>
            </span>
          </div>
          <h4 className="font-serif font-bold text-xs text-gray-900 dark:text-white leading-snug">
            {staff.location}
          </h4>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
            Officer: <span className="font-semibold text-gray-800 dark:text-gray-200">{staff.name}</span> ({staff.badgeId})
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 block mb-1">
            Reception Modules
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-linear-to-r from-[#89190E] to-[#B22222] text-white shadow-lg shadow-[#89190E]/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#89190E] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#89190E]/10 dark:bg-white/10 text-[#89190E] dark:text-[#EFC988] group-hover:bg-[#89190E]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] block leading-tight mt-0.5 ${
                        isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.countBadge !== undefined && (
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#89190E]'
                        : 'bg-[#89190E] text-white'
                    }`}
                  >
                    {item.countBadge}
                  </span>
                )}

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-[#EFC988] text-gray-950'
                        : 'bg-white/60 dark:bg-white/10 text-[#89190E] dark:text-[#EFC988] border border-[#89190E]/20 dark:border-white/10'
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

      {/* Bottom Institute Reception Info */}
      <div className="pt-4 border-t border-gray-200/50 dark:border-white/10 space-y-2">
        <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#89190E] dark:text-[#EFC988] font-bold block mb-0.5">
            MSI Visitor Management
          </span>
          <span className="text-xs font-bold text-gray-900 dark:text-white block">
            Reception Desk Terminal
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5">
            MSI Group of Institutes
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 glass-sidebar border-r border-gray-200/50 dark:border-white/10 flex-shrink-0 min-h-[calc(100vh-65px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex animate-fadeIn">
          <div className="w-80 max-w-[85vw] bg-white dark:bg-[#121A2B] h-full shadow-2xl flex flex-col justify-between animate-slideUp border-r border-gray-200/50 dark:border-white/10">
            <div className="p-4 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                Reception Navigation
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
}
