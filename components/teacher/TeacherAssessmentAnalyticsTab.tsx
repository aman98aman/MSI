'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2,
  Users,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Search,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  TrendingUp,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import GlassCard from '../glass/GlassCard';
import GlassStatCard from '../glass/GlassStatCard';
import { MSICourse } from '@/lib/lmsStore';
import * as XLSX from 'xlsx';

interface TestAttempt {
  id: string;
  testId: string;
  studentPhone: string;
  studentName: string;
  assignedQuestionIds: string[];
  answers: Record<string, number>;
  score?: number;
  maxScore?: number;
  startedAt: string;
  submittedAt?: string;
  status: 'in-progress' | 'submitted' | 'timed-out';
  activityLogs: Array<{ type: string; timestamp: string; detail?: string }>;
}

interface LMSTest {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  questions: any[];
  questionsPerStudent: number;
  marksPerQuestion: number;
  durationMinutes: number;
}

interface TeacherAssessmentAnalyticsTabProps {
  lmsCourses: MSICourse[];
  teacherId: string;
  enrolledStudents: Array<{ id: string; name: string; phone: string; stream?: string }>;
}

export default function TeacherAssessmentAnalyticsTab({
  lmsCourses = [],
  teacherId,
  enrolledStudents = [],
}: TeacherAssessmentAnalyticsTabProps) {
  const [tests, setTests] = useState<LMSTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttemptForLogs, setSelectedAttemptForLogs] = useState<TestAttempt | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);

  // Fetch tests for this teacher
  useEffect(() => {
    const fetchTeacherTests = async () => {
      setIsLoadingTests(true);
      try {
        const res = await fetch(`/api/lms/tests?teacherId=${encodeURIComponent(teacherId || '')}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.tests)) {
          setTests(data.tests);
          if (data.tests.length > 0) {
            setSelectedTestId(data.tests[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching tests for analytics:', err);
      } finally {
        setIsLoadingTests(false);
      }
    };
    fetchTeacherTests();
  }, [teacherId]);

  // Fetch attempts when selected test changes
  const fetchAttempts = useCallback(async () => {
    if (!selectedTestId) {
      setAttempts([]);
      return;
    }
    setIsLoadingAttempts(true);
    try {
      const res = await fetch(`/api/lms/test-attempts?testId=${encodeURIComponent(selectedTestId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.attempts)) {
        setAttempts(data.attempts);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      console.error('Error fetching attempts for test:', err);
      setAttempts([]);
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [selectedTestId]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // Active test details
  const currentTest = useMemo(() => {
    return tests.find((t) => t.id === selectedTestId) || null;
  }, [tests, selectedTestId]);

  // Compute analytics
  const analytics = useMemo(() => {
    const totalEnrolled = enrolledStudents.length;
    const attemptedCount = attempts.length;
    const notAttemptedCount = Math.max(0, totalEnrolled - attemptedCount);

    const scores = attempts.map((a) => a.score ?? 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const totalSuspiciousEvents = attempts.reduce((acc, a) => {
      return acc + (a.activityLogs ? a.activityLogs.length : 0);
    }, 0);

    return {
      totalEnrolled,
      attemptedCount,
      notAttemptedCount,
      avgScore,
      highestScore,
      lowestScore,
      totalSuspiciousEvents,
    };
  }, [enrolledStudents, attempts]);

  // Export to Excel
  const handleExportToExcel = () => {
    if (attempts.length === 0) {
      alert('No student attempts to export.');
      return;
    }
    const data = attempts.map((att, idx) => ({
      '#': idx + 1,
      'Student Name': att.studentName,
      'Mobile': att.studentPhone,
      'Test Title': currentTest?.title || 'Online Examination',
      'Score': att.score ?? 0,
      'Max Score': att.maxScore ?? 0,
      'Percentage': att.maxScore ? Math.round(((att.score ?? 0) / att.maxScore) * 100) + '%' : '0%',
      'Status': att.status,
      'Attempt Date': att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'N/A',
      'Suspicious Alerts': att.activityLogs ? att.activityLogs.length : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test_Results');
    XLSX.writeFile(wb, `MSI_Assessment_${currentTest?.title || 'Report'}.xlsx`);
  };

  // Filter attempts by search
  const filteredAttempts = attempts.filter((att) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return att.studentName.toLowerCase().includes(q) || att.studentPhone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Test Selector */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-[#89190E] dark:text-[#EFC988]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Assessment Analytics & Examination Proctoring
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Live scoring diagnostics, attempt verification, and proctoring logs (tab-switching and screenshot attempts).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportToExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer hover:bg-emerald-100"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Results (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Test Selector Dropdown */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Select Examination:
            </label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="flex-1 max-w-md p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              {tests.length === 0 ? (
                <option value="">No tests created yet</option>
              ) : (
                tests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.courseName})
                  </option>
                ))
              )}
            </select>
          </div>

          {currentTest && (
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Duration: <strong>{currentTest.durationMinutes}m</strong></span>
              <span>•</span>
              <span>Questions / Student: <strong>{currentTest.questionsPerStudent}</strong></span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-xs text-center">
          <span className="text-[10px] font-mono uppercase text-gray-400 block">ENROLLED COHORT</span>
          <span className="font-serif text-2xl font-bold text-gray-900 dark:text-white mt-1 block">
            {analytics.totalEnrolled}
          </span>
          <span className="text-[10px] text-gray-500">Students</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-emerald-500/20 text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 block">ATTEMPTED</span>
          <span className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {analytics.attemptedCount}
          </span>
          <span className="text-[10px] text-gray-500">
            {analytics.totalEnrolled > 0
              ? `${Math.round((analytics.attemptedCount / analytics.totalEnrolled) * 100)}% Participation`
              : 'Active'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-amber-500/20 text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 block">UNATTEMPTED</span>
          <span className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {analytics.notAttemptedCount}
          </span>
          <span className="text-[10px] text-gray-500">Pending</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-indigo-500/20 text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 block">AVG SCORE</span>
          <span className="font-serif text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
            {analytics.avgScore}
          </span>
          <span className="text-[10px] text-gray-500">Marks</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-xs text-center">
          <span className="text-[10px] font-mono uppercase text-gray-400 block">HIGH / LOW</span>
          <span className="font-serif text-xl font-bold text-gray-900 dark:text-white mt-1 block">
            {analytics.highestScore} / {analytics.lowestScore}
          </span>
          <span className="text-[10px] text-gray-500">Score Range</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-rose-500/20 text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase text-rose-600 dark:text-rose-400 block">SUSPICIOUS ALERTS</span>
          <span className="font-serif text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {analytics.totalSuspiciousEvents}
          </span>
          <span className="text-[10px] text-rose-500">Tab switches/etc</span>
        </div>
      </div>

      {/* Attempts Roster */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Student Submissions & Score Ledger ({filteredAttempts.length})
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only students enrolled in your assigned courses are shown.
            </p>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student by name or phone..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
            />
          </div>
        </div>

        {isLoadingAttempts ? (
          <div className="text-center py-12 text-gray-400 text-xs animate-pulse">
            Loading submission logs from database...
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            No students have submitted attempts for this examination yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-3 font-serif font-bold">Candidate Name & Phone</th>
                  <th className="p-3 font-serif font-bold">Score (Obtained / Max)</th>
                  <th className="p-3 font-serif font-bold">Percentage</th>
                  <th className="p-3 font-serif font-bold">Status</th>
                  <th className="p-3 font-serif font-bold">Submission Timestamp</th>
                  <th className="p-3 font-serif font-bold text-center">Proctoring Logs</th>
                  <th className="p-3 font-serif font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/40 dark:divide-white/10">
                {filteredAttempts.map((att) => {
                  const pct = att.maxScore ? Math.round(((att.score ?? 0) / att.maxScore) * 100) : 0;
                  const alertCount = att.activityLogs ? att.activityLogs.length : 0;

                  return (
                    <tr key={att.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {att.studentName}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {att.studentPhone}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">
                        {att.score ?? 0} / {att.maxScore ?? 0}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                            pct >= 75
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : pct >= 50
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                          {att.status}
                        </span>
                      </td>

                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'In Progress'}
                      </td>

                      <td className="p-3 text-center">
                        {alertCount > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedAttemptForLogs(att);
                              setShowLogsModal(true);
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
                          >
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>{alertCount} Warning{alertCount > 1 ? 's' : ''}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px]">Clean</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedAttemptForLogs(att);
                            setShowLogsModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-semibold cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Proctoring Activity Log Modal */}
      {showLogsModal && selectedAttemptForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-200 dark:border-white/10 relative">
            <button
              onClick={() => setShowLogsModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                  Proctoring Activity Logs
                </h3>
                <span className="text-xs text-gray-500">
                  Candidate: {selectedAttemptForLogs.studentName} ({selectedAttemptForLogs.studentPhone})
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {selectedAttemptForLogs.activityLogs && selectedAttemptForLogs.activityLogs.length > 0 ? (
                selectedAttemptForLogs.activityLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-800 dark:text-rose-300 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span className="uppercase">{log.type.replace('_', ' ')}</span>
                      <span className="font-mono text-[10px] text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.detail && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
                        {log.detail}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  No suspicious activity was detected during this examination session.
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLogsModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-950 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
