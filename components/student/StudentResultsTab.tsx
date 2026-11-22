'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  ChevronRight,
  BookOpen,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import GlassCard from '../glass/GlassCard';

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
}

interface LMSTest {
  id: string;
  title: string;
  courseName: string;
}

interface StudentResultsTabProps {
  studentPhone: string;
}

export default function StudentResultsTab({ studentPhone }: StudentResultsTabProps) {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [testsMap, setTestsMap] = useState<Record<string, LMSTest>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      try {
        const cleanPhone = (studentPhone || '').replace(/\D/g, '').slice(-10);

        // Fetch all tests to map test names
        const testsRes = await fetch('/api/lms/tests', { cache: 'no-store' });
        const testsData = await testsRes.json();
        const map: Record<string, LMSTest> = {};
        if (testsData.success && Array.isArray(testsData.tests)) {
          testsData.tests.forEach((t: LMSTest) => {
            map[t.id] = t;
          });
        }
        setTestsMap(map);

        // Fetch attempts for this student
        const res = await fetch(`/api/lms/test-attempts?studentPhone=${cleanPhone}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.attempts)) {
          setAttempts(data.attempts);
        } else {
          setAttempts([]);
        }
      } catch (err) {
        console.error('Error fetching student results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [studentPhone]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200/50 dark:border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              My Examination Results & Scorecard
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Verified assessment outcomes and speed drill diagnostics across your enrolled courses.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Results List */}
      <GlassCard variant="elevated" className="p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-white/10">
          <h3 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            Completed Examinations ({attempts.length})
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            One Attempt Examination History
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400 text-xs animate-pulse">
            Loading assessment scores from official registry...
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h4 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
              No Examination Attempts Recorded
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
              You haven't attempted any online examinations yet. Visit the <strong>Online Tests</strong> tab to complete your scheduled tests.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/40 dark:divide-white/10 mt-2 space-y-4">
            {attempts.map((att) => {
              const testInfo = testsMap[att.testId];
              const score = att.score ?? 0;
              const maxScore = att.maxScore ?? 1;
              const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
              const answeredCount = att.answers ? Object.keys(att.answers).length : 0;

              return (
                <div
                  key={att.id}
                  className="pt-4 first:pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 uppercase">
                        {testInfo?.courseName || 'Course Exam'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {att.submittedAt
                          ? new Date(att.submittedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-gray-900 dark:text-white">
                      {testInfo?.title || 'Mock Examination'}
                    </h4>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Answered: <strong>{answeredCount}</strong> of {att.assignedQuestionIds?.length || 15} assigned questions • Status: <strong className="capitalize">{att.status}</strong>
                    </p>
                  </div>

                  {/* Score Tile */}
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <span className="text-2xl font-serif font-bold text-gray-900 dark:text-white block">
                        {score} / {maxScore}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          pct >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pct >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {pct}% Score
                      </span>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-serif font-bold text-lg ${
                        pct >= 75
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : pct >= 50
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}
                    >
                      {pct >= 75 ? 'A+' : pct >= 50 ? 'B' : 'C'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
