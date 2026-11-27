'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Download, KeyRound, ShieldCheck } from 'lucide-react';
import { generateRegistrationConfirmationPdf } from '@/lib/examConfirmationPdf';

function CandidateLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uid, setUid] = useState(searchParams.get('uid') || '');
  const [mobile, setMobile] = useState('');
  const [examCode, setExamCode] = useState(searchParams.get('examCode') || '');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadConfirmationPdf = async () => {
    setError('');
    if (!uid.trim() && !mobile.trim()) {
      setError('Enter your Candidate UID or registered 10-digit mobile number to download your Confirmation PDF.');
      return;
    }
    setDownloadingPdf(true);
    try {
      const q = new URLSearchParams();
      if (uid.trim()) q.set('uid', uid.trim().toUpperCase());
      if (mobile.trim()) q.set('mobile', mobile.trim());
      const res = await fetch(`/api/exams/lookup?${q.toString()}`);
      const d = await res.json();
      if (!res.ok || !d.success || !d.registration) {
        setError(d.message || 'No confirmed registration found.');
        return;
      }
      const reg = d.registration;
      const pdf = await generateRegistrationConfirmationPdf({
        uid: reg.uid,
        fullName: reg.fullName,
        mobile: reg.mobile,
        email: reg.email,
        examTitle: d.exam?.title || 'MSI Examination',
        examCode: d.exam?.code,
        courseOrStream: reg.customFieldValues?.stream || d.batchName || d.exam?.category || 'General',
        assignedBatch: d.batchName || reg.customFieldValues?.stream || 'General',
        registeredAt: reg.confirmedAt || reg.registeredAt,
        examDate: d.exam?.examDate || '',
        durationMinutes: d.exam?.durationMinutes,
        participationMode: reg.participationMode,
        instructions: d.exam?.instructions,
        contactPhones: d.exam?.contactPhones,
      });
      const a = document.createElement('a');
      a.href = pdf.blobUrl;
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError('Unable to download Confirmation PDF right now.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/exams/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, mobile, examCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.hasSubPapers) {
          router.push(data.redirectTo || '/exam/papers');
        } else if (data.attemptId) {
          router.push(`/exam/attempt/${data.attemptId}`);
        } else {
          setError('Unable to locate your examination attempt.');
        }
      } else {
        setError(data.message || 'Unable to verify candidate credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071B37] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-[#E8EEFF]">
        <div className="w-12 h-12 rounded-2xl bg-[#89190E] text-white flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#89190E]">
          MSI Group of Institutes
        </span>
        <h1 className="font-serif font-bold text-2xl text-[#071B37] mt-0.5">
          Candidate Examination Login
        </h1>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Enter your unique Candidate UID and registered 10-digit mobile number.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#071B37] mb-1">Candidate UID *</label>
            <input
              required
              value={uid}
              onChange={(e) => setUid(e.target.value.toUpperCase())}
              placeholder="e.g. MSI-CLAT26-26-0001"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#071B37] mb-1">
              Registered Mobile Number *
            </label>
            <input
              required
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#071B37] mb-1">
              Exam Code (Optional if registered for multiple exams)
            </label>
            <input
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase())}
              placeholder="e.g. CLAT-2026-01"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Verifying...' : 'Proceed to Exam Instructions'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleDownloadConfirmationPdf}
            className="w-full py-2.5 rounded-xl border border-[#071B37]/20 hover:bg-slate-50 text-[#071B37] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#89190E]" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Registration Confirmation PDF'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Server-Authoritative CBT
          </span>
          <Link href="/" className="font-bold text-[#071B37] hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CandidateLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#071B37]" />}>
      <CandidateLoginForm />
    </Suspense>
  );
}
