'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from 'lucide-react';
import ExamAdminAuthGate from '@/components/admin/ExamAdminAuthGate';
import { EventType, ParticipationMode } from '@/lib/examTypes';

function toIstInputDefault(offsetHours = 24) {
  const d = new Date(Date.now() + offsetHours * 3600 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateExamContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [eventType, setEventType] = useState<EventType>('online_cbt');
  const [participationMode, setParticipationMode] = useState<ParticipationMode>('online');
  const [category, setCategory] = useState('CLAT');
  const [targetAudience, setTargetAudience] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [contactPhones, setContactPhones] = useState('');

  // Step 2
  const [isFree, setIsFree] = useState(false);
  const [feeAmount, setFeeAmount] = useState('50');
  const [registrationOpenAt, setRegistrationOpenAt] = useState(toIstInputDefault(0));
  const [registrationCloseAt, setRegistrationCloseAt] = useState(toIstInputDefault(48));
  const [maxRegistrations, setMaxRegistrations] = useState('');
  const [eligibilityText, setEligibilityText] = useState('');

  // Step 3
  const [examDate, setExamDate] = useState(new Date(Date.now() + 72 * 3600 * 1000).toISOString().slice(0, 10));
  const [loginOpenAt, setLoginOpenAt] = useState(toIstInputDefault(71));
  const [startAt, setStartAt] = useState(toIstInputDefault(72));
  const [endAt, setEndAt] = useState(toIstInputDefault(74));
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [lateEntryGraceMinutes, setLateEntryGraceMinutes] = useState('15');
  const [autoSubmitAtExpiry, setAutoSubmitAtExpiry] = useState(true);
  const [reconnectPolicy, setReconnectPolicy] = useState<'allow_resume' | 'single_session_lock'>('allow_resume');

  // Step 4A: CBT
  const [totalQuestions, setTotalQuestions] = useState('50');
  const [marksPerQuestion, setMarksPerQuestion] = useState('1');
  const [negativeMarking, setNegativeMarking] = useState('0.25');
  const [passingMarks, setPassingMarks] = useState('');
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [disablePreviousNav, setDisablePreviousNav] = useState(false);
  const [requireFullscreen, setRequireFullscreen] = useState(true);
  const [tabSwitchThreshold, setTabSwitchThreshold] = useState('3');
  const [fullscreenExitThreshold, setFullscreenExitThreshold] = useState('3');
  const [autoSubmitOnViolation, setAutoSubmitOnViolation] = useState(false);

  // Step 4B: Offline Venue
  const [venueName, setVenueName] = useState('MSI Institute');
  const [fullAddress, setFullAddress] = useState('');
  const [reportingTime, setReportingTime] = useState('1:30 PM');
  const [checkInInstructions, setCheckInInstructions] = useState('');

  // Step 4C: Debate
  const [debateTheme, setDebateTheme] = useState('');
  const [debateFormat, setDebateFormat] = useState<'individual' | 'team' | 'both'>('individual');
  const [debatePrizes, setDebatePrizes] = useState('');

  const handleSubmit = async (publishImmediately: boolean) => {
    setError('');
    if (!title.trim() || !code.trim()) {
      setError('Title and unique Exam Code are required (Step 1).');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title,
        code,
        eventType,
        participationMode,
        category,
        targetAudience,
        description,
        instructions,
        contactPhones,
        publishImmediately,
        registrationConfig: {
          isFree,
          feeAmount: isFree ? 0 : Number(feeAmount || 0),
          currency: 'INR',
          registrationOpenAt: new Date(registrationOpenAt).toISOString(),
          registrationCloseAt: new Date(registrationCloseAt).toISOString(),
          maxRegistrations: maxRegistrations ? Number(maxRegistrations) : undefined,
          allowWebsiteRegistration: true,
          allowOfflineRegistration: true,
          eligibilityText,
          customFields: [],
        },
        scheduleConfig: {
          examDate,
          loginOpenAt: new Date(loginOpenAt).toISOString(),
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          durationMinutes: Number(durationMinutes || 60),
          timezone: 'Asia/Kolkata',
          lateEntryGraceMinutes: Number(lateEntryGraceMinutes || 15),
          autoSubmitAtExpiry,
          reconnectPolicy,
        },
      };

      if (eventType === 'online_cbt' || eventType === 'hybrid') {
        payload.cbtRules = {
          totalQuestions: Number(totalQuestions || 50),
          marksPerQuestion: Number(marksPerQuestion || 1),
          negativeMarking: Number(negativeMarking || 0),
          unansweredPolicy: 'zero',
          passingMarks: passingMarks ? Number(passingMarks) : undefined,
          randomizeQuestions,
          randomizeOptions,
          disablePreviousNav,
          requireFullscreen,
          tabSwitchThreshold: Number(tabSwitchThreshold || 3),
          fullscreenExitThreshold: Number(fullscreenExitThreshold || 3),
          autoSubmitOnViolation,
          webcamRequired: false,
        };
      }

      if (eventType === 'offline_mock' || eventType === 'hybrid') {
        payload.offlineVenue = {
          venueName,
          fullAddress,
          reportingTime,
          checkInInstructions,
        };
      }

      if (eventType === 'debate_competition') {
        payload.debateConfig = {
          theme: debateTheme,
          participationFormat: debateFormat,
          prizes: debatePrizes,
        };
      }

      const res = await fetch('/api/admin/examinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.exam?.id) {
        router.push(`/admin/online-examinations/${data.exam.id}`);
      } else {
        setError(data.message || 'Failed to create examination.');
      }
    } catch {
      setError('Network error while creating examination.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#071B37] pb-16">
      <header className="bg-white border-b border-[#E8EEFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/online-examinations"
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#89190E]">
                Reusable Examination &amp; Event Engine
              </span>
              <h1 className="font-serif font-bold text-xl text-[#071B37]">
                Create New Examination / Event
              </h1>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500">Step {step} of 5</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Stepper */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            '1. Identity',
            '2. Reg & Fee',
            '3. Schedule',
            '4. Rules',
            '5. Publish',
          ].map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(idx + 1)}
              className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center cursor-pointer transition-colors ${
                step === idx + 1
                  ? 'bg-[#071B37] text-white'
                  : step > idx + 1
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E8EEFF] p-6 sm:p-8 shadow-xs space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg">Step 1 — Event Identity &amp; Format</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Exam / Event Title *</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CLAT UG Scholarship Test 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Unique Code *</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CLAT-2026-01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => {
                      const v = e.target.value as EventType;
                      setEventType(v);
                      if (v === 'online_cbt') setParticipationMode('online');
                      else if (v === 'offline_mock') setParticipationMode('offline');
                      else if (v === 'hybrid') setParticipationMode('both');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="online_cbt">Online CBT Examination</option>
                    <option value="offline_mock">Offline Mock Test</option>
                    <option value="hybrid">Hybrid Event</option>
                    <option value="debate_competition">Debate / Competition</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Participation Mode</label>
                  <select
                    value={participationMode}
                    onChange={(e) => setParticipationMode(e.target.value as ParticipationMode)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="both">Both (Online + Offline)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="CLAT, Judiciary, UGC NET Law, UCC Debate..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Target Audience</label>
                  <input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. CLAT UG/PG Aspirants, Law Graduates"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Enquiry Phone Numbers</label>
                  <input
                    value={contactPhones}
                    onChange={(e) => setContactPhones(e.target.value)}
                    placeholder="e.g. 9634299858, 7508420013"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview displayed on the public registration page..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Important Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions displayed to candidates..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg">Step 2 — Registration &amp; Fee (INR)</h2>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-4 h-4 accent-[#89190E]"
                  />
                  Free Registration (No Razorpay Payment Required)
                </label>
              </div>

              {!isFree && (
                <div>
                  <label className="block text-xs font-bold mb-1">Registration Fee (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Registration Opens (IST)</label>
                  <input
                    type="datetime-local"
                    value={registrationOpenAt}
                    onChange={(e) => setRegistrationOpenAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Registration Closes (IST)</label>
                  <input
                    type="datetime-local"
                    value={registrationCloseAt}
                    onChange={(e) => setRegistrationCloseAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Maximum Capacity (Optional)</label>
                  <input
                    type="number"
                    value={maxRegistrations}
                    onChange={(e) => setMaxRegistrations(e.target.value)}
                    placeholder="Leave blank for unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Eligibility Criteria</label>
                  <input
                    value={eligibilityText}
                    onChange={(e) => setEligibilityText(e.target.value)}
                    placeholder="e.g. Class 10 onward, UG/PG Law Students"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg">Step 3 — Exam / Event Schedule (Asia/Kolkata)</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Event Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Login Window Opens</label>
                  <input
                    type="datetime-local"
                    value={loginOpenAt}
                    onChange={(e) => setLoginOpenAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Actual Start Time</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Hard End Time</label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Late-Entry Grace Period (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={lateEntryGraceMinutes}
                    onChange={(e) => setLateEntryGraceMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Reconnection Policy</label>
                  <select
                    value={reconnectPolicy}
                    onChange={(e) => setReconnectPolicy(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white"
                  >
                    <option value="allow_resume">Allow Resume on Same Attempt (Recommended)</option>
                    <option value="single_session_lock">Strict Single Session Lock</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSubmitAtExpiry}
                  onChange={(e) => setAutoSubmitAtExpiry(e.target.checked)}
                  className="w-4 h-4 accent-[#89190E]"
                />
                Automatically submit active attempts on server at expiry
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-serif font-bold text-lg">Step 4 — Event-Specific Settings</h2>

              {(eventType === 'online_cbt' || eventType === 'hybrid') && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-gray-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#89190E]">
                    Online CBT Rules &amp; Integrity
                  </h3>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Total Questions</label>
                      <input type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Marks / Q</label>
                      <input type="number" step="0.25" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Negative Marking</label>
                      <input type="number" step="0.25" value={negativeMarking} onChange={(e) => setNegativeMarking(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Passing Marks (Opt.)</label>
                      <input type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={randomizeQuestions} onChange={(e) => setRandomizeQuestions(e.target.checked)} className="w-4 h-4 accent-[#071B37]" />
                      Randomize question order per candidate
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} className="w-4 h-4 accent-[#071B37]" />
                      Randomize option order per attempt
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={disablePreviousNav} onChange={(e) => setDisablePreviousNav(e.target.checked)} className="w-4 h-4 accent-[#071B37]" />
                      Disable Previous button (Next-only lock)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={requireFullscreen} onChange={(e) => setRequireFullscreen(e.target.checked)} className="w-4 h-4 accent-[#071B37]" />
                      Require browser Fullscreen on Start Exam
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={autoSubmitOnViolation} onChange={(e) => setAutoSubmitOnViolation(e.target.checked)} className="w-4 h-4 accent-[#89190E]" />
                      Auto-submit if violation threshold exceeded
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Tab-Switch Warning Threshold</label>
                      <input type="number" min="1" value={tabSwitchThreshold} onChange={(e) => setTabSwitchThreshold(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Fullscreen-Exit Warning Threshold</label>
                      <input type="number" min="1" value={fullscreenExitThreshold} onChange={(e) => setFullscreenExitThreshold(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {(eventType === 'offline_mock' || eventType === 'hybrid') && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Offline Venue &amp; Check-In Details
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Venue Name</label>
                      <input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Reporting Time</label>
                      <input value={reportingTime} onChange={(e) => setReportingTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Full Venue Address</label>
                    <input value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="Complete MSI Institute address..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Check-In Instructions</label>
                    <input value={checkInInstructions} onChange={(e) => setCheckInInstructions(e.target.value)} placeholder="Carry UID & valid photo ID..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                  </div>
                </div>
              )}

              {eventType === 'debate_competition' && (
                <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Debate / Competition Configuration
                  </h3>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Theme / Topic</label>
                    <input value={debateTheme} onChange={(e) => setDebateTheme(e.target.value)} placeholder="e.g. Uniform Civil Code (UCC)" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Participation Format</label>
                      <select value={debateFormat} onChange={(e) => setDebateFormat(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white">
                        <option value="individual">Individual</option>
                        <option value="team">Team</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Prizes Summary</label>
                      <input value={debatePrizes} onChange={(e) => setDebatePrizes(e.target.value)} placeholder="1st ₹5,100, 2nd ₹3,100..." className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg">Step 5 — Review &amp; Save / Publish</h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 text-xs space-y-2">
                <div><strong>Title:</strong> {title || '—'}</div>
                <div><strong>Code:</strong> <span className="font-mono">{code || '—'}</span></div>
                <div><strong>Type &amp; Mode:</strong> {eventType} ({participationMode})</div>
                <div><strong>Fee:</strong> {isFree ? 'FREE' : `₹${feeAmount} INR`}</div>
                <div><strong>Exam Date &amp; Duration:</strong> {examDate} ({durationMinutes} mins)</div>
              </div>
              <p className="text-xs text-gray-500">
                Drafts remain private and cannot accept registrations. Publishing generates the public registration URL and QR code immediately. For Online CBT exams, you must upload and click <strong>Verify &amp; Publish Paper</strong> inside the Questions tab before candidates can start.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#071B37] text-[#071B37] font-bold text-xs hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#89190E] hover:bg-[#6e130b] text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Creating...' : 'Publish & Generate QR'}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="pt-4 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            {step < 5 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#071B37] text-white text-xs font-bold cursor-pointer"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <ExamAdminAuthGate>
      <CreateExamContent />
    </ExamAdminAuthGate>
  );
}
