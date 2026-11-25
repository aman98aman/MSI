import { NextRequest, NextResponse } from 'next/server';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { findOneExamDoc, upsertExamDoc } from '@/lib/examDb';
import { canEnterCbtExam } from '@/lib/examLifecycle';
import { ExamAttempt, ExamBatch, ExamEvent, ExamProctorEvent } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = getCandidateSession(req);
  if (!session) return unauthorizedCandidateResponse();

  const { attemptId } = await context.params;
  const attempt = await findOneExamDoc<ExamAttempt>('exam_attempts', { id: attemptId });
  if (!attempt || attempt.registrationId !== session.registrationId) {
    return unauthorizedCandidateResponse('Attempt access denied.');
  }

  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return NextResponse.json(
      { success: false, message: 'This examination attempt is already submitted.' },
      { status: 409 }
    );
  }

  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: attempt.examId });
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const batch = attempt.batchId
    ? await findOneExamDoc<ExamBatch>('exam_batches', { id: attempt.batchId })
    : null;

  if (attempt.status === 'not_started') {
    const enterCheck = canEnterCbtExam(exam, batch, new Date());
    if (!enterCheck.allowed) {
      return NextResponse.json(
        { success: false, message: enterCheck.reason || 'Examination cannot be started now.' },
        { status: 403 }
      );
    }

    const now = new Date();
    const durationMin = batch?.scheduleOverride?.durationMinutes || exam.scheduleConfig.durationMinutes || 60;
    const durationEndMs = now.getTime() + durationMin * 60 * 1000;
    const examEndStr = batch?.scheduleOverride?.endAt || exam.scheduleConfig.endAt;
    const examEndMs = examEndStr ? Date.parse(examEndStr) : NaN;
    const finalExpiryMs = !Number.isNaN(examEndMs)
      ? Math.min(durationEndMs, examEndMs)
      : durationEndMs;

    const updatedAttempt: ExamAttempt = {
      ...attempt,
      status: 'in_progress',
      startedAt: now.toISOString(),
      expiresAt: new Date(finalExpiryMs).toISOString(),
    };

    await upsertExamDoc('exam_attempts', updatedAttempt);

    if (!exam.hasStartedAttempts) {
      await upsertExamDoc('exam_events', {
        ...exam,
        hasStartedAttempts: true,
        updatedAt: now.toISOString(),
      });
    }

    const startEvent: ExamProctorEvent = {
      id: `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      attemptId: attempt.id,
      examId: exam.id,
      candidateId: attempt.candidateId,
      uid: attempt.uid,
      eventType: 'attempt_started',
      severity: 'info',
      createdAt: now.toISOString(),
    };
    await upsertExamDoc('exam_proctor_events', startEvent);

    return NextResponse.json({
      success: true,
      attemptId: updatedAttempt.id,
      status: updatedAttempt.status,
      startedAt: updatedAttempt.startedAt,
      expiresAt: updatedAttempt.expiresAt,
    });
  }

  return NextResponse.json({
    success: true,
    attemptId: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
  });
}
