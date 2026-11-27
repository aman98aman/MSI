import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import {
  findOneExamDoc,
  getExamDb,
  insertAuditLog,
  listExamCollection,
  upsertExamDoc,
} from '@/lib/examDb';
import { generateCandidateUid } from '@/lib/examUid';
import { isValidIndianPhone, sanitizeIndianPhone } from '@/lib/smsService';
import {
  ExamAttempt,
  ExamAttendance,
  ExamCandidate,
  ExamConsentRecord,
  ExamEvent,
  ExamPayment,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  const paymentStatus = (searchParams.get('paymentStatus') || '').trim();
  const mode = (searchParams.get('mode') || '').trim();
  const exportType = (searchParams.get('export') || '').trim().toLowerCase();

  const db = await getExamDb();
  let registrations: ExamRegistration[] = [];
  let payments: ExamPayment[] = [];
  let attempts: ExamAttempt[] = [];
  let attendances: ExamAttendance[] = [];
  let consents: ExamConsentRecord[] = [];
  let candidates: ExamCandidate[] = [];

  if (db) {
    const cleanDocs = <T>(docs: any[]): T[] =>
      docs.map(({ _id, ...rest }) => rest as T);

    const [regDocs, payDocs, attDocs, atnDocs, conDocs] = await Promise.all([
      db.collection('exam_registrations').find({ examId }).sort({ registeredAt: -1 }).toArray(),
      db.collection('exam_payments').find({ examId }).toArray(),
      db.collection('exam_attempts').find({ examId }).toArray(),
      db.collection('exam_attendance').find({ examId }).toArray(),
      db.collection('exam_consents').find({ examId }).toArray(),
    ]);

    registrations = cleanDocs<ExamRegistration>(regDocs);
    payments = cleanDocs<ExamPayment>(payDocs);
    attempts = cleanDocs<ExamAttempt>(attDocs);
    attendances = cleanDocs<ExamAttendance>(atnDocs);
    consents = cleanDocs<ExamConsentRecord>(conDocs);

    const candIds = Array.from(new Set(registrations.map((r) => r.candidateId).filter(Boolean)));
    if (candIds.length > 0) {
      const candDocs = await db
        .collection('exam_candidates')
        .find({ id: { $in: candIds } })
        .toArray();
      candidates = cleanDocs<ExamCandidate>(candDocs);
    }
  } else {
    [registrations, payments, attempts, attendances, consents, candidates] = await Promise.all([
      listExamCollection<ExamRegistration>('exam_registrations', { examId }, { registeredAt: -1 }),
      listExamCollection<ExamPayment>('exam_payments', { examId }),
      listExamCollection<ExamAttempt>('exam_attempts', { examId }),
      listExamCollection<ExamAttendance>('exam_attendance', { examId }),
      listExamCollection<ExamConsentRecord>('exam_consents', { examId }),
      listExamCollection<ExamCandidate>('exam_candidates', {}),
    ]);
  }

  let rows = registrations.map((reg) => {
    const payment = payments.find((p) => p.registrationId === reg.id);
    const attempt = attempts.find((a) => a.registrationId === reg.id);
    const attendance = attendances.find((at) => at.registrationId === reg.id);
    const consent = consents.find((c) => c.registrationId === reg.id);
    const candidateProfile = candidates.find((c) => c.id === reg.candidateId);
    const rawPhoto = reg.photoUrl || candidateProfile?.photoUrl || '';
    // Prevent oversized base64 data URLs from blowing past Vercel's 4.5MB serverless payload limit
    const safePhotoUrl =
      rawPhoto.startsWith('data:') && rawPhoto.length > 50_000 ? '' : rawPhoto;
    return {
      ...reg,
      photoUrl: safePhotoUrl,
      consentStatus: consent?.accepted ? 'accepted' : 'pending',
      consentAcceptedAt: consent?.acceptedAt || null,
      consentVersion: consent?.consentVersion || null,
      consentStatement: consent?.consentStatement || null,
      consentId: consent?.id || null,
      paymentMethod: payment?.method || (reg.feeAmount === 0 ? 'free' : 'pending'),
      razorpayOrderId: payment?.razorpayOrderId,
      razorpayPaymentId: payment?.razorpayPaymentId,
      offlineReceiptRef: payment?.offlineReceiptRef,
      attemptId: attempt?.id,
      attemptStatus: attempt?.status || 'not_started',
      startedAt: attempt?.startedAt,
      submittedAt: attempt?.submittedAt,
      rawScore: attempt?.rawScore,
      violationCount: attempt?.violationCount || 0,
      attendanceStatus: attendance?.status || 'unmarked',
      checkedInAt: attendance?.checkedInAt,
    };
  });

  if (paymentStatus && paymentStatus !== 'all') {
    rows = rows.filter((r) => r.paymentStatus === paymentStatus);
  }
  if (mode && mode !== 'all') {
    rows = rows.filter((r) => r.participationMode === mode);
  }
  if (search) {
    rows = rows.filter(
      (r) =>
        (r.uid || '').toLowerCase().includes(search) ||
        r.fullName.toLowerCase().includes(search) ||
        r.mobile.includes(search) ||
        r.email.toLowerCase().includes(search)
    );
  }

  if (exportType === 'xlsx' || exportType === 'csv') {
    const exportData = rows.map((r) => ({
      UID: r.uid || 'PENDING',
      'Full Name': r.fullName,
      Mobile: r.mobile,
      Email: r.email,
      Mode: r.participationMode,
      Source: r.source,
      'Registration Status': r.registrationStatus,
      'Payment Status': r.paymentStatus,
      'Fee (INR)': r.feeAmount,
      'Payment Ref': r.razorpayPaymentId || r.offlineReceiptRef || '',
      'Attempt Status': r.attemptStatus,
      Score: r.rawScore ?? '',
      Violations: r.violationCount,
      Attendance: r.attendanceStatus,
      'Registered At': r.registeredAt,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    await insertAuditLog({
      entityType: 'registration',
      entityId: examId,
      examId,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: `EXPORT_CANDIDATES_${exportType.toUpperCase()}`,
      summary: `Exported ${exportData.length} candidate records for ${exam.code}`,
    });

    if (exportType === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${exam.code}-candidates.csv"`,
        },
      });
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${exam.code}-candidates.xlsx"`,
      },
    });
  }

  return NextResponse.json({ success: true, candidates: rows });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const fullName = String(body.fullName || '').trim();
  const mobile = sanitizeIndianPhone(String(body.mobile || ''));
  const email = String(body.email || '').trim().toLowerCase();
  const batchId = body.batchId ? String(body.batchId).trim() : undefined;
  const participationMode: 'online' | 'offline' =
    body.participationMode === 'offline' ? 'offline' : 'online';
  const offlineReceiptRef = String(body.offlineReceiptRef || '').trim();
  const offlineMethod =
    body.paymentMethod === 'offline_upi' || body.paymentMethod === 'offline_bank'
      ? body.paymentMethod
      : 'offline_cash';

  if (!fullName || !isValidIndianPhone(mobile) || !email) {
    return NextResponse.json(
      { success: false, message: 'Full name, valid 10-digit mobile, and email are required.' },
      { status: 400 }
    );
  }

  const existingRegs = await listExamCollection<ExamRegistration>('exam_registrations', { examId });
  if (existingRegs.some((r) => r.mobile === mobile && r.registrationStatus === 'confirmed')) {
    return NextResponse.json(
      { success: false, message: 'Candidate with this mobile number is already registered for this exam.' },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  let candidate = await findOneExamDoc<ExamCandidate>('exam_candidates', { mobile });
  const uid = candidate?.uid || (await generateCandidateUid(exam.code));

  if (!candidate) {
    candidate = {
      id: `CND-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      uid,
      fullName,
      mobile,
      email,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await upsertExamDoc('exam_candidates', candidate);
  } else if (!candidate.uid) {
    candidate = { ...candidate, uid, updatedAt: nowIso };
    await upsertExamDoc('exam_candidates', candidate);
  }

  const feeAmount = exam.registrationConfig.isFree
    ? 0
    : Number(body.amountPaid ?? exam.registrationConfig.feeAmount);

  const registration: ExamRegistration = {
    id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    examId,
    batchId,
    candidateId: candidate.id,
    uid,
    fullName,
    mobile,
    email,
    participationMode,
    source: 'offline_admin',
    registrationStatus: 'confirmed',
    paymentStatus: feeAmount > 0 ? 'verified' : 'free',
    feeAmount,
    operatorId: admin.actorId,
    registeredAt: nowIso,
    confirmedAt: nowIso,
  };

  await upsertExamDoc('exam_registrations', registration);

  if (feeAmount > 0) {
    const payment: ExamPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      examId,
      registrationId: registration.id,
      candidateId: candidate.id,
      uid,
      amount: feeAmount,
      currency: 'INR',
      method: offlineMethod,
      status: 'verified',
      offlineReceiptRef: offlineReceiptRef || `OFFLINE-${Date.now().toString().slice(-6)}`,
      operatorId: admin.actorId,
      createdAt: nowIso,
      verifiedAt: nowIso,
    };
    await upsertExamDoc('exam_payments', payment);
  }

  await insertAuditLog({
    entityType: 'registration',
    entityId: registration.id,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: 'OFFLINE_ADMIN_REGISTRATION',
    summary: `Offline admin entry for ${fullName} (${uid}), fee ₹${feeAmount}, ref: ${offlineReceiptRef || 'N/A'}`,
  });

  return NextResponse.json({ success: true, registration, uid }, { status: 201 });
}
