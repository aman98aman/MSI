'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useParams } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  LogIn,
  MapPin,
  Printer,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { generateRegistrationConfirmationPdf } from '@/lib/examConfirmationPdf';
import RazorpayCheckoutModal, {
  RazorpayPaymentSuccessInfo,
} from '@/components/payments/RazorpayCheckoutModal';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PublicExamRegistrationPage() {
  const params = useParams<{ publicExamCode: string }>();
  const publicCode = params.publicExamCode;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [stream, setStream] = useState('');
  const [batchId, setBatchId] = useState('');
  const [participationMode, setParticipationMode] = useState<'online' | 'offline'>('online');
  const [institution, setInstitution] = useState('');
  const [city, setCity] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedUid, setConfirmedUid] = useState('');
  const [confirmedReg, setConfirmedReg] = useState<any>(null);
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState(false);
  const [pdfState, setPdfState] = useState<{
    generating: boolean;
    blobUrl: string;
    fileName: string;
    error: string;
  }>({ generating: false, blobUrl: '', fileName: '', error: '' });
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    order: any;
    feeAmount: number;
    uid?: string;
    registration?: any;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/exams/${encodeURIComponent(publicCode)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d?.exam?.participationMode === 'offline') setParticipationMode('offline');
      })
      .catch(() => setData({ unavailable: true, message: 'Unable to load examination.' }))
      .finally(() => setLoading(false));
  }, [publicCode]);

  const triggerPdfGeneration = async (regObj: any, uidVal: string, batchLabel?: string) => {
    if (!data?.exam || !uidVal) return;
    setPdfState({ generating: true, blobUrl: '', fileName: '', error: '' });
    try {
      const ex = data.exam;
      const resolvedBatch =
        batchLabel ||
        regObj?.customFieldValues?.stream ||
        (batches.find((b: any) => b.id === (regObj?.batchId || batchId))
          ? `${batches.find((b: any) => b.id === (regObj?.batchId || batchId)).batchCode} — ${batches.find((b: any) => b.id === (regObj?.batchId || batchId)).batchName}`
          : ex.category);

      const pdf = await generateRegistrationConfirmationPdf({
        uid: uidVal,
        fullName: regObj?.fullName || fullName,
        mobile: regObj?.mobile || mobile,
        email: regObj?.email || email,
        examTitle: ex.title,
        examCode: ex.code,
        courseOrStream: regObj?.customFieldValues?.stream || resolvedBatch || ex.category,
        assignedBatch: resolvedBatch,
        registeredAt: regObj?.confirmedAt || regObj?.registeredAt || new Date().toISOString(),
        examDate: ex.scheduleConfig?.examDate || '',
        durationMinutes: ex.scheduleConfig?.durationMinutes,
        participationMode: regObj?.participationMode || participationMode,
        venueText: ex.offlineVenue?.venueName
          ? `${ex.offlineVenue.venueName} ${ex.offlineVenue.fullAddress || ''}`.trim()
          : undefined,
        instructions: ex.instructions,
        contactPhones: ex.contactPhones,
      });

      setPdfState({ generating: false, blobUrl: pdf.blobUrl, fileName: pdf.fileName, error: '' });
      try {
        localStorage.setItem(
          `msi_exam_reg_${uidVal}`,
          JSON.stringify({ uid: uidVal, mobile: regObj?.mobile || mobile, savedAt: new Date().toISOString() })
        );
      } catch {}
    } catch {
      setPdfState({
        generating: false,
        blobUrl: '',
        fileName: '',
        error: 'Could not generate PDF automatically. Your registration is saved — click Retry PDF Generation.',
      });
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfState.blobUrl) return;
    const a = document.createElement('a');
    a.href = pdfState.blobUrl;
    a.download = pdfState.fileName || `MSI-Registration-${confirmedUid}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    const hasBatches = (data?.batches?.length || 0) > 0;
    if (hasBatches && !batchId) {
      setError('Please select a Mock Test Batch / Course to register.');
      return;
    }
    if (!hasBatches && !stream) {
      setError('Please select your target exam / stream.');
      return;
    }
    if (!consentAccepted) {
      setError('Please accept the declaration and examination rules.');
      return;
    }

    const selectedBatch = (data?.batches || []).find((b: any) => b.id === batchId);
    const resolvedStream = selectedBatch
      ? `${selectedBatch.batchCode} (${selectedBatch.batchName})`
      : stream;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${encodeURIComponent(publicCode)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          mobile,
          email,
          batchId: batchId || undefined,
          participationMode,
          institution,
          city,
          customFieldValues: { stream: resolvedStream },
        }),
      });
      const regData = await res.json();

      if (!res.ok || !regData.success) {
        setError(regData.message || 'Registration could not be completed.');
        setSubmitting(false);
        return;
      }

      if (!regData.requiresPayment) {
        setConfirmedUid(regData.uid);
        setConfirmedReg(regData.registration);
        setAlreadyRegisteredNotice(Boolean(regData.alreadyRegistered));
        setSubmitting(false);
        void triggerPdfGeneration(regData.registration, regData.uid, regData.batchName);
        return;
      }

      // Paid exam (e.g. ₹50): launch official MSI Razorpay Checkout Modal
      const fee =
        regData.order?.amount && regData.order.amount > 0
          ? regData.order.amount / 100
          : data?.exam?.registrationConfig?.feeAmount || 50;

      setCheckoutModal({
        isOpen: true,
        order: regData.order,
        feeAmount: fee,
        uid: regData.uid,
        registration: regData.registration,
      });
      setSubmitting(false);
    } catch {
      setError('Network error during registration.');
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (info: RazorpayPaymentSuccessInfo) => {
    const regUid = checkoutModal?.uid || `MSI-CLAT-${mobile.slice(-4)}`;
    const regObject = checkoutModal?.registration;
    setCheckoutModal(null);
    setSubmitting(true);

    try {
      const verifyRes = await fetch('/api/exams/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: info.razorpayOrderId,
          razorpay_payment_id: info.razorpayPaymentId,
          razorpay_signature: info.razorpaySignature,
        }),
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.success) {
        const finalUid = verifyData.uid || regUid;
        const finalReg = verifyData.registration || regObject;
        setConfirmedUid(finalUid);
        setConfirmedReg(finalReg);
        void triggerPdfGeneration(finalReg, finalUid);
      } else {
        setConfirmedUid(regUid);
        setConfirmedReg(regObject);
        void triggerPdfGeneration(regObject, regUid);
      }
    } catch {
      setConfirmedUid(regUid);
      setConfirmedReg(regObject);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center text-sm font-bold text-[#071B37]">
        Loading Examination Details...
      </div>
    );
  }

  if (!data || data.unavailable || !data.exam) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-[#071B37]">
            {data?.message || 'This examination is no longer available.'}
          </h1>
          {data?.exam?.cancellationReason && (
            <p className="text-xs text-rose-700 font-semibold">{data.exam.cancellationReason}</p>
          )}
          <p className="text-xs text-gray-500">
            Registrations and attempts for this examination are closed.
          </p>
          <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#071B37] text-white text-xs font-bold">
            Go to MSI Home
          </Link>
        </div>
      </div>
    );
  }

  const exam = data.exam;
  const batches = data.batches || [];

  if (confirmedUid) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4 print:bg-white print:p-0 print:min-h-0">
        <div
          id="exam-confirmation-slip"
          className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-emerald-200 text-center space-y-4 print:shadow-none print:border-2 print:border-[#071B37] print:max-w-full print:mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto print:border print:border-emerald-300">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-widest">
            {alreadyRegisteredNotice ? 'Already Registered • Existing Confirmation' : 'SUCCESSFULLY REGISTERED'}
          </span>
          <h1 className="font-serif font-bold text-2xl text-[#071B37]">{exam.title}</h1>
          {alreadyRegisteredNotice && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              A registration with this mobile/email already exists for this exam. Showing your existing Candidate UID &amp; confirmation.
            </p>
          )}
          <div className="p-4 rounded-2xl bg-[#071B37] text-white space-y-1 print:bg-[#071B37] print:text-white">
            <div className="text-[11px] uppercase tracking-wider text-[#EFC988]">Your Unique Candidate UID</div>
            <div className="font-mono font-bold text-2xl tracking-wider">{confirmedUid}</div>
          </div>
          <div className="text-left p-4 rounded-2xl bg-slate-50 border border-gray-200 text-xs flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div><strong>Candidate Name:</strong> {confirmedReg?.fullName || fullName}</div>
              <div><strong>Mobile:</strong> {confirmedReg?.mobile || mobile}</div>
              <div><strong>Email:</strong> {confirmedReg?.email || email}</div>
              {(confirmedReg?.customFieldValues?.stream || stream) && (
                <div><strong>Selected Mock Test / Batch:</strong> {confirmedReg?.customFieldValues?.stream || stream}</div>
              )}
              <div><strong>Exam Date:</strong> {exam.scheduleConfig?.examDate}</div>
              <div><strong>Duration:</strong> {exam.scheduleConfig?.durationMinutes} minutes</div>
              <div><strong>Mode:</strong> {confirmedReg?.participationMode}</div>
              {exam.offlineVenue?.venueName && (
                <div><strong>Venue:</strong> {exam.offlineVenue.venueName} {exam.offlineVenue.fullAddress}</div>
              )}
            </div>
            {confirmedReg?.photoUrl && (
              <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-[#071B37]/20 shrink-0 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={confirmedReg.photoUrl}
                  alt="Candidate Photograph"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          {pdfState.error && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2 print:hidden">
              <p>{pdfState.error}</p>
              <button
                type="button"
                onClick={() => triggerPdfGeneration(confirmedReg, confirmedUid)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#071B37] text-white font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry PDF Generation
              </button>
            </div>
          )}
          <p className="text-[11px] text-gray-500">
            Save or download your Registration Confirmation PDF. You will need your UID and registered mobile number to enter the examination.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2 print:hidden">
            <button
              type="button"
              disabled={pdfState.generating || !pdfState.blobUrl}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{pdfState.generating ? 'Generating PDF...' : 'Download Confirmation PDF'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Confirmation
            </button>
            {(exam.eventType === 'online_cbt' || exam.eventType === 'hybrid') && (
              <Link
                href={`/exam/login?examCode=${encodeURIComponent(exam.code)}&uid=${encodeURIComponent(confirmedUid)}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#89190E] text-white text-xs font-bold"
              >
                <LogIn className="w-4 h-4" />
                Go to Exam Login
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37] pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-[#071B37] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#89190E] text-white text-[10px] font-bold uppercase tracking-wider">
              {exam.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-[#EFC988] text-[10px] font-mono font-bold">
              {exam.code}
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-4xl">{exam.title}</h1>
          {exam.description && <p className="text-sm text-slate-300 max-w-2xl">{exam.description}</p>}

          <div className="pt-3 flex flex-wrap gap-4 text-xs text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#EFC988]" />
              Exam Date: {exam.scheduleConfig?.examDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#EFC988]" />
              Duration: {exam.scheduleConfig?.durationMinutes} mins
            </span>
            <span className="inline-flex items-center gap-1.5 font-bold text-[#EFC988]">
              <IndianRupee className="w-4 h-4" />
              Fee: {exam.registrationConfig?.isFree ? 'FREE' : `₹${exam.registrationConfig?.feeAmount} INR`}
            </span>
            {exam.offlineVenue?.venueName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#EFC988]" />
                {exam.offlineVenue.venueName}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 -mt-6 grid md:grid-cols-5 gap-6">
        {/* Left: Registration Form */}
        <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E8EEFF]">
          {!data.canRegister ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <h2 className="font-bold text-base">Registration Unavailable</h2>
              <p className="text-xs">{data.registrationMessage || 'Registration is currently closed.'}</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="font-serif font-bold text-xl">Candidate Registration</h2>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">Full Name *</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter candidate full name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">10-Digit Mobile Number *</label>
                  <input
                    required
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              {batches.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Select Mock Test Batch / Course * <span className="text-rose-600 font-normal">(Mandatory)</span>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {batches.map((b: any) => {
                      const isSelected = batchId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBatchId(b.id);
                            setStream(`${b.batchCode} (${b.batchName})`);
                          }}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#89190E] bg-[#89190E]/5 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-[#071B37]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-[#071B37]">
                              {b.batchCode}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#89190E] shrink-0" />
                            )}
                          </div>
                          <div className="text-xs font-semibold text-gray-700 mt-0.5">
                            {b.batchName}
                          </div>
                          {b.hasSubPapers && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              Paper 1 &amp; Paper 2 Included
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold mb-1">Target Exam / Stream *</label>
                  <select
                    required
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="">Select Your Target Exam</option>
                    <option value="CLAT (UG)">CLAT (UG)</option>
                    <option value="CLAT (PG)">CLAT (PG)</option>
                    <option value="AILET">AILET</option>
                    <option value="UGC NET (LAW)">UGC NET (LAW)</option>
                    <option value="JUDICIARY">JUDICIARY</option>
                    <option value="AIBE">AIBE</option>
                    <option value="ADA / APO">ADA / APO</option>
                  </select>
                </div>
              )}

              {exam.participationMode === 'both' && (
                <div>
                  <label className="block text-xs font-bold mb-1">Participation Mode</label>
                  <select
                    value={participationMode}
                    onChange={(e) => setParticipationMode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">School / College / Institution</label>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#89190E]"
                />
                <span>{exam.registrationConfig?.consentNotice}</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? 'Processing...'
                  : exam.registrationConfig?.isFree
                  ? 'Complete Free Registration'
                  : `Pay ₹${exam.registrationConfig?.feeAmount} & Register`}
              </button>
            </form>
          )}
        </div>

        {/* Right: Instructions & Already Registered */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-[#E8EEFF] space-y-3 text-xs">
            <h3 className="font-serif font-bold text-base">Important Details</h3>
            {exam.registrationConfig?.eligibilityText && (
              <div>
                <strong>Eligibility:</strong> {exam.registrationConfig.eligibilityText}
              </div>
            )}
            <div>
              <strong>Registration Deadline:</strong>{' '}
              {new Date(exam.registrationConfig?.registrationCloseAt).toLocaleString('en-IN')}
            </div>
            {exam.instructions && (
              <div className="pt-2 border-t border-gray-100 whitespace-pre-line text-gray-600">
                {exam.instructions}
              </div>
            )}
            {exam.contactPhones && (
              <div className="pt-2 border-t border-gray-100">
                <strong>Enquiries:</strong> {exam.contactPhones}
              </div>
            )}
          </div>

          {(exam.eventType === 'online_cbt' || exam.eventType === 'hybrid') && (
            <div className="bg-[#071B37] text-white rounded-3xl p-6 space-y-3">
              <h3 className="font-serif font-bold text-base text-[#EFC988]">Already Registered?</h3>
              <p className="text-xs text-slate-300">
                Enter your Candidate UID and registered mobile number to start your examination during the scheduled window.
              </p>
              <Link
                href={`/exam/login?examCode=${encodeURIComponent(exam.code)}`}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white text-xs font-bold"
              >
                <LogIn className="w-4 h-4" />
                Candidate Exam Login
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Official MSI Razorpay Checkout Modal */}
      {checkoutModal?.isOpen && data?.exam && (
        <RazorpayCheckoutModal
          isOpen={checkoutModal.isOpen}
          onClose={() => setCheckoutModal(null)}
          course={{
            id: data.exam.id,
            title: data.exam.title,
            price: checkoutModal.feeAmount,
            originalPrice: checkoutModal.feeAmount + 500,
          }}
          studentName={fullName}
          studentPhone={mobile}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
