'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Maximize2,
  ShieldAlert,
} from 'lucide-react';

function formatSeconds(sec: number): string {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(rem)}` : `${pad(m)}:${pad(rem)}`;
}

export default function CandidateAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params.attemptId;

  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [advancing, setAdvancing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningBanner, setWarningBanner] = useState('');
  const [fsSupported, setFsSupported] = useState(true);
  const [starting, setStarting] = useState(false);

  const isStartedRef = useRef(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/state`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to load examination session.');
        return;
      }
      setState(data);
      setRemainingSeconds(data.remainingSeconds || 0);
      setSelectedOptionId(data.currentQuestion?.selectedOptionId || null);
      isStartedRef.current = data.attemptStatus === 'in_progress';
    } catch {
      setError('Connection error loading examination state.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    setFsSupported(Boolean(document.documentElement?.requestFullscreen));
    fetchState();
  }, [fetchState]);

  // Server-synchronized countdown timer
  useEffect(() => {
    if (state?.attemptStatus !== 'in_progress') return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Trigger server auto-submit
          fetch(`/api/exams/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoSubmit: true, reason: 'Timer expired' }),
          }).then(() => fetchState());
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.attemptStatus, attemptId, fetchState]);

  // Log proctor event helper
  const logProctorEvent = useCallback(
    async (eventType: string, metadata?: Record<string, any>) => {
      if (!isStartedRef.current) return;
      try {
        const res = await fetch(`/api/exams/attempts/${attemptId}/proctor-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, metadata }),
        });
        const data = await res.json();
        if (data.autoSubmitted) {
          fetchState();
        } else if (data.violationCount) {
          setWarningBanner(
            `Warning recorded (${eventType.replace(/_/g, ' ')}). Total flags: ${data.violationCount}.`
          );
        }
      } catch {}
    },
    [attemptId, fetchState]
  );

  // Fullscreen, tab-switch, window blur & copy/paste deterrents
  useEffect(() => {
    if (state?.attemptStatus !== 'in_progress') return;

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && isStartedRef.current) {
        logProctorEvent('fullscreen_exited');
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden && isStartedRef.current) {
        logProctorEvent('tab_hidden');
      }
    };
    const onWindowBlur = () => {
      if (isStartedRef.current) {
        logProctorEvent('window_blurred');
      }
    };
    const blockAction = (e: Event) => {
      e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('contextmenu', blockAction);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('contextmenu', blockAction);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [state?.attemptStatus, logProctorEvent]);

  const handleStartExam = async () => {
    setError('');
    setStarting(true);

    // Must request fullscreen directly inside Start Exam click handler (user gesture)
    if (state?.rules?.requireFullscreen) {
      if (!document.documentElement.requestFullscreen) {
        setError('Fullscreen mode is required for this examination, but your browser does not support it.');
        setStarting(false);
        return;
      }
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        setError('Fullscreen permission was denied. Please allow fullscreen to start the examination.');
        setStarting(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/start`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchState();
      } else {
        setError(data.message || 'Unable to start examination.');
      }
    } catch {
      setError('Network error starting examination.');
    } finally {
      setStarting(false);
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (!state?.currentQuestion) return;
    setSelectedOptionId(optionId);
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: state.currentQuestion.id,
          selectedOptionId: optionId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus('saved');
      } else if (data.expired) {
        await fetchState();
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleNavigate = async (direction: 'next' | 'prev' | 'jump', targetIndex?: number) => {
    if (!state?.currentQuestion) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/exams/attempts/${attemptId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentIndex: state.currentIndex,
          selectedOptionId,
          direction,
          targetIndex,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.reachedEnd) {
          setShowSubmitModal(true);
        } else {
          setSaveStatus('idle');
          await fetchState();
        }
      } else {
        await fetchState();
      }
    } finally {
      setAdvancing(false);
    }
  };

  const handleNext = () => handleNavigate('next');
  const handlePrevious = () => handleNavigate('prev');

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/exams/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: state?.currentQuestion?.id,
          selectedOptionId,
        }),
      });
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      setShowSubmitModal(false);
      await fetchState();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071B37] text-white flex items-center justify-center text-sm font-bold">
        Loading Examination Workspace...
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-200 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h1 className="font-serif font-bold text-xl text-[#071B37]">Session Error</h1>
          <p className="text-xs text-rose-700">{error}</p>
          <Link href="/exam/login" className="inline-block px-5 py-2.5 rounded-xl bg-[#071B37] text-white text-xs font-bold">
            Return to Candidate Login
          </Link>
        </div>
      </div>
    );
  }

  // Submitted / Auto-submitted Receipt
  if (state?.attemptStatus === 'submitted' || state?.attemptStatus === 'auto_submitted') {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-emerald-200 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
            {state.attemptStatus === 'auto_submitted' ? 'Auto-Submitted' : 'Examination Submitted'}
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#071B37]">
            {state.examTitle}
            {state.subPaperLabel ? ` — ${state.subPaperLabel}` : ''}
          </h1>
          <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-xs space-y-1.5">
            <div><strong>Candidate UID:</strong> <span className="font-mono font-bold">{state.uid}</span></div>
            {state.subPaperLabel && <div><strong>Paper:</strong> {state.subPaperLabel}</div>}
            <div><strong>Total Questions:</strong> {state.totalQuestions}</div>
            <div><strong>Submitted At:</strong> {new Date(state.submittedAt).toLocaleString('en-IN')}</div>
          </div>
          {state.resultsPublished && state.publishedResult ? (
            <div className="p-4 rounded-2xl bg-[#071B37] text-white text-xs space-y-1">
              <div className="text-[#EFC988] font-bold uppercase">Published Result</div>
              <div className="text-2xl font-serif font-bold">
                {state.publishedResult.rawScore} / {state.publishedResult.maxScore} ({state.publishedResult.percentage}%)
              </div>
              <div>
                Correct: {state.publishedResult.correctCount} • Wrong: {state.publishedResult.wrongCount} • Skipped: {state.publishedResult.unansweredCount}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Your responses have been securely recorded. Results will be visible once published by MSI Super Admin.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {state.hasSubPapers && (
              <Link
                href="/exam/papers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold"
              >
                <span>Back to Paper 1 / Paper 2 Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#071B37] text-white text-xs font-bold">
              Return to MSI Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Start Rules & Compatibility Check Screen
  if (state?.attemptStatus === 'not_started') {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E8EEFF] space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#89190E]">
                Candidate UID: {state.uid}
              </span>
              <h1 className="font-serif font-bold text-2xl text-[#071B37]">{state.examTitle}</h1>
            </div>
            <div className="text-right text-xs font-bold">
              <div>{state.totalQuestions} Questions</div>
              <div className="text-gray-500">{state.durationMinutes} Minutes</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[#89190E]" />
              Fullscreen &amp; Integrity Notice
            </div>
            <p>
              Your examination will run in fullscreen mode. Exiting fullscreen or switching tabs may be recorded as a violation.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use <strong>Previous</strong>, <strong>Save &amp; Next</strong>, or the Question Palette to navigate and review your answers anytime before submitting.</li>
              <li>Marking Scheme: +{state.rules?.marksPerQuestion} per correct answer, -{state.rules?.negativeMarking} per wrong answer.</li>
              <li>Your answers autosave automatically and remain safe on refresh or reconnection.</li>
            </ul>
          </div>

          {state.instructions && (
            <div className="text-xs text-gray-600 whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-gray-200">
              {state.instructions}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 text-xs flex items-center justify-between">
            <span>Browser Fullscreen API Support:</span>
            <span className={fsSupported ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>
              {fsSupported ? '✅ Supported' : '❌ Not Supported'}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={handleStartExam}
            disabled={starting}
            className="w-full py-3.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white font-bold text-sm shadow-lg cursor-pointer disabled:opacity-50"
          >
            {starting ? 'Starting Examination...' : 'Start Exam (Enter Fullscreen)'}
          </button>
        </div>
      </div>
    );
  }

  // Active CBT Screen
  const q = state?.currentQuestion;
  const isLastQuestion = state && state.currentIndex + 1 >= state.totalQuestions;

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37] select-none flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#071B37] text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="text-[10px] font-mono text-[#EFC988]">{state?.uid}</div>
          <h1 className="font-serif font-bold text-sm sm:text-base">{state?.examTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-[11px] bg-white/10 px-3 py-1.5 rounded-xl">
            <span>Attempted: <strong>{state?.attemptedCount}</strong></span>
            <span>Skipped: <strong>{state?.unansweredCount}</strong></span>
            <span>Remaining: <strong>{state?.remainingCount}</strong></span>
          </div>
          <div
            className={`px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-1.5 ${
              remainingSeconds < 300 ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#EFC988] text-[#071B37]'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatSeconds(remainingSeconds)}
          </div>
        </div>
      </header>

      {warningBanner && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {warningBanner}
          </span>
          <button
            onClick={() => {
              setWarningBanner('');
              document.documentElement.requestFullscreen?.().catch(() => {});
            }}
            className="underline cursor-pointer"
          >
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* Question Card & Palette */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 grid lg:grid-cols-4 gap-5 items-start">
        <div className="lg:col-span-3">
        {q ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8EEFF] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#89190E]">
                {state.subPaperLabel ? `${state.subPaperLabel} • ` : ''}Question {state.currentIndex + 1} of {state.totalQuestions} • {q.section}
              </span>
              <span className="text-[11px] font-semibold text-gray-500">
                +{q.marks} / -{q.negativeMarks}
              </span>
            </div>

            <div className="text-base sm:text-lg font-semibold leading-relaxed text-[#071B37]">
              {q.text}
            </div>

            <div className="space-y-3">
              {q.options?.map((opt: any, idx: number) => {
                const isSelected = selectedOptionId === opt.id;
                const label = ['A', 'B', 'C', 'D'][idx] || opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#89190E] bg-rose-50/60 text-[#071B37]'
                        : 'border-gray-200 hover:border-[#071B37]/40 bg-white'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-[#89190E] text-white' : 'bg-slate-100 text-[#071B37]'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-sm font-medium pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-semibold text-gray-500">
                {saveStatus === 'saving' && 'Saving answer...'}
                {saveStatus === 'saved' && '✓ Answer autosaved'}
                {saveStatus === 'error' && (
                  <span className="text-rose-600">Save failed — click option again to retry</span>
                )}
                {saveStatus === 'idle' && 'Use Previous / Next to navigate'}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {state.currentIndex > 0 && (
                  <button
                    type="button"
                    disabled={advancing}
                    onClick={handlePrevious}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#071B37] text-[#071B37] hover:bg-slate-50 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                )}
                {!isLastQuestion ? (
                  <button
                    type="button"
                    disabled={advancing}
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#071B37] hover:bg-[#0e2d57] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    <span>{advancing ? 'Saving...' : 'Save & Next'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold cursor-pointer"
                  >
                    Submit Examination
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-sm font-bold">
            No active question found.
          </div>
        )}
        </div>

        {/* Question Palette Sidebar */}
        <aside className="bg-white rounded-3xl p-5 shadow-lg border border-[#E8EEFF] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h2 className="font-serif font-bold text-sm text-[#071B37]">Question Palette</h2>
            <span className="text-[11px] font-bold text-gray-500">
              {state?.attemptedCount || 0}/{state?.totalQuestions || 0}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
            {(state?.questionStatuses || []).map((qs: { index: number; answered: boolean }) => {
              const isCurrent = qs.index === state.currentIndex;
              return (
                <button
                  key={qs.index}
                  type="button"
                  disabled={advancing}
                  onClick={() => handleNavigate('jump', qs.index)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#071B37] text-white ring-2 ring-[#EFC988]'
                      : qs.answered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}
                >
                  {qs.index + 1}
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-400 inline-block" />
              <span>Answered</span>
              <span className="w-3 h-3 rounded bg-slate-200 inline-block ml-2" />
              <span>Unanswered</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold cursor-pointer"
            >
              Finish &amp; Submit Paper
            </button>
          </div>
        </aside>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <h2 className="font-serif font-bold text-xl text-[#071B37]">
              Submit Examination?
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to submit your examination? You will not be able to make further changes.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
