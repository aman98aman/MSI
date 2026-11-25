import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import { insertAuditLog, listExamCollection, upsertExamDoc } from '@/lib/examDb';
import { resolveEffectiveExamStatus } from '@/lib/examLifecycle';
import {
  ExamAttempt,
  ExamEvent,
  ExamPayment,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function GET(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const eventType = (searchParams.get('eventType') || '').trim();
    const statusFilter = (searchParams.get('status') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));

    const [exams, registrations, payments, attempts] = await Promise.all([
      listExamCollection<ExamEvent>('exam_events', {}, { createdAt: -1 }),
      listExamCollection<ExamRegistration>('exam_registrations', {}),
      listExamCollection<ExamPayment>('exam_payments', {}),
      listExamCollection<ExamAttempt>('exam_attempts', {}),
    ]);

    const now = new Date();

    // Compute real database-backed dashboard metrics
    const metrics = {
      totalExams: exams.length,
      draftExams: 0,
      publishedExams: 0,
      registrationOpen: 0,
      upcomingExams: 0,
      liveExams: 0,
      completedExams: 0,
      cancelledExams: 0,
      archivedExams: 0,
      totalRegistrations: registrations.filter((r) => r.registrationStatus === 'confirmed').length,
      successfulPayments: payments.filter((p) => p.status === 'verified' && p.amount > 0).length,
      pendingPayments: payments.filter((p) => p.status === 'created').length,
      totalRevenueInr: payments
        .filter((p) => p.status === 'verified')
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
      submittedAttempts: attempts.filter(
        (a) => a.status === 'submitted' || a.status === 'auto_submitted'
      ).length,
      absentCandidates: 0,
      resultsAwaitingPublication: 0,
    };

    const enrichedExams = exams.map((exam) => {
      const effectiveStatus = resolveEffectiveExamStatus(exam, now);

      if (effectiveStatus === 'draft') metrics.draftExams += 1;
      else if (effectiveStatus === 'published') metrics.publishedExams += 1;
      else if (effectiveStatus === 'registration_open') {
        metrics.publishedExams += 1;
        metrics.registrationOpen += 1;
      } else if (effectiveStatus === 'upcoming' || effectiveStatus === 'registration_closed') {
        metrics.publishedExams += 1;
        metrics.upcomingExams += 1;
      } else if (effectiveStatus === 'live') {
        metrics.publishedExams += 1;
        metrics.liveExams += 1;
      } else if (
        effectiveStatus === 'ended' ||
        effectiveStatus === 'results_processing' ||
        effectiveStatus === 'results_published'
      ) {
        metrics.completedExams += 1;
      } else if (effectiveStatus === 'cancelled') {
        metrics.cancelledExams += 1;
      } else if (effectiveStatus === 'archived') {
        metrics.archivedExams += 1;
      }

      const examRegs = registrations.filter((r) => r.examId === exam.id);
      const confirmedRegs = examRegs.filter((r) => r.registrationStatus === 'confirmed');
      const examAttempts = attempts.filter((a) => a.examId === exam.id);
      const submittedCount = examAttempts.filter(
        (a) => a.status === 'submitted' || a.status === 'auto_submitted'
      ).length;
      const paidCount = examRegs.filter((r) => r.paymentStatus === 'verified').length;
      const pendingPayCount = examRegs.filter((r) => r.paymentStatus === 'pending').length;

      if (
        (effectiveStatus === 'ended' || effectiveStatus === 'results_processing') &&
        exam.eventType === 'online_cbt'
      ) {
        metrics.absentCandidates += Math.max(0, confirmedRegs.length - examAttempts.length);
        if (submittedCount > 0) {
          metrics.resultsAwaitingPublication += 1;
        }
      }

      return {
        ...exam,
        effectiveStatus,
        stats: {
          confirmedRegistrations: confirmedRegs.length,
          pendingRegistrations: examRegs.filter((r) => r.registrationStatus === 'pending_payment').length,
          paidCount,
          pendingPayCount,
          submittedAttempts: submittedCount,
          activeAttempts: examAttempts.filter((a) => a.status === 'in_progress').length,
        },
      };
    });

    // Apply filters
    let filtered = enrichedExams;
    if (eventType && eventType !== 'all') {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }
    if (category && category !== 'all') {
      filtered = filtered.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.effectiveStatus === statusFilter);
    }
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(search) ||
          e.code.toLowerCase().includes(search) ||
          e.category.toLowerCase().includes(search) ||
          e.publicSlug.toLowerCase().includes(search)
      );
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
    const paged = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      metrics,
      exams: paged,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/examinations Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to load examinations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const title = String(body.title || '').trim();
    const rawCode = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (!title || !rawCode) {
      return NextResponse.json(
        { success: false, message: 'Exam title and unique exam code are required.' },
        { status: 400 }
      );
    }

    const existing = await listExamCollection<ExamEvent>('exam_events', {});
    const publicSlug = slugify(body.publicSlug || `${rawCode}-${title}`).slice(0, 64);

    if (existing.some((e) => e.code.toUpperCase() === rawCode)) {
      return NextResponse.json(
        { success: false, message: `Exam code "${rawCode}" already exists.` },
        { status: 409 }
      );
    }
    if (existing.some((e) => e.publicSlug === publicSlug)) {
      return NextResponse.json(
        { success: false, message: `Public URL slug "${publicSlug}" already exists.` },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const initialStatus = body.publishImmediately ? 'published' : 'draft';
    const isFree = Boolean(body.registrationConfig?.isFree ?? Number(body.registrationConfig?.feeAmount || 0) === 0);
    const feeAmount = isFree ? 0 : Math.max(0, Number(body.registrationConfig?.feeAmount || 0));

    const newExam: ExamEvent = {
      id: `EXM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      code: rawCode,
      publicSlug,
      title,
      description: String(body.description || '').trim(),
      eventType: body.eventType || 'online_cbt',
      participationMode: body.participationMode || 'online',
      category: String(body.category || 'CLAT').trim(),
      targetAudience: String(body.targetAudience || '').trim(),
      instructions: String(body.instructions || '').trim(),
      bannerUrl: body.bannerUrl ? String(body.bannerUrl).trim() : undefined,
      contactPhones: body.contactPhones ? String(body.contactPhones).trim() : undefined,
      contactEmail: body.contactEmail ? String(body.contactEmail).trim() : undefined,
      status: initialStatus,
      registrationConfig: {
        isFree,
        feeAmount,
        currency: 'INR',
        registrationOpenAt: body.registrationConfig?.registrationOpenAt || nowIso,
        registrationCloseAt: body.registrationConfig?.registrationCloseAt || body.scheduleConfig?.startAt || nowIso,
        maxRegistrations: body.registrationConfig?.maxRegistrations
          ? Number(body.registrationConfig.maxRegistrations)
          : undefined,
        registrationPaused: false,
        allowWebsiteRegistration: body.registrationConfig?.allowWebsiteRegistration ?? true,
        allowOfflineRegistration: body.registrationConfig?.allowOfflineRegistration ?? true,
        eligibilityText: String(body.registrationConfig?.eligibilityText || '').trim(),
        customFields: Array.isArray(body.registrationConfig?.customFields)
          ? body.registrationConfig.customFields
          : [],
        consentNotice:
          String(body.registrationConfig?.consentNotice || '').trim() ||
          'I confirm that the details provided are accurate and I agree to the MSI examination rules.',
      },
      scheduleConfig: {
        examDate: String(body.scheduleConfig?.examDate || nowIso.slice(0, 10)),
        loginOpenAt: body.scheduleConfig?.loginOpenAt || body.scheduleConfig?.startAt || nowIso,
        startAt: body.scheduleConfig?.startAt || nowIso,
        endAt: body.scheduleConfig?.endAt || nowIso,
        durationMinutes: Math.max(1, Number(body.scheduleConfig?.durationMinutes || 60)),
        timezone: 'Asia/Kolkata',
        lateEntryGraceMinutes: Math.max(0, Number(body.scheduleConfig?.lateEntryGraceMinutes ?? 15)),
        autoSubmitAtExpiry: body.scheduleConfig?.autoSubmitAtExpiry ?? true,
        reconnectPolicy: body.scheduleConfig?.reconnectPolicy || 'allow_resume',
      },
      cbtRules:
        (body.eventType || 'online_cbt') === 'online_cbt' || body.eventType === 'hybrid'
          ? {
              totalQuestions: Math.max(1, Number(body.cbtRules?.totalQuestions || 50)),
              marksPerQuestion: Number(body.cbtRules?.marksPerQuestion ?? 1),
              negativeMarking: Math.max(0, Number(body.cbtRules?.negativeMarking ?? 0.25)),
              unansweredPolicy: body.cbtRules?.unansweredPolicy || 'zero',
              passingMarks:
                body.cbtRules?.passingMarks !== undefined && body.cbtRules?.passingMarks !== ''
                  ? Number(body.cbtRules.passingMarks)
                  : undefined,
              randomizeQuestions: body.cbtRules?.randomizeQuestions ?? true,
              randomizeOptions: body.cbtRules?.randomizeOptions ?? true,
              disablePreviousNav: body.cbtRules?.disablePreviousNav ?? true,
              requireFullscreen: body.cbtRules?.requireFullscreen ?? true,
              tabSwitchThreshold: Math.max(1, Number(body.cbtRules?.tabSwitchThreshold ?? 3)),
              fullscreenExitThreshold: Math.max(1, Number(body.cbtRules?.fullscreenExitThreshold ?? 3)),
              autoSubmitOnViolation: Boolean(body.cbtRules?.autoSubmitOnViolation ?? false),
              webcamRequired: Boolean(body.cbtRules?.webcamRequired ?? false),
            }
          : undefined,
      offlineVenue: body.offlineVenue,
      debateConfig: body.debateConfig,
      activePaperVersion: 1,
      paperVerified: false,
      hasStartedAttempts: false,
      qrVersion: 1,
      createdBy: admin.actorName,
      createdAt: nowIso,
      updatedAt: nowIso,
      publishedAt: initialStatus === 'published' ? nowIso : undefined,
    };

    await upsertExamDoc('exam_events', newExam);
    await insertAuditLog({
      entityType: 'exam',
      entityId: newExam.id,
      examId: newExam.id,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: 'CREATE_EXAM',
      summary: `Created ${newExam.eventType} "${newExam.title}" (${newExam.code}) as ${newExam.status}`,
      after: { code: newExam.code, status: newExam.status, feeAmount },
    });

    return NextResponse.json({ success: true, exam: newExam }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/admin/examinations Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create examination.' },
      { status: 500 }
    );
  }
}
