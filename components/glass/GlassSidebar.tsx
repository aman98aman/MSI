'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'blue' | 'green' | 'amber' | 'purple';
}

export interface GlassSidebarProps {
  roleBadge: string;
  roleSubtitle?: string;
  items: SidebarNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  userProfile?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export default function GlassSidebar({
  roleBadge,
  roleSubtitle = 'Portal',
  items,
  activeId,
  onSelect,
  collapsed = false,
  onToggleCollapse,
  userProfile,
  onLogout,
  className = '',
}: GlassSidebarProps) {
  const badgeColors = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <aside
      className={`relative h-full flex flex-col justify-between glass-sidebar transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64 sm:w-72'
      } ${className}`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-200/60 dark:border-white/10 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/images/msi-crest.png"
                alt="MSI"
                fill
                className="object-contain p-1"
              />
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-200">
                <span className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase font-serif">
                  MSI Institutes
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                    {roleBadge}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              type="button"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                type="button"
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : badgeColors[item.badgeColor || 'blue']
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

      {/* Bottom Profile & Logout Action */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30">
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          } gap-2 p-2 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors`}
        >
          {userProfile && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 shrink-0 border border-slate-200/80 dark:border-white/10">
                <Image
                  src={userProfile.avatarUrl || '/images/avatars/avatar-1.webp'}
                  alt={userProfile.name}
                  fill
                  className="object-cover"
                />
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userProfile.name}
                  </p>
                  {userProfile.email && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {userProfile.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {onLogout && !collapsed && (
            <button
              onClick={onLogout}
              type="button"
              className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

