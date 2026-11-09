'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Clock,
  Building2,
  LogOut,
  Printer,
  ShieldAlert,
  Phone,
  Car,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Visitor, MSI_DEPARTMENTS } from './data/receptionMockData';
import VisitorPassModal from './VisitorPassModal';
import GlassCard from '../glass/GlassCard';
import GlassStatCard from '../glass/GlassStatCard';

interface ActiveVisitorsTabProps {
  visitors: Visitor[];
  onMarkExit: (visitorId: string) => void;
}

export default function ActiveVisitorsTab({
  visitors,
  onMarkExit,
}: ActiveVisitorsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [viewingPassVisitor, setViewingPassVisitor] = useState<Visitor | null>(null);
  const [exitSuccessMsg, setExitSuccessMsg] = useState<string | null>(null);

  // Active visitors only
  const activeList = visitors.filter((v) => v.status === 'Inside');

  // Filtered by search & department
  const filtered = activeList.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mobile.includes(searchTerm) ||
      v.hostPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || v.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const handleTriggerExit = (id: string, name: string) => {
    onMarkExit(id);
    setExitSuccessMsg(`Exit recorded for ${name}. Visitor departure logged successfully.`);
    setTimeout(() => {
      setExitSuccessMsg(null);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassStatCard
          title="Active In Institute"
          value={activeList.length}
          trend={{ value: 'Clearance Active', isPositive: true }}
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          sparklineData={[1, 2, 2, 3, activeList.length]}
          description="Authorized visitors inside"
        />

        <GlassStatCard
          title="Average Dwell Time"
          value="48m"
          trend={{ value: 'Optimal Window', isPositive: true }}
          icon={<Clock className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />}
          sparklineData={[35, 42, 45, 50, 48]}
          description="Standard: 15m - 2h"
        />

        <GlassStatCard
          title="Overstay Watch (> 3h)"
          value="0"
          trend={{ value: '100% Compliant', isPositive: true }}
          icon={<ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          sparklineData={[0, 0, 0, 0, 0]}
          description="Zero flagged passes"
        />
      </div>

      {/* Exit Success Notification */}
      {exitSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs animate-fadeIn backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{exitSuccessMsg}</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">VMS Exit Timestamp Logged</span>
        </div>
      )}

      {/* Search and Filters */}
      <GlassCard variant="default" className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search visitor name, ID, mobile, host..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E] dark:focus:border-[#EFC988]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#89190E] font-medium"
          >
            <option value="ALL">All MSI Departments</option>
            {MSI_DEPARTMENTS.map((d) => (
              <option key={d.department} value={d.department}>
                {d.department}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Active Visitors Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8DCCB]">
          <Users className="w-12 h-12 text-[#E8DCCB] mx-auto mb-3" />
          <h3 className="font-serif font-bold text-base text-[#10233F]">
            No Active Visitors Found
          </h3>
          <p className="text-xs text-[#526174] mt-1">
            {searchTerm || selectedDept !== 'ALL'
              ? 'Try changing your search keywords or department filter.'
              : 'No visitors currently inside the premises. Use New Registration to register incoming visitors.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((visitor) => (
            <GlassCard
              key={visitor.id}
              variant="elevated"
              className="p-5 flex flex-col justify-between"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-white/20 bg-stone-100 dark:bg-white/5 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visitor.photoUrl}
                        alt={visitor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] font-bold text-[#89190E] dark:text-[#EFC988] bg-[#89190E]/10 dark:bg-[#89190E]/20 px-2 py-0.5 rounded">
                          {visitor.id}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20">
                          {visitor.visitorType}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white mt-1 leading-tight">
                        {visitor.name}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#89190E] dark:text-[#EFC988]" />
                        +91 {visitor.mobile}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Inside</span>
                  </span>
                </div>

                {/* Details Grid */}
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Destination:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-right truncate max-w-[200px]">
                      {visitor.department}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Host Person:</span>
                    <span className="font-semibold text-[#89190E] dark:text-[#EFC988] text-right">
                      {visitor.hostPerson}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-right truncate max-w-[220px]">
                      {visitor.purpose}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-white/10 font-mono text-[11px]">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#89190E] dark:text-[#EFC988]" />
                      Entry: {visitor.entryTime}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Gate: {visitor.gateNumber.split(' ')[0]}
                    </span>
                  </div>

                  {visitor.vehicleNo && (
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-[#89190E] dark:text-[#EFC988]" />
                        Vehicle:
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {visitor.vehicleNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewingPassVisitor(visitor)}
                  className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#89190E] dark:text-[#EFC988]" />
                  <span>View Pass</span>
                </button>

                {/* Exit Update button */}
                <button
                  type="button"
                  onClick={() => handleTriggerExit(visitor.id, visitor.name)}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-[#89190E] to-[#B22222] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-md shadow-[#89190E]/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Update</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Visitor Pass Modal view */}
      {viewingPassVisitor && (
        <VisitorPassModal
          visitor={viewingPassVisitor}
          onClose={() => setViewingPassVisitor(null)}
          onMarkExit={(id) => {
            handleTriggerExit(id, viewingPassVisitor.name);
          }}
        />
      )}
    </div>
  );
}
