'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import GlassButton from './GlassButton';

export interface GlassNavbarProps {
  roleTitle: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
  onMobileMenuToggle?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  notificationsCount?: number;
  className?: string;
}

export default function GlassNavbar({
  roleTitle,
  userName,
  userEmail,
  userAvatar = '/images/avatars/avatar-1.webp',
  onLogout,
  onMobileMenuToggle,
  searchQuery = '',
  onSearchChange,
  quickActionLabel,
  onQuickAction,
  notificationsCount = 0,
  className = '',
}: GlassNavbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  return (
    <header
      className={`sticky top-0 z-30 w-full glass-nav px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 ${className}`}
    >
      {/* Left: Mobile Toggle & Role Breadcrumb */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            type="button"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 lg:hidden"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-indigo-200/50 dark:border-indigo-500/20 shadow-sm shrink-0">
            <Image
              src="/images/msi-crest.png"
              alt="MSI"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                MSI LMS
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                {roleTitle}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white hidden sm:block">
              {userName}
            </h2>
          </div>
        </div>
      </div>

      {/* Center: Search Box */}
      {onSearchChange && (
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search courses, students, lectures..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl glass-input placeholder-slate-400 font-sans"
            />
          </div>
        </div>
      )}

      {/* Right: Actions, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {quickActionLabel && onQuickAction && (
          <GlassButton
            size="sm"
            variant="primary"
            onClick={onQuickAction}
            className="hidden sm:inline-flex"
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {quickActionLabel}
          </GlassButton>
        )}

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            type="button"
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm active:scale-95 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl p-4 z-50 animate-slideDown">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60 dark:border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/40 dark:border-indigo-500/20">
                  <p className="font-semibold text-slate-900 dark:text-white">Live Session Scheduled</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Constitutional Law interactive session starts at 4:00 PM.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5">
                  <p className="font-semibold text-slate-900 dark:text-white">Cloud Sync Active</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    MongoDB Atlas real-time replica set synchronized.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            type="button"
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow transition-all duration-200"
          >
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-indigo-100 dark:bg-indigo-900/40 shrink-0">
              <Image
                src={userAvatar}
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {userName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {roleTitle}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#121A2B]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl p-3 z-50 animate-slideDown">
              <div className="px-3 py-2.5 border-b border-slate-200/60 dark:border-white/5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </p>
                {userEmail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {userEmail}
                  </p>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {roleTitle}
                </span>
              </div>

              <div className="py-1">
                {onLogout && (
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onLogout();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

