'use client';

import React from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  Clock,
  Printer,
  FileCheck,
  AlertTriangle,
  PhoneCall,
  Activity,
  MapPin,
  Flame,
} from 'lucide-react';
import { Visitor, MSI_DEPARTMENTS } from './data/receptionMockData';

interface SuperAdminTabProps {
  visitors: Visitor[];
}

export default function SuperAdminTab({ visitors }: SuperAdminTabProps) {
  const activeVisitors = visitors.filter((v) => v.status === 'Inside');
  const todayTotal = visitors.length;

  const handlePrintMusterRoll = () => {
    window.print();
  };

  // Department traffic breakdown
  const deptCounts: Record<string, number> = {};
  visitors.forEach((v) => {
    deptCounts[v.department] = (deptCounts[v.department] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#10233F] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#EFC988] text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4 text-[#EFC988]" />
              <span>Chief Security Officer • Command Dashboard</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold">
              Super Admin Institute Security Overview
            </h2>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Real-time situational awareness, multi-gate sync, dwell duration analysis, and statutory emergency evacuation headcounts.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrintMusterRoll}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-[#89190E] hover:bg-[#65130D] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg self-start md:self-auto cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Emergency Muster Roll</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526174]">
            Total Visitors Today
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="font-serif text-3xl font-bold text-[#10233F]">
              {todayTotal}
            </span>
            <span className="text-xs text-emerald-600 font-bold">+18% vs avg</span>
          </div>
          <span className="text-[11px] text-[#526174] block mt-1">
            Across Gate 1, Gate 2 & Admin Desk
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526174]">
            Currently Inside
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="font-serif text-3xl font-bold text-[#89190E]">
              {activeVisitors.length}
            </span>
            <span className="text-xs text-emerald-600 font-bold">● Active Badges</span>
          </div>
          <span className="text-[11px] text-[#526174] block mt-1">
            Must be accounted for in emergency
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526174]">
            Peak Institute Traffic
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="font-serif text-2xl font-bold text-[#10233F]">
              10:30 AM
            </span>
            <span className="text-xs text-[#526174]">window</span>
          </div>
          <span className="text-[11px] text-[#526174] block mt-1">
            Admissions counseling rush hour
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DCCB] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#526174]">
            Muster Roll Status
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="font-serif text-2xl font-bold text-emerald-700">
              100%
            </span>
            <span className="text-xs text-emerald-600 font-bold">Synchronized</span>
          </div>
          <span className="text-[11px] text-[#526174] block mt-1">
            All turnstiles online & responsive
          </span>
        </div>
      </div>

      {/* Two Column Layout: Department Distribution & Security Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Footfall Distribution */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8DCCB] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCB] mb-4">
            <div className="flex items-center space-x-2 text-[#89190E]">
              <Building2 className="w-4 h-4" />
              <h3 className="font-serif font-bold text-base text-[#10233F]">
                Department Visitor Distribution
              </h3>
            </div>
            <span className="text-xs text-[#526174] font-mono">Today&apos;s Traffic</span>
          </div>

          <div className="space-y-4">
            {MSI_DEPARTMENTS.slice(0, 5).map((dept) => {
              const count = deptCounts[dept.department] || 0;
              const pct = todayTotal > 0 ? Math.round((count / todayTotal) * 100) : 0;
              return (
                <div key={dept.department}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#10233F]">
                      {dept.department}
                    </span>
                    <span className="font-mono text-xs text-[#89190E] font-bold">
                      {count} visitors ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#FFF3DD] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#89190E] to-[#C89B53] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Alert & Protocol Checklist */}
        <div className="bg-white rounded-3xl border border-[#E8DCCB] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#89190E] pb-3 border-b border-[#E8DCCB] mb-4">
              <Activity className="w-4 h-4" />
              <h3 className="font-serif font-bold text-base text-[#10233F]">
                Gate Terminal Protocols
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
                <span className="font-bold text-[#10233F] block">
                  1. Mobile Number Verification
                </span>
                <span className="text-[11px] text-[#526174] block mt-0.5">
                  100% statutory mandate for non-student institute entrants.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
                <span className="font-bold text-[#10233F] block">
                  2. Photo Identity Pass Display
                </span>
                <span className="text-[11px] text-[#526174] block mt-0.5">
                  Visitors must pin printed pass visibly. Return badge at exit.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF9EF] border border-[#E8DCCB]">
                <span className="font-bold text-[#10233F] block">
                  3. Overstay Notification Protocol
                </span>
                <span className="text-[11px] text-[#526174] block mt-0.5">
                  Automatic alert triggered to Security if visit duration exceeds 4 hours.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8DCCB] text-[11px] text-[#526174] flex items-center justify-between">
            <span>Chief Security Officer</span>
            <span className="font-mono text-[#89190E] font-bold">Col. H. S. Dhillon</span>
          </div>
        </div>
      </div>

      {/* Emergency Evacuation Muster Roll (Targeted for physical print in case of drill/fire) */}
      <div
        id="emergency-muster-roll"
        className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-rose-200 mb-5 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600">
                Statutory Emergency Compliance Section
              </span>
              <h3 className="font-serif font-bold text-lg text-[#10233F]">
                Active Institute Evacuation Muster Roll
              </h3>
              <p className="text-xs text-[#526174]">
                Complete roster of all external visitors currently inside institute boundaries.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-bold self-start sm:self-auto">
            {activeVisitors.length} External Personnel on Site
          </span>
        </div>

        {/* Muster Roll Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-rose-50/70 border-b border-rose-200 text-[#526174] font-bold text-[10px] uppercase">
                <th className="p-3">Visitor Name</th>
                <th className="p-3">Pass ID</th>
                <th className="p-3">Mobile Contact</th>
                <th className="p-3">Assigned Host & Location</th>
                <th className="p-3">Check-In Time</th>
                <th className="p-3">Assembly Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100">
              {activeVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-rose-50/30">
                  <td className="p-3 font-semibold text-[#10233F]">{v.name}</td>
                  <td className="p-3 font-mono font-bold text-[#89190E]">{v.id}</td>
                  <td className="p-3 font-mono text-[#526174]">+91 {v.mobile}</td>
                  <td className="p-3 text-[#10233F]">
                    {v.hostPerson} • <span className="text-[#526174]">{v.department}</span>
                  </td>
                  <td className="p-3 font-mono">{v.entryTime}</td>
                  <td className="p-3">
                    <span className="inline-block w-20 border-b border-dashed border-rose-300 text-center text-[10px] text-rose-400">
                      [ Sign / Check ]
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
