'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  Building2,
  Eye,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  User,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { Visitor, MSI_DEPARTMENTS } from './data/receptionMockData';
import VisitorPassModal from './VisitorPassModal';

interface VisitorHistoryTabProps {
  visitors: Visitor[];
}

export default function VisitorHistoryTab({ visitors }: VisitorHistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Inside' | 'Exited'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [selectedVisitorForHistory, setSelectedVisitorForHistory] = useState<Visitor | null>(null);
  const [reprintPassVisitor, setReprintPassVisitor] = useState<Visitor | null>(null);

  // Filter visitors
  const filtered = visitors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.mobile.includes(searchTerm) ||
      v.hostPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || v.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = [
      'Visitor ID',
      'Name',
      'Mobile',
      'Visitor Type',
      'Department',
      'Host Person',
      'Purpose',
      'Entry Time',
      'Exit Time',
      'Status',
      'Govt ID',
      'Gate',
      'Visit Count',
    ];

    const rows = filtered.map((v) => [
      v.id,
      `"${v.name}"`,
      v.mobile,
      `"${v.visitorType}"`,
      `"${v.department}"`,
      `"${v.hostPerson}"`,
      `"${v.purpose}"`,
      v.entryTime,
      v.exitTime || 'STILL IN INSTITUTE',
      v.status,
      `"${v.govtIdType} (${v.govtIdNumber || ''})"`,
      v.gateNumber,
      v.visitCount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MSI_Visitor_Logbook_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Visitor Archives &amp; Regulatory Logbook
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-grade record of all incoming institute traffic, repeat visits, and gate exit clearances.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl glass-card hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-900 dark:text-white transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>Export CSV Logbook</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl glass-card shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, phone, host..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Pill Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-full md:w-auto">
          {(['ALL', 'Inside', 'Exited'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Records' : st === 'Inside' ? 'Inside (Active)' : 'Exited (Cleared)'}
            </button>
          ))}
        </div>

        {/* Dept Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium transition-all"
        >
          <option value="ALL">All Departments</option>
          {MSI_DEPARTMENTS.map((d) => (
            <option key={d.department} value={d.department}>
              {d.department}
            </option>
          ))}
        </select>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Visitor &amp; ID</th>
                <th className="p-4">Type / Repeat</th>
                <th className="p-4">Host &amp; Department</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Entry / Exit Times</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
              {filtered.map((visitor) => (
                <tr
                  key={visitor.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Visitor & ID */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-10 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-slate-800 flex-shrink-0 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={visitor.photoUrl}
                          alt={visitor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block leading-snug">
                          {visitor.name}
                        </span>
                        <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{visitor.id}</span>
                          <span>•</span>
                          <span>+91 {visitor.mobile}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type / Repeat */}
                  <td className="p-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                      {visitor.visitorType}
                    </span>
                    {visitor.visitCount > 1 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedVisitorForHistory(visitor)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1 flex items-center gap-0.5 cursor-pointer"
                        title="Click to view all past visits"
                      >
                        <span>Repeat ({visitor.visitCount} visits)</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="block text-[10px] text-slate-400 mt-1">
                        First Visit
                      </span>
                    )}
                  </td>

                  {/* Host & Department */}
                  <td className="p-4">
                    <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
                      {visitor.hostPerson}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {visitor.department}
                    </span>
                  </td>

                  {/* Purpose */}
                  <td className="p-4 max-w-[200px]">
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium block truncate">
                      {visitor.purpose}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      Gate: {visitor.gateNumber.split(' ')[0]}
                    </span>
                  </td>

                  {/* Entry / Exit Times */}
                  <td className="p-4 font-mono text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-900 dark:text-white">
                      <span className="text-slate-400">In:</span>
                      <span className="font-bold">{visitor.entryTime}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>Out:</span>
                      <span className={visitor.exitTime ? 'font-bold text-slate-900 dark:text-white' : 'text-emerald-500 font-semibold'}>
                        {visitor.exitTime || 'Still in Institute'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        visitor.status === 'Inside'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          visitor.status === 'Inside' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span>{visitor.status}</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setReprintPassVisitor(visitor)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white transition-colors cursor-pointer shadow-xs"
                        title="View / Re-print Pass Badge"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center text-slate-400">
            No historical visitor records matching the selected parameters.
          </div>
        )}
      </div>

      {/* Repeat Visit History Drawer Modal */}
      {selectedVisitorForHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md glass-card-elevated rounded-3xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold">
                  Repeat Visitor Dossier
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedVisitorForHistory.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVisitorForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Recorded Visit Timeline:
              </span>

              {/* Current Visit */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-xs">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">
                  Today&apos;s Visit • {selectedVisitorForHistory.entryTime}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                  {selectedVisitorForHistory.purpose}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                  Host: {selectedVisitorForHistory.hostPerson} ({selectedVisitorForHistory.department})
                </span>
              </div>

              {/* Past Visits */}
              {selectedVisitorForHistory.pastVisits &&
                selectedVisitorForHistory.pastVisits.map((pv, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Past Visit #{idx + 1} • {pv.date}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
                      {pv.purpose}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                      Host: {pv.hostPerson} ({pv.department})
                    </span>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedVisitorForHistory(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* Visitor Pass Re-print Modal */}
      {reprintPassVisitor && (
        <VisitorPassModal
          visitor={reprintPassVisitor}
          onClose={() => setReprintPassVisitor(null)}
        />
      )}
    </div>
  );
}
