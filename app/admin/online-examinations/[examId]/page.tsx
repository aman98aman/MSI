'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Lock,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import ExamAdminAuthGate from '@/components/admin/ExamAdminAuthGate';

type DetailTab =
  | 'overview'
  | 'qr'
  | 'candidates'
  | 'consents'
  | 'questions'
  | 'monitoring'
  | 'attendance'
  | 'results'
  | 'audit';

function ExamDetailContent() {
  const params = useParams<{ examId: string }>();
  const examId = params.examId;

  const [tab, setTab] = useState<DetailTab>('overview');
  const [exam, setExam] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [qrData, setQrData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candSearch, setCandSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState('ALL');
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [paperVerified, setPaperVerified] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSubPaper, setSelectedSubPaper] = useState<'PAPER_1' | 'PAPER_2'>('PAPER_1');
  const [batchPaperStatuses, setBatchPaperStatuses] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [resultsPublished, setResultsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState('');

  // Batch form
  const [batchCode, setBatchCode] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchCapacity, setBatchCapacity] = useState('');
  const [batchHasSubPapers, setBatchHasSubPapers] = useState(false);

  // Offline registration modal
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offName, setOffName] = useState('');
  const [offMobile, setOffMobile] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offMode, setOffMode] = useState<'online' | 'offline'>('offline');
  const [offReceipt, setOffReceipt] = useState('');

  // Manual Question form
  const [qSection, setQSection] = useState('General');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [qMarks, setQMarks] = useState('1');
  const [qNegMarks, setQNegMarks] = useState('0.25');

  // Excel/CSV & PDF-assisted import preview
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [pdfRawText, setPdfRawText] = useState('');
  const [showPdfHelper, setShowPdfHelper] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadOverview = useCallback(async (retry = true) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/examinations/${examId}`);
      const data = await res.json();
      if (data.success && data.exam) {
        setExam(data.exam);
        const loadedBatches = data.batches || [];
        setBatches(loadedBatches);
        setSelectedBatchId((prev) => prev || loadedBatches[0]?.id || 'DEFAULT');
        setMetrics(data.metrics);
        setAuditLogs(data.auditLogs || []);
      } else if (res.status === 401) {
        window.location.reload();
        return;
      } else if (res.status === 404 && retry) {
        await new Promise((r) => setTimeout(r, 600));
        return loadOverview(false);
      } else {
        setLoadError(data.message || 'Examination not found.');
      }
    } catch {
      setLoadError('Unable to load examination details. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const loadQr = useCallback(async () => {
    const res = await fetch(`/api/admin/examinations/${examId}/qr`);
    const data = await res.json();
    if (data.success) setQrData(data);
  }, [examId]);

  const loadCandidates = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/examinations/${examId}/candidates?search=${encodeURIComponent(candSearch)}`
      );
      if (!res.ok) {
        console.error('[loadCandidates] HTTP error:', res.status);
        return;
      }
      const data = await res.json();
      if (data.success) setCandidates(data.candidates || []);
    } catch (err) {
      console.error('[loadCandidates] Fetch failed:', err);
    }
  }, [examId, candSearch]);

  const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);
  const isSelectedBatchSubPaper = Boolean(
    selectedBatchObj &&
      (selectedBatchObj.hasSubPapers ||
        /ugc[\s_-]*net/i.test(`${selectedBatchObj.batchCode} ${selectedBatchObj.batchName}`))
  );

  const loadQuestions = useCallback(async () => {
    const query = new URLSearchParams();
    if (selectedBatchId && selectedBatchId !== 'DEFAULT') {
      query.set('batchId', selectedBatchId);
      if (isSelectedBatchSubPaper) {
        query.set('subPaper', selectedSubPaper);
      }
    }
    const res = await fetch(`/api/admin/examinations/${examId}/questions?${query.toString()}`);
    const data = await res.json();
    if (data.success) {
      setQuestions(data.questions || []);
      setPaperVerified(Boolean(data.paperVerified));
      if (Array.isArray(data.batchPaperStatuses)) {
        setBatchPaperStatuses(data.batchPaperStatuses);
      }
    }
  }, [examId, selectedBatchId, isSelectedBatchSubPaper, selectedSubPaper]);

  const loadMonitoring = useCallback(async () => {
    const res = await fetch(`/api/admin/examinations/${examId}/attempts`);
    const data = await res.json();
    if (data.success) setAttempts(data.attempts || []);
  }, [examId]);

  const loadAttendance = useCallback(async () => {
    const res = await fetch(`/api/admin/examinations/${examId}/attendance`);
    const data = await res.json();
    if (data.success) setRoster(data.roster || []);
  }, [examId]);

  const loadResults = useCallback(async () => {
    const res = await fetch(`/api/admin/examinations/${examId}/results`);
    const data = await res.json();
    if (data.success) {
      setResults(data.results || []);
      setResultsPublished(Boolean(data.resultsPublished));
    }
  }, [examId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === 'qr') loadQr();
    else if (tab === 'candidates' || tab === 'consents') loadCandidates();
    else if (tab === 'questions') loadQuestions();
    else if (tab === 'monitoring') loadMonitoring();
    else if (tab === 'attendance') loadAttendance();
    else if (tab === 'results') loadResults();
  }, [tab, loadQr, loadCandidates, loadQuestions, loadMonitoring, loadAttendance, loadResults]);

  const handleLifecycle = async (action: string, label: string) => {
    if (!window.confirm(`Confirm: ${label}?`)) return;
    const res = await fetch(`/api/admin/examinations/${examId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`${label} successful.`);
      loadOverview();
    } else {
      showToast(data.message || 'Action failed.');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/examinations/${examId}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchCode,
        batchName,
        hasSubPapers: batchHasSubPapers,
        capacity: batchCapacity ? Number(batchCapacity) : undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setBatchCode('');
      setBatchName('');
      setBatchCapacity('');
      setBatchHasSubPapers(false);
      showToast('Batch added.');
      loadOverview();
    } else {
      showToast(data.message || 'Failed to add batch.');
    }
  };

  const handleToggleSubPapers = async (bId: string, currentVal: boolean) => {
    const res = await fetch(`/api/admin/examinations/${examId}/batches`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: bId, hasSubPapers: !currentVal }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(!currentVal ? 'Enabled Paper 1 & Paper 2 for batch.' : 'Disabled sub-papers for batch.');
      loadOverview();
    }
  };

  const handleOfflineEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/examinations/${examId}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: offName,
        mobile: offMobile,
        email: offEmail,
        participationMode: offMode,
        offlineReceiptRef: offReceipt,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Registered offline candidate! UID: ${data.uid}`);
      setShowOfflineModal(false);
      setOffName('');
      setOffMobile('');
      setOffEmail('');
      setOffReceipt('');
      loadCandidates();
      loadOverview();
    } else {
      showToast(data.message || 'Failed to register candidate.');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/examinations/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'manual',
        batchId: selectedBatchId && selectedBatchId !== 'DEFAULT' ? selectedBatchId : undefined,
        subPaper: isSelectedBatchSubPaper ? selectedSubPaper : undefined,
        section: qSection,
        text: qText,
        options: [
          { id: 'A', text: qOptA },
          { id: 'B', text: qOptB },
          { id: 'C', text: qOptC },
          { id: 'D', text: qOptD },
        ],
        correctOptionId: qCorrect,
        marks: Number(qMarks || 1),
        negativeMarks: Number(qNegMarks || 0),
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Question saved.');
      setQText('');
      setQOptA('');
      setQOptB('');
      setQOptC('');
      setQOptD('');
      loadQuestions();
    } else {
      showToast(data.message || 'Failed to save question.');
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    const parsed: any[] = [];
    const errs: string[] = [];

    rows.forEach((r, idx) => {
      const text = String(r.Question || r.question || '').trim();
      const optionA = String(r.OptionA || r.A || '').trim();
      const optionB = String(r.OptionB || r.B || '').trim();
      const optionC = String(r.OptionC || r.C || '').trim();
      const optionD = String(r.OptionD || r.D || '').trim();
      const correctOptionId = String(r.CorrectOption || r.Answer || '').trim().toUpperCase();

      if (!text || !optionA || !optionB || !optionC || !optionD || !['A', 'B', 'C', 'D'].includes(correctOptionId)) {
        errs.push(`Row ${idx + 2}: Missing question, options, or invalid CorrectOption (must be A/B/C/D).`);
      } else {
        parsed.push({
          section: String(r.Section || 'General').trim(),
          text,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOptionId,
          marks: Number(r.Marks ?? 1),
          negativeMarks: Number(r.NegativeMarks ?? 0),
          explanation: r.Explanation ? String(r.Explanation).trim() : '',
        });
      }
    });

    setImportPreview(parsed);
    setImportErrors(errs);
  };

  const handleParsePdfText = () => {
    // Assisted extraction of numbered MCQs from pasted PDF text into review queue (never guesses answers)
    const blocks = pdfRawText.split(/\n(?=\d+[\.\)]\s+)/g).filter((b) => b.trim());
    const extracted: any[] = [];
    blocks.forEach((blk) => {
      const lines = blk.split('\n').map((l) => l.trim()).filter(Boolean);
      const qLine = lines[0]?.replace(/^\d+[\.\)]\s*/, '') || '';
      const findOpt = (letter: string) => {
        const found = lines.find((l) => new RegExp(`^\\(?${letter}[\\)\\.]\\s+`, 'i').test(l));
        return found ? found.replace(new RegExp(`^\\(?${letter}[\\)\\.]\\s+`, 'i'), '') : '';
      };
      if (qLine) {
        extracted.push({
          section: 'PDF Extracted',
          text: qLine,
          optionA: findOpt('A'),
          optionB: findOpt('B'),
          optionC: findOpt('C'),
          optionD: findOpt('D'),
          correctOptionId: '', // Admin MUST explicitly verify and set!
          marks: Number(exam?.cbtRules?.marksPerQuestion ?? 1),
          negativeMarks: Number(exam?.cbtRules?.negativeMarking ?? 0),
        });
      }
    });
    setImportPreview(extracted);
    setImportErrors(
      extracted.length > 0
        ? ['Verify all extracted questions and select the Correct Option (A/B/C/D) for each row before committing.']
        : ['No numbered questions detected. Use format: 1. Question text / A) ... B) ... C) ... D) ...']
    );
  };

  const commitImportPreview = async () => {
    const invalid = importPreview.some(
      (r) => !r.text || !r.optionA || !r.optionB || !r.optionC || !r.optionD || !['A', 'B', 'C', 'D'].includes(r.correctOptionId)
    );
    if (invalid) {
      showToast('Every row must have all 4 options and a valid CorrectOption (A/B/C/D).');
      return;
    }

    const res = await fetch(`/api/admin/examinations/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'bulk',
        batchId: selectedBatchId && selectedBatchId !== 'DEFAULT' ? selectedBatchId : undefined,
        subPaper: isSelectedBatchSubPaper ? selectedSubPaper : undefined,
        questions: importPreview,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Imported ${data.importedCount} questions! Now click "Verify & Publish Paper".`);
      setImportPreview([]);
      setImportErrors([]);
      setShowPdfHelper(false);
      loadQuestions();
    } else {
      showToast(data.message || 'Bulk import failed.');
    }
  };

  const handleVerifyPaper = async () => {
    const res = await fetch(`/api/admin/examinations/${examId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'verify_and_publish',
        batchId: selectedBatchId && selectedBatchId !== 'DEFAULT' ? selectedBatchId : undefined,
        subPaper: isSelectedBatchSubPaper ? selectedSubPaper : undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('Question paper verified and published!');
      loadQuestions();
      loadOverview();
    } else {
      showToast(data.message || 'Verification failed.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question?')) return;
    const res = await fetch(
      `/api/admin/examinations/${examId}/questions?questionId=${encodeURIComponent(questionId)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.success) {
      showToast('Question deleted.');
      loadQuestions();
    } else {
      showToast(data.message || 'Failed to delete question.');
    }
  };

  const handleMarkAttendance = async (registrationId: string, status: 'present' | 'absent') => {
    const res = await fetch(`/api/admin/examinations/${examId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, status }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Marked ${status}.`);
      loadAttendance();
    }
  };

  const handleResultsAction = async (action: 're_evaluate' | 'publish_results') => {
    const res = await fetch(`/api/admin/examinations/${examId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(action === 'publish_results' ? 'Results published!' : `Re-evaluated ${data.evaluatedCount} attempts.`);
      loadResults();
      loadOverview();
    }
  };

  if (loading && !exam) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center text-sm font-bold text-[#071B37]">
        Loading examination console...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm font-bold text-rose-700">{loadError || 'Examination not found.'}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadOverview(true)}
            className="px-4 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
          <Link href="/admin/online-examinations" className="text-xs font-bold underline">
            Back to Examinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37] pb-16">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#071B37] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border border-[#EFC988]/40">
          {toast}
        </div>
      )}

      <header className="bg-white border-b border-[#E8EEFF] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/online-examinations" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#071B37] text-[#EFC988]">
                  {exam.code}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {String(exam.effectiveStatus).replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-[#071B37] mt-0.5">
                {exam.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {exam.effectiveStatus === 'draft' && (
              <button
                onClick={() => handleLifecycle('publish', 'Publish Examination')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Publish Now
              </button>
            )}
            {exam.effectiveStatus === 'registration_open' && (
              <button
                onClick={() => handleLifecycle('close_registration', 'Close Registration')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Close Registration
              </button>
            )}
            <Link
              href={`/exam/${exam.publicSlug}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50"
            >
              Open Public Page
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto border-t border-gray-100">
          {[
            { id: 'overview', label: 'Overview & Batches' },
            { id: 'qr', label: 'Link & QR Code' },
            { id: 'candidates', label: 'Candidates' },
            { id: 'consents', label: 'Consent Records' },
            ...(exam.eventType === 'online_cbt' || exam.eventType === 'hybrid'
              ? [
                  { id: 'questions', label: 'Questions & Key' },
                  { id: 'monitoring', label: 'Attempts & Violations' },
                ]
              : []),
            ...(exam.eventType === 'offline_mock' || exam.eventType === 'hybrid'
              ? [{ id: 'attendance', label: 'Offline Attendance' }]
              : []),
            { id: 'results', label: 'Results & Exports' },
            { id: 'audit', label: 'Audit History' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as DetailTab)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                tab === t.id
                  ? 'border-[#89190E] text-[#89190E]'
                  : 'border-transparent text-gray-500 hover:text-[#071B37]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Confirmed</span>
                  <div className="font-serif font-bold text-2xl mt-1">{metrics.confirmedRegistrations}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Pending Pay</span>
                  <div className="font-serif font-bold text-2xl text-amber-600 mt-1">{metrics.pendingRegistrations}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Revenue</span>
                  <div className="font-serif font-bold text-2xl mt-1">₹{metrics.totalRevenue.toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Submitted</span>
                  <div className="font-serif font-bold text-2xl text-emerald-700 mt-1">{metrics.submittedAttempts}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Active Now</span>
                  <div className="font-serif font-bold text-2xl text-rose-600 mt-1">{metrics.activeAttempts}</div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] space-y-2 text-xs">
                <h2 className="font-serif font-bold text-base mb-3">Configuration Summary</h2>
                <div><strong>Event Type:</strong> {exam.eventType} ({exam.participationMode})</div>
                <div><strong>Category:</strong> {exam.category}</div>
                <div><strong>Fee:</strong> {exam.registrationConfig?.isFree ? 'FREE' : `₹${exam.registrationConfig?.feeAmount} INR`}</div>
                <div><strong>Exam Date:</strong> {exam.scheduleConfig?.examDate} ({exam.scheduleConfig?.durationMinutes} mins)</div>
                <div><strong>Public URL:</strong> <span className="font-mono">/exam/{exam.publicSlug}</span></div>
                <div><strong>Paper Verified:</strong> {exam.paperVerified ? '✅ Verified & Published' : '⚠️ Pending Verification'}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E8EEFF] space-y-4">
                <h2 className="font-serif font-bold text-base">Batches / Sessions ({batches.length})</h2>
                <form onSubmit={handleCreateBatch} className="space-y-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={batchCode}
                      onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
                      placeholder="Code (CLATUG)"
                      required
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                    />
                    <input
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="Batch Name"
                      required
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold cursor-pointer"
                    >
                      + Add Batch
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchHasSubPapers}
                      onChange={(e) => setBatchHasSubPapers(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#89190E]"
                    />
                    <span>Enable Paper 1 &amp; Paper 2 sub-sections (e.g. UGC NET Law)</span>
                  </label>
                </form>
                <div className="space-y-2">
                  {batches.map((b) => {
                    const isSub = Boolean(b.hasSubPapers) || /ugc[\s_-]*net/i.test(`${b.batchCode} ${b.batchName}`);
                    return (
                      <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold">{b.batchCode}</span>
                          <span>{b.batchName}</span>
                          {isSub && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              Paper 1 &amp; Paper 2
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSubPapers(b.id, isSub)}
                            className="text-[10px] font-bold text-[#071B37] hover:underline cursor-pointer"
                          >
                            {isSub ? 'Disable Sub-Papers' : 'Enable Paper 1 & 2'}
                          </button>
                          <span className="text-[11px] text-gray-500">{b.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'qr' && qrData && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8EEFF] max-w-2xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold">
              <QrCode className="w-4 h-4 text-[#89190E]" />
              QR Version {qrData.qrVersion}
            </div>
            <h2 className="font-serif font-bold text-xl">{exam.title}</h2>
            <div className="flex justify-center">
              <img src={qrData.dataUrl} alt="Exam QR Code" className="w-64 h-64 rounded-2xl border border-gray-200 p-2 bg-white" />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="truncate">{qrData.publicUrl}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrData.publicUrl);
                  showToast('Registration URL copied!');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#071B37] text-white font-sans font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`/api/admin/examinations/${examId}/qr?format=png`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#89190E] text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </a>
              <a
                href={`/api/admin/examinations/${examId}/qr?format=svg`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#071B37] text-[#071B37] text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </a>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Sheet
              </button>
            </div>
          </div>
        )}

        {tab === 'candidates' && (() => {
          const STREAM_OPTIONS = [
            'CLAT (UG)',
            'CLAT (PG)',
            'AILET',
            'UGC NET (LAW)',
            'JUDICIARY',
            'AIBE',
            'ADA / APO',
          ];
          const streamCounts: Record<string, number> = {};
          STREAM_OPTIONS.forEach((s) => {
            streamCounts[s] = 0;
          });
          let unspecifiedCount = 0;
          candidates.forEach((c) => {
            const s = c.customFieldValues?.stream;
            if (s && streamCounts[s] !== undefined) {
              streamCounts[s] += 1;
            } else if (s) {
              streamCounts[s] = (streamCounts[s] || 0) + 1;
            } else {
              unspecifiedCount += 1;
            }
          });
          const filteredCandidates =
            streamFilter === 'ALL'
              ? candidates
              : streamFilter === 'UNSPECIFIED'
              ? candidates.filter((c) => !c.customFieldValues?.stream)
              : candidates.filter((c) => c.customFieldValues?.stream === streamFilter);

          return (
          <div className="space-y-4">
            {/* Stream-wise Registration Breakdown */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm text-[#071B37]">
                  Stream-wise Registrations ({candidates.length} Total)
                </h3>
                {streamFilter !== 'ALL' && (
                  <button
                    onClick={() => setStreamFilter('ALL')}
                    className="text-[11px] font-bold text-[#89190E] hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                <button
                  onClick={() => setStreamFilter('ALL')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    streamFilter === 'ALL'
                      ? 'bg-[#071B37] text-white border-[#071B37]'
                      : 'bg-slate-50 text-[#071B37] border-gray-200 hover:border-[#071B37]'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase opacity-75">All Streams</div>
                  <div className="font-serif font-bold text-xl mt-0.5">{candidates.length}</div>
                </button>
                {STREAM_OPTIONS.map((streamName) => (
                  <button
                    key={streamName}
                    onClick={() =>
                      setStreamFilter(streamFilter === streamName ? 'ALL' : streamName)
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      streamFilter === streamName
                        ? 'bg-[#89190E] text-white border-[#89190E]'
                        : 'bg-slate-50 text-[#071B37] border-gray-200 hover:border-[#89190E]'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase opacity-80 truncate">
                      {streamName}
                    </div>
                    <div className="font-serif font-bold text-xl mt-0.5">
                      {streamCounts[streamName] || 0}
                    </div>
                  </button>
                ))}
              </div>
              {unspecifiedCount > 0 && (
                <div className="text-[11px] text-gray-500">
                  + {unspecifiedCount} earlier registration(s) without stream selection.
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={candSearch}
                  onChange={(e) => setCandSearch(e.target.value)}
                  placeholder="Search by UID (MSI-...), name, mobile, or email..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowOfflineModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#89190E] text-white text-xs font-bold cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Offline Admin Entry
                </button>
                <a
                  href={`/api/admin/examinations/${examId}/candidates?export=xlsx`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  Export XLSX
                </a>
                <a
                  href={`/api/admin/examinations/${examId}/candidates?export=csv`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EEFF] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 border-b">
                    <th className="py-3 px-4">Photo &amp; UID</th>
                    <th className="py-3 px-4">Name &amp; Contact</th>
                    <th className="py-3 px-4">Target Stream</th>
                    <th className="py-3 px-4">Consent</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Attempt</th>
                    <th className="py-3 px-4">Score / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCandidates.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-10 rounded-lg overflow-hidden bg-slate-100 border border-gray-200 shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                            {c.photoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={c.photoUrl} alt={c.fullName} className="w-full h-full object-cover" />
                            ) : (
                              'N/A'
                            )}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-[#89190E]">{c.uid || 'PENDING'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold">{c.fullName}</div>
                        <div className="text-[11px] text-gray-500">{c.mobile} • {c.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {c.customFieldValues?.stream ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#F0F3FF] text-[#071B37] font-bold text-[11px]">
                            {c.customFieldValues.stream}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.consentStatus === 'accepted' ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Accepted
                            </span>
                            {c.consentAcceptedAt && (
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(c.consentAcceptedAt).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase text-[11px]">{c.paymentStatus}</span>
                        <div className="text-[11px] text-gray-500">₹{c.feeAmount}</div>
                      </td>
                      <td className="py-3 px-4 capitalize">{String(c.attemptStatus).replace('_', ' ')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span>
                            {c.rawScore !== undefined ? <strong>{c.rawScore}</strong> : '—'}
                            {c.violationCount > 0 && (
                              <span className="ml-1 text-[11px] text-rose-600 font-bold">({c.violationCount} flags)</span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateDetail(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#071B37] text-white text-[10px] font-bold cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        No candidates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {tab === 'consents' && (() => {
          const acceptedCount = candidates.filter((c) => c.consentStatus === 'accepted').length;
          const pendingCount = candidates.length - acceptedCount;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Total Registered</span>
                  <div className="font-serif font-bold text-2xl mt-1">{candidates.length}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Consent Accepted</span>
                  <div className="font-serif font-bold text-2xl text-emerald-700 mt-1">{acceptedCount}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                  <span className="text-[10px] font-bold uppercase text-gray-400">Consent Pending</span>
                  <div className="font-serif font-bold text-2xl text-amber-600 mt-1">{pendingCount}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF]">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    value={candSearch}
                    onChange={(e) => setCandSearch(e.target.value)}
                    placeholder="Search consent records by UID, name, mobile, or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E8EEFF] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 border-b">
                      <th className="py-3 px-4">Photo &amp; Student</th>
                      <th className="py-3 px-4">Registration ID / UID</th>
                      <th className="py-3 px-4">Exam / Batch</th>
                      <th className="py-3 px-4">Consent Status</th>
                      <th className="py-3 px-4">Accepted Date &amp; Time</th>
                      <th className="py-3 px-4 text-right">Record</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {candidates.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-10 rounded-lg overflow-hidden bg-slate-100 border border-gray-200 shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                              {c.photoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={c.photoUrl} alt={c.fullName} className="w-full h-full object-cover" />
                              ) : (
                                'N/A'
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#071B37]">{c.fullName}</div>
                              <div className="text-[11px] text-gray-500">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-[#89190E]">{c.uid || 'PENDING'}</div>
                          <div className="text-[10px] text-gray-400">{c.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold">{exam.title}</div>
                          <div className="text-[11px] text-gray-500">{c.customFieldValues?.stream || '—'}</div>
                        </td>
                        <td className="py-3 px-4">
                          {c.consentStatus === 'accepted' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Accepted ({c.consentVersion || 'v1.0'})
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-gray-600">
                          {c.consentAcceptedAt ? new Date(c.consentAcceptedAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidateDetail(c)}
                            className="px-3 py-1.5 rounded-lg bg-[#071B37] text-white text-[11px] font-bold cursor-pointer"
                          >
                            View Consent &amp; Photo
                          </button>
                        </td>
                      </tr>
                    ))}
                    {candidates.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-400">
                          No registered students yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {tab === 'questions' && (
          <div className="space-y-6">
            {/* Batch / Course Question Paper Selector */}
            {batches.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEFF] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#071B37]">
                      1. Select Batch / Course Question Paper
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Each batch has its own separate question paper. Select a batch below to add, upload, or publish its questions.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {batches.map((b) => {
                    const st = batchPaperStatuses.find((s) => s.batchId === b.id);
                    const isActive = selectedBatchId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBatchId(b.id);
                          setSelectedSubPaper('PAPER_1');
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#89190E] bg-[#89190E]/5 shadow-sm'
                            : 'border-gray-200 bg-slate-50/70 hover:border-[#071B37]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-[#071B37]">{b.batchCode}</span>
                          {st?.verified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-gray-700 mt-0.5">{b.batchName}</div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          {st ? `${st.questionCount} question(s)` : 'Select to manage'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-paper Tabs for UGC NET Law */}
                {isSelectedBatchSubPaper && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#89190E] mb-2">
                      2. Select Sub-Paper for {selectedBatchObj?.batchCode} ({selectedBatchObj?.batchName})
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { code: 'PAPER_1' as const, label: 'Paper 1 (General / Teaching & Research)' },
                        { code: 'PAPER_2' as const, label: 'Paper 2 (Law Subject Paper)' },
                      ].map((sp) => {
                        const batchStatus = batchPaperStatuses.find((s) => s.batchId === selectedBatchId);
                        const subStatus = batchStatus?.subStatuses?.find((x: any) => x.subPaper === sp.code);
                        const active = selectedSubPaper === sp.code;
                        return (
                          <button
                            key={sp.code}
                            type="button"
                            onClick={() => setSelectedSubPaper(sp.code)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                              active
                                ? 'bg-[#071B37] text-white border-[#071B37]'
                                : 'bg-white text-[#071B37] border-gray-200 hover:border-[#071B37]'
                            }`}
                          >
                            <span>{sp.label}</span>
                            {subStatus && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  subStatus.verified
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-200'
                                } ${!active ? (subStatus.verified ? '!bg-emerald-100 !text-emerald-800' : '!bg-amber-100 !text-amber-800') : ''}`}
                              >
                                {subStatus.questionCount} Qs • {subStatus.verified ? 'Published' : 'Unverified'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-[#E8EEFF] flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-bold text-base flex flex-wrap items-center gap-2">
                  <span>
                    {selectedBatchObj ? `${selectedBatchObj.batchCode} (${selectedBatchObj.batchName})` : 'Exam'}
                    {isSelectedBatchSubPaper ? ` — ${selectedSubPaper === 'PAPER_1' ? 'Paper 1' : 'Paper 2'}` : ''}
                    {' '}• Paper v{exam.activePaperVersion} ({questions.length} questions)
                  </span>
                  {paperVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      VERIFIED &amp; PUBLISHED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      UNVERIFIED
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">
                  Answer keys are stored server-side only and never sent to candidate browsers.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/admin/examinations/${examId}/questions?template=xlsx`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel Template
                </a>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer hover:bg-gray-50">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Excel/CSV
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelFileChange} className="hidden" />
                </label>
                <button
                  onClick={() => setShowPdfHelper((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
                >
                  PDF Text Helper
                </button>
                <button
                  onClick={handleVerifyPaper}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify Questions &amp; Publish Paper
                </button>
              </div>
            </div>

            {showPdfHelper && (
              <div className="bg-white p-5 rounded-2xl border border-indigo-200 space-y-3">
                <h3 className="font-bold text-xs uppercase text-indigo-900">
                  PDF-Assisted Question Extraction Review Queue
                </h3>
                <textarea
                  rows={5}
                  value={pdfRawText}
                  onChange={(e) => setPdfRawText(e.target.value)}
                  placeholder="Paste text extracted from PDF (e.g. 1. Question text... A) Opt 1 B) Opt 2 C) Opt 3 D) Opt 4)"
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono"
                />
                <button
                  onClick={handleParsePdfText}
                  className="px-4 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold cursor-pointer"
                >
                  Extract into Review Preview
                </button>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">Import Review Preview ({importPreview.length} rows)</h3>
                  <button
                    onClick={commitImportPreview}
                    className="px-4 py-2 rounded-xl bg-[#89190E] text-white text-xs font-bold cursor-pointer"
                  >
                    Commit Verified Questions
                  </button>
                </div>
                {importErrors.map((err, i) => (
                  <div key={i} className="text-xs text-rose-700 font-semibold">{err}</div>
                ))}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importPreview.map((row, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex-1 min-w-[240px]">
                        <strong>Q{idx + 1}:</strong> {row.text}
                        <div className="text-[11px] text-gray-500">
                          A: {row.optionA} | B: {row.optionB} | C: {row.optionC} | D: {row.optionD}
                        </div>
                      </div>
                      <select
                        value={row.correctOptionId}
                        onChange={(e) => {
                          const copy = [...importPreview];
                          copy[idx] = { ...copy[idx], correctOptionId: e.target.value };
                          setImportPreview(copy);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-300 font-bold bg-white"
                      >
                        <option value="">Select Answer*</option>
                        <option value="A">Correct: A</option>
                        <option value="B">Correct: B</option>
                        <option value="C">Correct: C</option>
                        <option value="D">Correct: D</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Add Form */}
            <form onSubmit={handleAddQuestion} className="bg-white p-5 rounded-2xl border border-[#E8EEFF] space-y-3">
              <h3 className="font-serif font-bold text-sm">Add Single Question Manually</h3>
              <div className="grid sm:grid-cols-4 gap-3">
                <input value={qSection} onChange={(e) => setQSection(e.target.value)} placeholder="Section" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <input type="number" step="0.25" value={qMarks} onChange={(e) => setQMarks(e.target.value)} placeholder="Marks" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <input type="number" step="0.25" value={qNegMarks} onChange={(e) => setQNegMarks(e.target.value)} placeholder="Neg Marks" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <select value={qCorrect} onChange={(e) => setQCorrect(e.target.value as any)} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white">
                  <option value="A">Correct: Option A</option>
                  <option value="B">Correct: Option B</option>
                  <option value="C">Correct: Option C</option>
                  <option value="D">Correct: Option D</option>
                </select>
              </div>
              <textarea required rows={2} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Question text..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs" />
              <div className="grid sm:grid-cols-2 gap-2.5">
                <input required value={qOptA} onChange={(e) => setQOptA(e.target.value)} placeholder="Option A" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <input required value={qOptB} onChange={(e) => setQOptB(e.target.value)} placeholder="Option B" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <input required value={qOptC} onChange={(e) => setQOptC(e.target.value)} placeholder="Option C" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
                <input required value={qOptD} onChange={(e) => setQOptD(e.target.value)} placeholder="Option D" className="px-3 py-2 rounded-xl border border-gray-200 text-xs" />
              </div>
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </form>

            {/* Questions List */}
            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-2xl border border-[#E8EEFF] text-xs flex justify-between gap-4">
                  <div>
                    <div className="font-bold text-[#071B37]">
                      Q{idx + 1}. [{q.section}] {q.text}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-gray-600">
                      {q.options?.map((o: any) => (
                        <span key={o.id} className={o.id === q.correctOptionId ? 'font-bold text-emerald-700' : ''}>
                          {o.id}) {o.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <span className="font-mono font-bold text-emerald-700">Key: {q.correctOptionId}</span>
                    <div className="text-[11px] text-gray-400">+{q.marks} / -{q.negativeMarks}</div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'monitoring' && (
          <div className="bg-white rounded-2xl border border-[#E8EEFF] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 border-b">
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Violations</th>
                  <th className="py-3 px-4">Started / Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 font-mono font-bold">{a.uid}</td>
                    <td className="py-3 px-4">{a.fullName} ({a.mobile})</td>
                    <td className="py-3 px-4 uppercase font-bold text-[11px]">{a.status}</td>
                    <td className="py-3 px-4">Q{(a.currentIndex || 0) + 1} / {a.questionSequence?.length || 0}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${a.violationCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {a.violationCount || 0} total
                      </span>
                      <div className="text-[10px] text-gray-400">
                        FS: {a.fullscreenExitCount || 0} • Tab: {a.tabSwitchCount || 0} • Blur: {a.windowBlurCount || 0}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-gray-500">
                      {new Date(a.startedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400">No CBT attempts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'attendance' && (
          <div className="bg-white rounded-2xl border border-[#E8EEFF] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 border-b">
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Check-In Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((r) => (
                  <tr key={r.registrationId}>
                    <td className="py-3 px-4 font-mono font-bold">{r.uid}</td>
                    <td className="py-3 px-4">{r.fullName} • {r.mobile}</td>
                    <td className="py-3 px-4 capitalize">{r.participationMode}</td>
                    <td className="py-3 px-4 uppercase font-bold">{r.attendanceStatus}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleMarkAttendance(r.registrationId, 'present')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(r.registrationId, 'absent')}
                        className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold cursor-pointer"
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E8EEFF] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold">
                Publication Status:{' '}
                <span className={resultsPublished ? 'text-emerald-700' : 'text-amber-600'}>
                  {resultsPublished ? 'PUBLISHED TO CANDIDATES' : 'HIDDEN (ADMIN REVIEW ONLY)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleResultsAction('re_evaluate')}
                  className="px-3.5 py-2 rounded-xl border border-[#071B37] text-xs font-bold cursor-pointer"
                >
                  Re-evaluate All
                </button>
                {!resultsPublished && (
                  <button
                    onClick={() => handleResultsAction('publish_results')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Publish Results
                  </button>
                )}
                <a
                  href={`/api/admin/examinations/${examId}/results?export=xlsx`}
                  className="px-3.5 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold"
                >
                  Export XLSX
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E8EEFF] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F0F3FF] text-[10px] uppercase font-bold text-gray-500 border-b">
                    <th className="py-3 px-4">UID</th>
                    <th className="py-3 px-4">Candidate</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Correct / Wrong / Skip</th>
                    <th className="py-3 px-4">Violations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r.attemptId}>
                      <td className="py-3 px-4 font-mono font-bold">{r.uid}</td>
                      <td className="py-3 px-4">{r.fullName}</td>
                      <td className="py-3 px-4 font-bold">{r.rawScore} / {r.maxScore} ({r.percentage}%)</td>
                      <td className="py-3 px-4">{r.correctCount} / {r.wrongCount} / {r.unansweredCount}</td>
                      <td className="py-3 px-4">{r.violationCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-white rounded-2xl border border-[#E8EEFF] p-5 space-y-2.5">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-50 text-xs flex justify-between gap-4">
                <div>
                  <span className="font-mono font-bold text-[#89190E] mr-2">{log.action}</span>
                  <span>{log.summary}</span>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {log.actorName} • {new Date(log.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Candidate Photo & Consent Record Detail Modal */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-gray-200 shrink-0 flex items-center justify-center text-xs text-gray-400">
                  {selectedCandidateDetail.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={selectedCandidateDetail.photoUrl}
                      alt={selectedCandidateDetail.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    'No Photo'
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-mono font-bold text-[#89190E]">{selectedCandidateDetail.uid}</div>
                  <h3 className="font-serif font-bold text-xl text-[#071B37]">
                    {selectedCandidateDetail.fullName}
                  </h3>
                  <div className="text-gray-600">
                    {selectedCandidateDetail.mobile} • {selectedCandidateDetail.email}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Registration ID: <span className="font-mono">{selectedCandidateDetail.id}</span>
                  </div>
                  {selectedCandidateDetail.customFieldValues?.stream && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F0F3FF] text-[#071B37] font-bold text-[10px]">
                      {selectedCandidateDetail.customFieldValues.stream}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-serif font-bold text-sm text-[#071B37]">
                  Examination Consent Record
                </h4>
                {selectedCandidateDetail.consentStatus === 'accepted' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Accepted on{' '}
                    {selectedCandidateDetail.consentAcceptedAt
                      ? new Date(selectedCandidateDetail.consentAcceptedAt).toLocaleString('en-IN')
                      : ''}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    Consent Pending (Not Yet Accepted)
                  </span>
                )}
              </div>

              {selectedCandidateDetail.consentStatement ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-xs text-[#071B37] whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
                  {selectedCandidateDetail.consentStatement}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  This student has not accepted the mandatory Declaration &amp; Consent form yet. They will be required to accept it before starting the examination.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Admin Entry Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleOfflineEntry} className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg">Offline Admin Candidate Entry</h3>
            <input required value={offName} onChange={(e) => setOffName(e.target.value)} placeholder="Full Name *" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input required value={offMobile} onChange={(e) => setOffMobile(e.target.value)} placeholder="10-Digit Mobile *" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <input required type="email" value={offEmail} onChange={(e) => setOffEmail(e.target.value)} placeholder="Email Address *" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <select value={offMode} onChange={(e) => setOffMode(e.target.value as any)} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
              <option value="offline">Offline Participation</option>
              <option value="online">Online Participation</option>
            </select>
            <input value={offReceipt} onChange={(e) => setOffReceipt(e.target.value)} placeholder="Manual Cash / UPI Receipt Ref (Optional)" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm" />
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowOfflineModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#89190E] text-white text-xs font-bold cursor-pointer">Confirm &amp; Issue UID</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ExamDetailPage() {
  return (
    <ExamAdminAuthGate>
      <ExamDetailContent />
    </ExamAdminAuthGate>
  );
}
