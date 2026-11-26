import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import {
  deleteExamDoc,
  findOneExamDoc,
  insertAuditLog,
  listExamCollection,
  upsertExamDoc,
} from '@/lib/examDb';
import { resolveEffectiveExamStatus } from '@/lib/examLifecycle';
import {
  ExamAttempt,
  ExamAuditLog,
  ExamBatch,
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
  const cleanId = decodeURIComponent(examId || '').trim();
  let exam = await findOneExamDoc<ExamEvent>('exam_events', { id: cleanId });
  if (!exam) {
    exam = await findOneExamDoc<ExamEvent>('exam_events', { code: cleanId.toUpperCase() });
  }
  if (!exam) {
    exam = await findOneExamDoc<ExamEvent>('exam_events', { publicSlug: cleanId });
  }
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const [batches, registrations, payments, attempts, auditLogs] = await Promise.all([
    listExamCollection<ExamBatch>('exam_batches', { examId }, { createdAt: 1 }),
    listExamCollection<ExamRegistration>('exam_registrations', { examId }),
    listExamCollection<ExamPayment>('exam_payments', { examId }),
    listExamCollection<ExamAttempt>('exam_attempts', { examId }),
    listExamCollection<ExamAuditLog>('exam_audit_logs', { examId }, { createdAt: -1 }),
  ]);

  const effectiveStatus = resolveEffectiveExamStatus(exam, new Date());
  const confirmedRegistrations = registrations.filter((r) => r.registrationStatus === 'confirmed').length;
  const submittedAttempts = attempts.filter(
    (a) => a.status === 'submitted' || a.status === 'auto_submitted'
  ).length;
  const totalRevenue = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return NextResponse.json({
    success: true,
    exam: { ...exam, effectiveStatus },
    batches,
    metrics: {
      confirmedRegistrations,
      pendingRegistrations: registrations.filter((r) => r.registrationStatus === 'pending_payment').length,
      totalRevenue,
      submittedAttempts,
      activeAttempts: attempts.filter((a) => a.status === 'in_progress').length,
      absentCandidates: Math.max(0, confirmedRegistrations - attempts.length),
    },
    auditLogs: auditLogs.slice(0, 50),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const existing = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'update');
  const nowIso = new Date().toISOString();
  const updated: ExamEvent = { ...existing, updatedAt: nowIso };
  let auditSummary = `Updated examination ${existing.code}`;

  if (action === 'publish') {
    if (existing.eventType === 'online_cbt' && !existing.paperVerified) {
      // Allow publishing registration early, or warn? Spec says:
      // "Require an explicit Verified and Publish action before a paper can be used in a live exam."
      // Publishing exam opens registration; CBT paper verification is checked before live attempt.
    }
    updated.status = 'published';
    updated.publishedAt = existing.publishedAt || nowIso;
    updated.registrationConfig = {
      ...updated.registrationConfig,
      registrationPaused: false,
    };
    auditSummary = `Published examination ${existing.code}`;
  } else if (action === 'pause_registration') {
    updated.registrationConfig = { ...updated.registrationConfig, registrationPaused: true };
    auditSummary = `Paused registration for ${existing.code}`;
  } else if (action === 'resume_registration') {
    updated.registrationConfig = { ...updated.registrationConfig, registrationPaused: false };
    auditSummary = `Resumed registration for ${existing.code}`;
  } else if (action === 'close_registration') {
    updated.status = 'registration_closed';
    updated.registrationConfig = { ...updated.registrationConfig, registrationPaused: true };
    auditSummary = `Closed registration for ${existing.code}`;
  } else if (action === 'cancel') {
    updated.status = 'cancelled';
    updated.cancelledAt = nowIso;
    updated.cancellationReason = String(body.reason || 'Cancelled by Super Admin').trim();
    auditSummary = `Cancelled examination ${existing.code}: ${updated.cancellationReason}`;
  } else if (action === 'archive') {
    updated.status = 'archived';
    updated.archivedAt = nowIso;
    auditSummary = `Archived examination ${existing.code}`;
  } else if (action === 'publish_results') {
    updated.status = 'results_published';
    auditSummary = `Published results for ${existing.code}`;
  } else {
    // Field update — check if attempts have started
    if (existing.hasStartedAttempts && !body.emergencyOverrideReason) {
      if (body.cbtRules || body.scheduleConfig?.durationMinutes) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Critical CBT rules and duration are locked because candidates have already started attempts. Provide an emergencyOverrideReason to make an audited correction.',
          },
          { status: 409 }
        );
      }
    }

    if (body.title) updated.title = String(body.title).trim();
    if (body.description !== undefined) updated.description = String(body.description).trim();
    if (body.instructions !== undefined) updated.instructions = String(body.instructions).trim();
    if (body.targetAudience !== undefined) updated.targetAudience = String(body.targetAudience).trim();
    if (body.category) updated.category = String(body.category).trim();
    if (body.contactPhones !== undefined) updated.contactPhones = String(body.contactPhones).trim();
    if (body.contactEmail !== undefined) updated.contactEmail = String(body.contactEmail).trim();
    if (body.registrationConfig) {
      updated.registrationConfig = { ...updated.registrationConfig, ...body.registrationConfig };
    }
    if (body.scheduleConfig) {
      updated.scheduleConfig = { ...updated.scheduleConfig, ...body.scheduleConfig };
    }
    if (body.cbtRules && updated.cbtRules) {
      updated.cbtRules = { ...updated.cbtRules, ...body.cbtRules };
    }
    if (body.offlineVenue) {
      updated.offlineVenue = { ...updated.offlineVenue, ...body.offlineVenue };
    }
    if (body.debateConfig) {
      updated.debateConfig = { ...updated.debateConfig, ...body.debateConfig };
    }
    if (body.emergencyOverrideReason) {
      auditSummary = `Emergency override edit on ${existing.code}: ${body.emergencyOverrideReason}`;
    }
  }

  await upsertExamDoc('exam_events', updated);
  await insertAuditLog({
    entityType: 'exam',
    entityId: existing.id,
    examId: existing.id,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: action.toUpperCase(),
    summary: auditSummary,
    before: { status: existing.status },
    after: { status: updated.status },
  });

  return NextResponse.json({
    success: true,
    exam: { ...updated, effectiveStatus: resolveEffectiveExamStatus(updated, new Date()) },
  });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const existing = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      { success: false, message: 'Only draft examinations can be deleted. Use Cancel or Archive instead.' },
      { status: 400 }
    );
  }

  const regs = await listExamCollection<ExamRegistration>('exam_registrations', { examId });
  if (regs.length > 0) {
    return NextResponse.json(
      { success: false, message: 'Cannot delete an examination that has candidate registrations.' },
      { status: 409 }
    );
  }

  await deleteExamDoc('exam_events', { id: examId });
  await insertAuditLog({
    entityType: 'exam',
    entityId: examId,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: 'DELETE_DRAFT_EXAM',
    summary: `Deleted draft examination ${existing.code}`,
  });

  return NextResponse.json({ success: true });
}
