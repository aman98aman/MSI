'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Copy,
  QrCode,
  ExternalLink,
  Archive,
  XCircle,
  CheckCircle2,
  Clock,
  Users,
  IndianRupee,
  FileText,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import ExamAdminAuthGate from '@/components/admin/ExamAdminAuthGate';

interface DashboardMetrics {
  totalExams: number;
  draftExams: number;
  publishedExams: number;
  registrationOpen: number;
  upcomingExams: number;
  liveExams: number;
  completedExams: number;
  cancelledExams: number;
  archivedExams: number;
  totalRegistrations: number;
  successfulPayments: number;
  pendingPayments: number;
  totalRevenueInr: number;
  submittedAttempts: number;
  absentCandidates: number;
  resultsAwaitingPublication: number;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-800',
  registration_open: 'bg-emerald-100 text-emerald-800',
  registration_closed: 'bg-amber-100 text-amber-800',
  upcoming: 'bg-indigo-100 text-indigo-800',
  live: 'bg-rose-100 text-rose-800 animate-pulse',
  ended: 'bg-slate-200 text-slate-800',
  results_processing: 'bg-purple-100 text-purple-800',
  results_published: 'bg-teal-100 text-teal-800',
  cancelled: 'bg-red-100 text-red-800',
  archived: 'bg-zinc-200 text-zinc-700',
};

function ExaminationsDashboardContent() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '15',
        eventType,
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/examinations?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setExams(data.exams || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {
      showToast('Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  }, [page, eventType, statusFilter, search]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleLifecycleAction = async (examId: string, action: string, label: string) => {
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    try {
      const res = await fetch(`/api/admin/examinations/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Action "${label}" completed.`);
        fetchExams();
      } else {
        showToast(data.message || 'Action failed.');
      }
    } catch {
      showToast('Network error.');
    }
  };

  const copyRegistrationLink = (slug: string) => {
    const url = `${window.location.origin}/exam/${slug}`;
    navigator.clipboard.writeText(url);
    showToast(`Copied registration link: ${url}`);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37]">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#071B37] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border border-[#EFC988]/40">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E8EEFF] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/super-admin"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="Back to Super Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#89190E]">
                MSI Group of Institutes • Dedicated Module
              </span>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#071B37]">
                Online Examinations &amp; Events Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchExams}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Link
              href="/admin/online-examinations/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Exam / Event
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Real Database Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Total Exams</span>
              <div className="font-serif font-bold text-2xl mt-1">{metrics.totalExams}</div>
              <span className="text-[11px] text-gray-500">
                {metrics.draftExams} drafts • {metrics.liveExams} live
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Reg. Open</span>
              <div className="font-serif font-bold text-2xl text-emerald-700 mt-1">
                {metrics.registrationOpen}
              </div>
              <span className="text-[11px] text-gray-500">{metrics.upcomingExams} upcoming</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Registrations</span>
              <div className="font-serif font-bold text-2xl mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#89190E]" />
                {metrics.totalRegistrations}
              </div>
              <span className="text-[11px] text-gray-500">Confirmed candidates</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Paid / Pending</span>
              <div className="font-serif font-bold text-2xl mt-1">
                {metrics.successfulPayments}{' '}
                <span className="text-sm font-normal text-amber-600">/ {metrics.pendingPayments}</span>
              </div>
              <span className="text-[11px] text-gray-500">Verified orders</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Exam Revenue</span>
              <div className="font-serif font-bold text-2xl text-[#071B37] mt-1 flex items-center">
                <IndianRupee className="w-4 h-4" />
                {metrics.totalRevenueInr.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-gray-500">Server-verified INR</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">CBT Attempts</span>
              <div className="font-serif font-bold text-2xl mt-1">{metrics.submittedAttempts}</div>
              <span className="text-[11px] text-gray-500">
                {metrics.resultsAwaitingPublication} awaiting publish
              </span>
            </div>
          </div>
        )}

        {/* Category Tabs & Filters */}
        <div className="bg-white rounded-2xl border border-[#E8EEFF] p-4 shadow-xs space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'online_cbt', label: 'Online CBT Exams' },
              { id: 'offline_mock', label: 'Offline Mock Tests' },
              { id: 'hybrid', label: 'Hybrid Events' },
              { id: 'debate_competition', label: 'Debates & Competitions' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setEventType(tab.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  eventType === tab.id
                    ? 'bg-[#071B37] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by exam title, code, category, or slug..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#071B37]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#071B37] bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="registration_open">Registration Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="ended">Ended</option>
              <option value="results_published">Results Published</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Examinations Table */}
        <div className="bg-white rounded-2xl border border-[#E8EEFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-[#E8EEFF]">
                  <th className="py-3.5 px-4">Exam / Event</th>
                  <th className="py-3.5 px-4">Type &amp; Mode</th>
                  <th className="py-3.5 px-4">Fee</th>
                  <th className="py-3.5 px-4">Schedule (IST)</th>
                  <th className="py-3.5 px-4">Registrations</th>
                  <th className="py-3.5 px-4">Lifecycle Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-semibold">
                      Loading examinations...
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No examinations found. Click <strong>Create Exam / Event</strong> to set up your first examination.
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/online-examinations/${exam.id}`}
                          className="font-bold text-[#071B37] hover:text-[#89190E] block"
                        >
                          {exam.title}
                        </Link>
                        <span className="text-[11px] font-mono text-gray-500">
                          {exam.code} • {exam.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold capitalize block">
                          {exam.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-gray-500 capitalize">
                          Mode: {exam.participationMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {exam.registrationConfig?.isFree || exam.registrationConfig?.feeAmount === 0
                          ? 'FREE'
                          : `₹${exam.registrationConfig?.feeAmount}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">{exam.scheduleConfig?.examDate}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.scheduleConfig?.durationMinutes} mins
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#071B37]">
                          {exam.stats?.confirmedRegistrations || 0} confirmed
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {exam.stats?.submittedAttempts || 0} submitted
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            STATUS_BADGE[exam.effectiveStatus] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {String(exam.effectiveStatus).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/admin/online-examinations/${exam.id}`}
                            className="px-2.5 py-1.5 rounded-lg bg-[#071B37] text-white text-[11px] font-bold hover:bg-[#0e2d57]"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={() => copyRegistrationLink(exam.publicSlug)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 cursor-pointer"
                            title="Copy Public Registration URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/api/admin/examinations/${exam.id}/qr?format=png`}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
                            title="Download QR PNG"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </a>
                          <Link
                            href={`/exam/${exam.publicSlug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600"
                            title="Preview Public Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {exam.effectiveStatus === 'draft' && (
                            <button
                              onClick={() => handleLifecycleAction(exam.id, 'publish', 'Publish Exam')}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              title="Publish"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {exam.effectiveStatus !== 'archived' && exam.effectiveStatus !== 'cancelled' && (
                            <button
                              onClick={() => handleLifecycleAction(exam.id, 'archive', 'Archive Exam')}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer"
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {exam.effectiveStatus !== 'cancelled' && exam.effectiveStatus !== 'archived' && (
                            <button
                              onClick={() => handleLifecycleAction(exam.id, 'cancel', 'Cancel Exam')}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
                              title="Cancel"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OnlineExaminationsDashboardPage() {
  return (
    <ExamAdminAuthGate>
      <ExaminationsDashboardContent />
    </ExamAdminAuthGate>
  );
}
