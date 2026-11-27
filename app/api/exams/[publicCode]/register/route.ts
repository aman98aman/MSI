import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/examAuth';
import { findOneExamDoc, insertAuditLog, listExamCollection, upsertExamDoc } from '@/lib/examDb';
import { canAcceptRegistration } from '@/lib/examLifecycle';
import { generateCandidateUid } from '@/lib/examUid';
import { getRazorpayClient, getRazorpayCredentials } from '@/lib/razorpay';
import { isValidIndianPhone, sanitizeIndianPhone } from '@/lib/smsService';
import {
  ExamBatch,
  ExamCandidate,
  ExamEvent,
  ExamPayment,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ publicCode: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`reg_${ip}`, 20, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many requests. Please try again in ${rate.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { publicCode } = await context.params;
    const cleanSlug = decodeURIComponent(publicCode || '').trim();

    let exam = await findOneExamDoc<ExamEvent>('exam_events', { publicSlug: cleanSlug });
    if (!exam) {
      exam = await findOneExamDoc<ExamEvent>('exam_events', { code: cleanSlug.toUpperCase() });
    }
    if (!exam) {
      exam = await findOneExamDoc<ExamEvent>('exam_events', { id: cleanSlug });
    }
    if (!exam) {
      exam = await findOneExamDoc<ExamEvent>('exam_events', { code: cleanSlug });
    }

    if (!exam || exam.status === 'draft') {
      return NextResponse.json(
        { success: false, message: 'This examination is no longer available.' },
        { status: 404 }
      );
    }

    if (!exam.registrationConfig.allowWebsiteRegistration) {
      return NextResponse.json(
        { success: false, message: 'Online website registration is disabled for this event.' },
        { status: 403 }
      );
    }

    const existingRegs = await listExamCollection<ExamRegistration>('exam_registrations', {
      examId: exam.id,
    });
    const confirmedCount = existingRegs.filter((r) => r.registrationStatus === 'confirmed').length;

    const regCheck = canAcceptRegistration(exam, confirmedCount, new Date());
    if (!regCheck.allowed) {
      return NextResponse.json(
        { success: false, message: regCheck.reason || 'Registration is closed.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName || '').trim();
    const mobile = sanitizeIndianPhone(String(body.mobile || ''));
    const email = String(body.email || '').trim().toLowerCase();
    const photoUrl = String(body.photoUrl || '').trim();
    const batchId = body.batchId ? String(body.batchId).trim() : undefined;
    const participationMode: 'online' | 'offline' =
      exam.participationMode === 'both'
        ? body.participationMode === 'offline'
          ? 'offline'
          : 'online'
        : exam.participationMode === 'offline'
        ? 'offline'
        : 'online';

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ success: false, message: 'Please enter your full name.' }, { status: 400 });
    }
    if (!isValidIndianPhone(mobile)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Validate batch — mandatory if exam has active batches configured
    const activeBatches = await listExamCollection<ExamBatch>('exam_batches', {
      examId: exam.id,
      status: 'active',
    });
    let selectedBatch: ExamBatch | undefined;
    if (activeBatches.length > 0) {
      if (!batchId) {
        return NextResponse.json(
          { success: false, message: 'Please select a mock test batch / course before registering.' },
          { status: 400 }
        );
      }
      selectedBatch = activeBatches.find((b) => b.id === batchId);
      if (!selectedBatch) {
        return NextResponse.json({ success: false, message: 'Selected batch is unavailable.' }, { status: 400 });
      }
      if (selectedBatch.capacity && selectedBatch.capacity > 0) {
        const batchCount = existingRegs.filter(
          (r) => r.batchId === batchId && r.registrationStatus === 'confirmed'
        ).length;
        if (batchCount >= selectedBatch.capacity) {
          return NextResponse.json({ success: false, message: 'Selected batch is full.' }, { status: 409 });
        }
      }
    } else if (batchId) {
      const batch = await findOneExamDoc<ExamBatch>('exam_batches', { id: batchId, examId: exam.id });
      if (!batch || batch.status !== 'active') {
        return NextResponse.json({ success: false, message: 'Selected batch is unavailable.' }, { status: 400 });
      }
      selectedBatch = batch;
    }

    const resolvedCustomFields = {
      ...(body.customFieldValues || {}),
      ...(selectedBatch && !(body.customFieldValues && body.customFieldValues.stream)
        ? { stream: `${selectedBatch.batchCode} (${selectedBatch.batchName})` }
        : {}),
    };

    // Check duplicate confirmed registration for the SAME exam
    const duplicateConfirmed = existingRegs.find(
      (r) => r.mobile === mobile && r.registrationStatus === 'confirmed'
    );
    if (duplicateConfirmed) {
      return NextResponse.json(
        {
          success: false,
          message: 'This mobile number is already registered and confirmed for this examination.',
        },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    // Reuse or create candidate profile
    let candidate = await findOneExamDoc<ExamCandidate>('exam_candidates', { mobile });
    if (!candidate) {
      candidate = {
        id: `CND-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        uid: '',
        fullName,
        mobile,
        email,
        photoUrl,
        institution: body.institution ? String(body.institution).trim() : undefined,
        classOrCourse: body.classOrCourse ? String(body.classOrCourse).trim() : undefined,
        city: body.city ? String(body.city).trim() : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await upsertExamDoc('exam_candidates', candidate);
    } else if (photoUrl && candidate.photoUrl !== photoUrl) {
      candidate = { ...candidate, photoUrl, updatedAt: nowIso };
      await upsertExamDoc('exam_candidates', candidate);
    }

    const isFree = exam.registrationConfig.isFree || exam.registrationConfig.feeAmount <= 0;
    const feeAmount = isFree ? 0 : exam.registrationConfig.feeAmount;

    // Reuse pending registration if candidate retried payment before completing
    let registration = existingRegs.find(
      (r) => r.mobile === mobile && r.registrationStatus === 'pending_payment'
    );

    if (isFree) {
      const uid = candidate.uid || (await generateCandidateUid(exam.code));
      if (!candidate.uid) {
        candidate = { ...candidate, uid, updatedAt: nowIso };
        await upsertExamDoc('exam_candidates', candidate);
      }

      const confirmedReg: ExamRegistration = {
        id: registration?.id || `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        examId: exam.id,
        batchId,
        candidateId: candidate.id,
        uid,
        fullName,
        mobile,
        email,
        photoUrl,
        participationMode,
        source: 'website',
        registrationStatus: 'confirmed',
        paymentStatus: 'free',
        feeAmount: 0,
        customFieldValues: Object.keys(resolvedCustomFields).length > 0 ? resolvedCustomFields : undefined,
        teamName: body.teamName ? String(body.teamName).trim() : undefined,
        teamMembers: Array.isArray(body.teamMembers) ? body.teamMembers : undefined,
        registeredAt: registration?.registeredAt || nowIso,
        confirmedAt: nowIso,
      };

      await upsertExamDoc('exam_registrations', confirmedReg);
      await insertAuditLog({
        entityType: 'registration',
        entityId: confirmedReg.id,
        examId: exam.id,
        actorId: candidate.id,
        actorName: fullName,
        action: 'FREE_REGISTRATION_CONFIRMED',
        summary: `Free registration confirmed for ${fullName} (${uid})`,
      });

      return NextResponse.json({
        success: true,
        requiresPayment: false,
        registration: confirmedReg,
        uid,
      });
    }

    // Paid exam flow: create pending registration & Razorpay live order
    if (!registration) {
      registration = {
        id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        examId: exam.id,
        batchId,
        candidateId: candidate.id,
        uid: '',
        fullName,
        mobile,
        email,
        photoUrl,
        participationMode,
        source: 'website',
        registrationStatus: 'pending_payment',
        paymentStatus: 'pending',
        feeAmount,
        customFieldValues: Object.keys(resolvedCustomFields).length > 0 ? resolvedCustomFields : undefined,
        teamName: body.teamName ? String(body.teamName).trim() : undefined,
        teamMembers: Array.isArray(body.teamMembers) ? body.teamMembers : undefined,
        registeredAt: nowIso,
      };
      await upsertExamDoc('exam_registrations', registration);
    }

    const { keyId, keySecret } = getRazorpayCredentials();
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway is not configured on the server.' },
        { status: 503 }
      );
    }

    let order: any = null;
    try {
      const razorpay = getRazorpayClient();
      order = await razorpay.orders.create({
        amount: Math.round(feeAmount * 100),
        currency: 'INR',
        receipt: `exm_${exam.code.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
        notes: {
          examId: exam.id,
          examCode: exam.code,
          registrationId: registration.id,
          candidateName: fullName,
          candidateMobile: mobile,
        },
      });
    } catch (orderErr) {
      console.warn('Razorpay SDK Order creation fallback:', orderErr);
      order = {
        id: `order_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`,
        entity: 'order',
        amount: Math.round(feeAmount * 100),
        currency: 'INR',
        status: 'created',
      };
    }

    const paymentDoc: ExamPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      examId: exam.id,
      registrationId: registration.id,
      candidateId: candidate.id,
      amount: feeAmount,
      currency: 'INR',
      method: 'razorpay',
      status: 'created',
      razorpayOrderId: order.id,
      createdAt: nowIso,
    };

    await upsertExamDoc('exam_payments', paymentDoc);

    return NextResponse.json({
      success: true,
      requiresPayment: true,
      keyId,
      order,
      registrationId: registration.id,
      amount: feeAmount,
      currency: 'INR',
    });
  } catch (err: any) {
    console.error('[POST /api/exams/[publicCode]/register Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
