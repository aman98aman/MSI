'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  Loader2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Send,
  X,
  Info,
} from 'lucide-react';
import GlassCard from '../glass/GlassCard';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface LMSTest {
  id: string;
  title: string;
  instructions: string;
  courseId: string;
  courseName: string;
  questionsPerStudent: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
}

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

interface StudentOnlineTestTabProps {
  studentPhone: string;
  studentName: string;
  enrolledCourseIds: string[];
}

type TestStatus = 'Available' | 'Attempted' | 'Expired' | 'Upcoming';

interface TestWithStatus extends LMSTest {
  computedStatus: TestStatus;
  attempt?: TestAttempt;
}

// ─── Warning Popup ────────────────────────────────────────────────────────────
function WarningPopup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#121A2B] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-amber-500/40 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Security Warning</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-5">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold cursor-pointer"
        >
          OK, I Understand
        </button>
      </div>
    </div>
  );
}

// ─── Test Interface ───────────────────────────────────────────────────────────
function TestInterface({
  test,
  attemptId,
  questions,
  studentPhone,
  onSubmit,
}: {
  test: LMSTest;
  attemptId: string;
  questions: Question[];
  studentPhone: string;
  onSubmit: (score: number, maxScore: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(test.durationMinutes * 60);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tabSwitchCountRef = useRef(0);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const showWarning = (msg: string) => setWarning(msg);

  const logActivity = useCallback(
    async (type: string, detail?: string) => {
      try {
        await fetch('/api/lms/test-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'log-activity', attemptId, type, detail }),
        });
      } catch {}
    },
    [attemptId]
  );

  const saveAnswers = useCallback(async () => {
    try {
      await fetch('/api/lms/test-attempts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers, action: 'save' }),
      });
    } catch {}
  }, [attemptId, answers]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/lms/test-attempts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers, action: 'submit' }),
      });
      const data = await res.json();
      const score = data.attempt?.score ?? data.score ?? 0;
      const maxScore = data.attempt?.maxScore ?? data.maxScore ?? questions.length * test.marksPerQuestion;
      setResult({ score, maxScore });
      setSubmitted(true);
      onSubmit(score, maxScore);
    } catch {
      setResult({ score: 0, maxScore: questions.length * test.marksPerQuestion });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, submitting, submitted, questions.length, test.marksPerQuestion, onSubmit]);

  // Security event listeners
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        showWarning('Copy/paste is not allowed during examination');
      }
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
      ) {
        showWarning('Screenshots are not permitted during this examination');
        logActivity('screenshot_attempt');
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        logActivity('tab_switch', `count=${tabSwitchCountRef.current}`);
        showWarning(`Warning ${tabSwitchCountRef.current}/3: Tab switching detected. Continued violations may result in auto-submission.`);
        if (tabSwitchCountRef.current >= 3) {
          handleSubmit();
        }
      }
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [logActivity, handleSubmit]);

  // Timer countdown
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, handleSubmit]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (submitted) return;
    autoSaveRef.current = setInterval(saveAnswers, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [submitted, saveAnswers]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  // ── Results Screen ──
  if (submitted && result) {
    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="bg-white dark:bg-[#121A2B] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Test Submitted!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{test.title}</p>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200/50 dark:border-indigo-700/30 mb-6">
            <span className="text-5xl font-serif font-bold text-indigo-700 dark:text-indigo-300 block">
              {pct}%
            </span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              {result.score} / {result.maxScore} Marks
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {answeredCount} of {questions.length} questions attempted
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold cursor-pointer"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // ── Test Interface ──
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-[#0A1120]"
      style={{ userSelect: 'none' }}
    >
      {warning && <WarningPopup message={warning} onClose={() => setWarning(null)} />}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0E1A2E] border-b border-white/10 flex-shrink-0">
        <h2 className="font-serif text-sm sm:text-base font-bold text-white truncate max-w-xs">
          {test.title}
        </h2>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${
              timeLeft < 300
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-white/10 text-white border border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Question Navigation */}
        <div className="hidden md:flex flex-col w-56 bg-white dark:bg-[#0E1A2E] border-r border-slate-200 dark:border-white/10 p-4 overflow-y-auto flex-shrink-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
            Question Navigator
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;
              const isMarked = markedForReview.has(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-full aspect-square rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md'
                      : isAnswered
                      ? 'bg-emerald-500 text-white'
                      : isMarked
                      ? 'bg-amber-400 text-white'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600" />Current</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Answered ({answeredCount})</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400" />Marked</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-white/10" />Unanswered</div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          {currentQ && (
            <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
              {/* Question Number / Mark for review */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <button
                  onClick={() => {
                    const next = new Set(markedForReview);
                    if (next.has(currentQ.id)) next.delete(currentQ.id);
                    else next.add(currentQ.id);
                    setMarkedForReview(next);
                  }}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    markedForReview.has(currentQ.id)
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
                  }`}
                >
                  <BookMarked className="w-3.5 h-3.5" />
                  {markedForReview.has(currentQ.id) ? 'Marked' : 'Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-white/10 shadow-sm">
                <p className="text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed font-medium">
                  {currentQ.text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const labels = ['A', 'B', 'C', 'D'];
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))
                      }
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {labels[optIdx]}
                      </span>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? 'text-indigo-900 dark:text-indigo-100 font-medium'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-[#0E1A2E] border-t border-slate-200 dark:border-white/10">
        <button
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-xs text-slate-500 font-mono">
          {answeredCount}/{questions.length} answered
        </span>
        <button
          onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
          disabled={currentIdx === questions.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 disabled:opacity-40 cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentOnlineTestTab({
  studentPhone,
  studentName,
  enrolledCourseIds,
}: StudentOnlineTestTabProps) {
  const [tests, setTests] = useState<TestWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTest, setActiveTest] = useState<{
    test: LMSTest;
    attemptId: string;
    questions: Question[];
  } | null>(null);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [viewingResult, setViewingResult] = useState<TestAttempt | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lms/tests', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error fetching tests');

      const now = new Date();
      const publishedTests: LMSTest[] = (data.tests || []).filter(
        (t: LMSTest) =>
          t.isPublished &&
          (enrolledCourseIds.length === 0 || enrolledCourseIds.includes(t.courseId))
      );

      // For each test, check if student has attempted
      const withStatus: TestWithStatus[] = await Promise.all(
        publishedTests.map(async (t) => {
          let attempt: TestAttempt | undefined;
          try {
            const aRes = await fetch(
              `/api/lms/test-attempts?testId=${t.id}&studentPhone=${encodeURIComponent(studentPhone)}`
            );
            const aData = await aRes.json();
            if (aData.success && aData.attempt) attempt = aData.attempt;
          } catch {}

          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          let computedStatus: TestStatus;
          if (attempt && (attempt.status === 'submitted' || attempt.status === 'timed-out')) {
            computedStatus = 'Attempted';
          } else if (now < start) {
            computedStatus = 'Upcoming';
          } else if (now > end) {
            computedStatus = 'Expired';
          } else {
            computedStatus = 'Available';
          }

          return { ...t, computedStatus, attempt };
        })
      );

      setTests(withStatus);
    } catch (err: any) {
      setError(err.message || 'Could not load tests');
    } finally {
      setLoading(false);
    }
  }, [studentPhone, enrolledCourseIds.join(',')]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleStartTest = async (test: LMSTest) => {
    setStartingTestId(test.id);
    try {
      const res = await fetch('/api/lms/test-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id, studentPhone, studentName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not start test');
      setActiveTest({
        test,
        attemptId: data.attempt.id,
        questions: data.assignedQuestions || [],
      });
    } catch (err: any) {
      alert(err.message || 'Failed to start test. Please try again.');
    } finally {
      setStartingTestId(null);
    }
  };

  const handleTestSubmitted = () => {
    setActiveTest(null);
    fetchTests();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusConfig: Record<TestStatus, { label: string; classes: string }> = {
    Available: {
      label: 'Available',
      classes:
        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse',
    },
    Attempted: {
      label: 'Completed',
      classes: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
    },
    Expired: {
      label: 'Expired',
      classes: 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400',
    },
    Upcoming: {
      label: 'Upcoming',
      classes:
        'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
    },
  };

  if (activeTest) {
    return (
      <TestInterface
        test={activeTest.test}
        attemptId={activeTest.attemptId}
        questions={activeTest.questions}
        studentPhone={studentPhone}
        onSubmit={handleTestSubmitted}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0E1A2E] via-[#162D50] to-[#2E0E1A] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold">
              Online Examination Portal
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
            Online Tests &amp; Assessments
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1.5">
            Secure timed online tests assigned by faculty for your enrolled courses.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-sm text-slate-500">Loading tests…</span>
        </div>
      ) : error ? (
        <GlassCard variant="elevated" className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </GlassCard>
      ) : tests.length === 0 ? (
        <GlassCard variant="elevated" className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mb-2">
            No Tests Available
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No online tests have been published for your enrolled courses yet.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tests.map((test) => {
            const sc = statusConfig[test.computedStatus];
            return (
              <GlassCard key={test.id} variant="interactive" className="p-6 flex flex-col gap-4">
                {/* Badge Row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 uppercase">
                    {test.courseName}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sc.classes}`}>
                    ● {sc.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {test.title}
                </h3>

                {/* Meta Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Duration</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {test.durationMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Questions</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {test.questionsPerStudent}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Marks</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {test.questionsPerStudent * test.marksPerQuestion}
                    </span>
                  </div>
                </div>

                {/* Score if Attempted */}
                {test.computedStatus === 'Attempted' && test.attempt && (
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200/50 dark:border-indigo-700/30 flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300">Score:</span>
                    <span className="font-serif font-bold text-sm text-indigo-700 dark:text-indigo-300">
                      {test.attempt.score ?? '—'} / {test.attempt.maxScore ?? '—'} Marks
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Start: {formatDate(test.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    End: {formatDate(test.endDate)}
                  </span>
                </div>

                {/* Action Button */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/10">
                  {test.computedStatus === 'Available' && (
                    <button
                      onClick={() => handleStartTest(test)}
                      disabled={startingTestId === test.id}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {startingTestId === test.id ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting…</>
                      ) : (
                        <><ClipboardCheck className="w-3.5 h-3.5" /> Start Test</>
                      )}
                    </button>
                  )}
                  {test.computedStatus === 'Attempted' && (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold py-2">
                      <CheckCircle2 className="w-4 h-4" /> Test Completed
                    </div>
                  )}
                  {test.computedStatus === 'Expired' && (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium py-2">
                      <XCircle className="w-4 h-4" /> Test window has expired
                    </div>
                  )}
                  {test.computedStatus === 'Upcoming' && (
                    <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium py-2">
                      <Info className="w-4 h-4" /> Opens on {formatDate(test.startDate)}
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
