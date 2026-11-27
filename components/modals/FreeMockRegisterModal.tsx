'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import PdfViewerModal from '@/components/modals/PdfViewerModal';

interface FreeMockRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategory?: string;
}

export default function FreeMockRegisterModal({
  isOpen,
  onClose,
  targetCategory = 'CLAT & Judiciary 2027',
}: FreeMockRegisterModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [stream, setStream] = useState('CLAT UG — 5-Year Integrated Law');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedUid, setConfirmedUid] = useState<string | null>(null);
  const [confirmedExamCode, setConfirmedExamCode] = useState<string>('CLAT-2027');
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = mobile.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Register candidate via official exam register API (never fake a UID on failure)
      const res = await fetch('/api/exams/free-mock-test-2027/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          mobile: cleanPhone,
          email,
          participationMode: 'online',
          customFieldValues: { stream },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.uid) {
        setError(data?.message || 'Unable to complete registration right now. Please try again.');
        return;
      }

      const generatedUid = String(data.uid);
      if (data.examCode) {
        setConfirmedExamCode(String(data.examCode));
      }

      // Store in browser storage so student is recognized across MSI portal
      if (typeof window !== 'undefined') {
        localStorage.setItem('msi_student_logged_in', 'true');
        localStorage.setItem('msi_active_student_phone', cleanPhone);
        localStorage.setItem('msi_active_student_name', fullName);
        localStorage.setItem('msi_active_student_uid', generatedUid);
        window.dispatchEvent(new Event('msi_student_auth_sync'));
      }

      setConfirmedUid(generatedUid);
    } catch {
      setError('Network error while connecting to server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartExam = () => {
    onClose();
    router.push(`/exam/login?examCode=${encodeURIComponent(confirmedExamCode)}&uid=${encodeURIComponent(confirmedUid || '')}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-lg bg-[#0E1B2E] text-white rounded-3xl border border-[#D4AF37]/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Subtle Ambient Decorative Glows */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#89190E]/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-[#D4AF37]/25 blur-2xl" />

          {/* Top Gradient Banner */}
          <div className="h-2 bg-gradient-to-r from-[#89190E] via-[#EFC988] to-[#89190E]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/15 border border-[#EFC988]/50 p-1 flex items-center justify-center shrink-0">
                <Image
                  src="/images/msi-crest.png"
                  alt="MSI Group of Institutes"
                  width={34}
                  height={34}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-[11px] font-serif font-bold tracking-wider uppercase text-[#EFC988]">
                  MSI Group of Institutes
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] font-extrabold tracking-widest uppercase text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    100% FREE ADMISSION MOCK
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    BATCH 2027
                  </span>
                </div>
              </div>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              Register for Free Mock Test
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Official Computer-Based Test (CBT) & Solved Model Paper with All-India Percentile Prediction.
            </p>
          </div>

          <div className="p-5 sm:p-6 pt-2 overflow-y-auto flex-1">
            {confirmedUid ? (
              /* Success / Candidate UID Issued Screen */
              <div className="text-center space-y-4 py-2 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
                    Registration Verified
                  </span>
                  <h4 className="font-serif text-xl font-bold text-white mt-2">
                    Candidate UID Generated!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Your free mock test seat has been reserved. Use this UID to enter the online CBT exam or view test materials.
                  </p>
                </div>

                {/* Candidate Pass Slip */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Candidate Name</span>
                    <span className="font-bold text-white">{fullName}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Mobile Number</span>
                    <span className="font-mono text-slate-200">{mobile}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Target Stream</span>
                    <span className="font-medium text-amber-300">{stream}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Candidate UID</span>
                    <span className="font-mono font-bold text-lg text-emerald-400 tracking-wider">
                      {confirmedUid}
                    </span>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => setIsPdfOpen(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Mock Test PDF</span>
                  </button>

                  <button
                    onClick={handleStartExam}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#89190E] hover:bg-[#6d130a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <span>Start Online CBT Test</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs font-bold text-rose-300">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Candidate Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. scholar@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Target Stream / Exam
                  </label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#10233F] border border-white/20 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="CLAT UG — 5-Year Integrated Law">
                      CLAT UG — 5-Year Integrated Law (NLUs)
                    </option>
                    <option value="CLAT PG — LL.M. Entrance 2027">
                      CLAT PG — LL.M. Entrance 2027
                    </option>
                    <option value="PCS J — Judiciary (Civil Judge)">
                      PCS J — Judiciary (Civil Judge)
                    </option>
                    <option value="AILET — NLU Delhi Specialized">
                      AILET — National Law University Delhi
                    </option>
                    <option value="PU Law Entrance — 3-Yr & 5-Yr LL.B">
                      PU Law Entrance (Panjab University Chandigarh)
                    </option>
                  </select>
                </div>

                {/* Free Deliverables Strip */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Candidate UID for online CBT exam room</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Immediate access to solved question paper PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Free performance scorecard & All-India rank mapping</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#89190E] via-[#a82417] to-[#89190E] hover:from-[#6d130a] hover:to-[#6d130a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#89190E]/40 hover:shadow-[#89190E]/60 transition-all cursor-pointer group disabled:opacity-50"
                >
                  {submitting ? (
                    'Generating Candidate UID...'
                  ) : (
                    <>
                      <span>Complete Free Registration</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Official MSI Institute Examination Registration • No Payment Required</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfOpen && (
        <PdfViewerModal
          isOpen={isPdfOpen}
          onClose={() => setIsPdfOpen(false)}
          pdfUrl="/uploads/notes/CLAT_PG_2027_Official_Mock_Test_Paper_MSI.pdf"
          title="All-India Mock Test 2027 Solved Paper"
          courseTitle="Free Mock Test Series"
        />
      )}
    </>
  );
}
