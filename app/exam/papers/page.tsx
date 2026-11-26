'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';

interface SubPaperItem {
  subPaper: 'PAPER_1' | 'PAPER_2';
  label: string;
  subtitle: string;
  questionCount: number;
  verified: boolean;
  status: 'available' | 'in_progress' | 'submitted' | 'locked' | 'unavailable';
  lockReason: string;
  attemptId: string | null;
  submittedAt: string | null;
  publishedResult: {
    rawScore: number;
    maxScore: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
  } | null;
}

export default function ExamPapersHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    uid: string;
    fullName: string;
    examTitle: string;
    batchCode?: string;
    batchName?: string;
    durationMinutes?: number;
    papers: SubPaperItem[];
  } | null>(null);
  const [startingPaper, setStartingPaper] = useState<string | null>(null);

  const loadPapers = useCallback(async () => {
    try {
      const res = await fetch('/api/exams/papers');
      const d = await res.json();
      if (!res.ok || !d.success) {
        setError(d.message || 'Please login first to view your examination papers.');
        return;
      }
      if (!d.hasSubPapers) {
        router.replace('/exam/login');
        return;
      }
      setData(d);
    } catch {
      setError('Connection error loading examination papers.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const handleOpenPaper = async (subPaper: 'PAPER_1' | 'PAPER_2') => {
    setError('');
    setStartingPaper(subPaper);
    try {
      const res = await fetch('/api/exams/papers/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subPaper }),
      });
      const d = await res.json();
      if (res.ok && d.success && d.attemptId) {
        router.push(`/exam/attempt/${d.attemptId}`);
      } else {
        setError(d.message || 'Unable to open selected paper.');
        await loadPapers();
      }
    } catch {
      setError('Network error opening paper.');
    } finally {
      setStartingPaper(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071B37] text-white flex items-center justify-center text-sm font-bold">
        Loading Paper Portal...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-200 text-center space-y-4">
          <h1 className="font-serif font-bold text-xl text-[#071B37]">Session Required</h1>
          <p className="text-xs text-rose-700 font-semibold">{error}</p>
          <Link
            href="/exam/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#89190E] text-white text-xs font-bold"
          >
            Go to Candidate Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37] pb-16">
      <header className="bg-[#071B37] text-white py-8 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#89190E] text-white text-[10px] font-bold uppercase tracking-wider">
                {data?.batchCode || 'UGC NET LAW'} • {data?.batchName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#EFC988] text-[10px] font-mono font-bold">
                {data?.uid}
              </span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl">{data?.examTitle}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Welcome, <strong>{data?.fullName}</strong>. Select Paper 1 or Paper 2 below to begin.
            </p>
          </div>
          {data?.durationMinutes && (
            <div className="px-4 py-2 rounded-2xl bg-white/10 text-xs font-bold flex items-center gap-2 text-[#EFC988]">
              <Clock className="w-4 h-4" />
              <span>{data.durationMinutes} Mins / Paper</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-4 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-2.5 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#89190E] shrink-0 mt-0.5" />
          <div>
            <strong>Paper Locking Rule:</strong> You can attempt <strong>Paper 1</strong> or <strong>Paper 2</strong> in any order. Once you start one paper, the other paper remains locked until you submit the active paper. After submitting, the second paper unlocks automatically.
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {data?.papers.map((paper) => {
            const isSubmitted = paper.status === 'submitted';
            const isInProgress = paper.status === 'in_progress';
            const isLocked = paper.status === 'locked';
            const isUnavailable = paper.status === 'unavailable';
            const canOpen = paper.status === 'available' || isInProgress;

            return (
              <div
                key={paper.subPaper}
                className={`bg-white rounded-3xl p-6 sm:p-7 shadow-lg border-2 flex flex-col justify-between gap-5 ${
                  isInProgress
                    ? 'border-[#89190E]'
                    : isSubmitted
                    ? 'border-emerald-300'
                    : isLocked || isUnavailable
                    ? 'border-gray-200 opacity-85'
                    : 'border-[#E8EEFF]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#071B37] text-[#EFC988] text-[11px] font-bold">
                      <BookOpen className="w-3.5 h-3.5" />
                      {paper.label}
                    </span>
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SUBMITTED
                      </span>
                    )}
                    {isInProgress && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-[#89190E] text-[10px] font-bold">
                        IN PROGRESS
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <Lock className="w-3 h-3" />
                        LOCKED
                      </span>
                    )}
                    {isUnavailable && (
                      <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                        NOT PUBLISHED
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-serif font-bold text-xl text-[#071B37]">{paper.label}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{paper.subtitle}</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 text-xs flex items-center justify-between">
                    <span className="text-gray-600">Total Questions</span>
                    <strong className="text-[#071B37]">{paper.questionCount} Questions</strong>
                  </div>

                  {paper.lockReason && (isLocked || isUnavailable) && (
                    <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-100">
                      {paper.lockReason}
                    </p>
                  )}

                  {isSubmitted && paper.publishedResult && (
                    <div className="p-3.5 rounded-2xl bg-[#071B37] text-white text-xs space-y-1">
                      <div className="text-[#EFC988] font-bold uppercase text-[10px]">Published Score</div>
                      <div className="font-serif font-bold text-lg">
                        {paper.publishedResult.rawScore} / {paper.publishedResult.maxScore} ({paper.publishedResult.percentage}%)
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Correct: {paper.publishedResult.correctCount} • Wrong: {paper.publishedResult.wrongCount} • Skipped: {paper.publishedResult.unansweredCount}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {canOpen ? (
                    <button
                      type="button"
                      disabled={startingPaper === paper.subPaper}
                      onClick={() => handleOpenPaper(paper.subPaper)}
                      className="w-full py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>
                        {startingPaper === paper.subPaper
                          ? 'Opening...'
                          : isInProgress
                          ? `Resume ${paper.label}`
                          : `Start ${paper.label}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : isSubmitted && paper.attemptId ? (
                    <Link
                      href={`/exam/attempt/${paper.attemptId}`}
                      className="w-full py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      View Submission Receipt
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      {isLocked ? 'Locked Until Active Paper Submitted' : 'Unavailable'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
