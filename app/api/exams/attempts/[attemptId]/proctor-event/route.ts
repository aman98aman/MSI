import { NextRequest, NextResponse } from 'next/server';
import {
  finalizeAttemptIdempotent,
  getAttemptAndExamForCandidate,
} from '@/lib/examAttemptHelper';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { upsertExamDoc } from '@/lib/examDb';
import { ExamAttempt, ExamProctorEvent } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

const VIOLATION_EVENTS = new Set([
  'fullscreen_exited',
  'tab_hidden',
  'window_blurred',
]);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = getCandidateSession(req);
  if (!session) return unauthorizedCandidateResponse();

  const { attemptId } = await context.params;
  const check = await getAttemptAndExamForCandidate(
    attemptId,
    session.registrationId,
    session.sessionTokenId
  );
  if (check.error || !check.attempt || !check.exam) {
    return NextResponse.json(
      { success: false, message: check.error },
      { status: check.statusCode || 403 }
    );
  }

  const { attempt, exam } = check;
  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ success: true, ignored: true });
  }

  const body = await req.json().catch(() => ({}));
  const eventType = String(body.eventType || '') as ExamProctorEvent['eventType'];
  const isViolation = VIOLATION_EVENTS.has(eventType);

  const nowIso = new Date().toISOString();
  const proctorEvent: ExamProctorEvent = {
    id: `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    attemptId: attempt.id,
    examId: exam.id,
    candidateId: attempt.candidateId,
    uid: attempt.uid,
    eventType,
    severity: isViolation ? 'warning' : 'info',
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
    createdAt: nowIso,
  };

  await upsertExamDoc('exam_proctor_events', proctorEvent);

  let updatedAttempt: ExamAttempt = { ...attempt };
  let autoSubmitted = false;

  if (isViolation) {
    updatedAttempt.violationCount = (updatedAttempt.violationCount || 0) + 1;
    if (eventType === 'fullscreen_exited') {
      updatedAttempt.fullscreenExitCount = (updatedAttempt.fullscreenExitCount || 0) + 1;
    } else if (eventType === 'tab_hidden') {
      updatedAttempt.tabSwitchCount = (updatedAttempt.tabSwitchCount || 0) + 1;
    } else if (eventType === 'window_blurred') {
      updatedAttempt.windowBlurCount = (updatedAttempt.windowBlurCount || 0) + 1;
    }

    await upsertExamDoc('exam_attempts', updatedAttempt);

    const rules = exam.cbtRules;
    const maxTabs = rules?.tabSwitchThreshold ?? 3;
    const maxFs = rules?.fullscreenExitThreshold ?? 3;

    if (
      rules?.autoSubmitOnViolation &&
      (updatedAttempt.tabSwitchCount >= maxTabs ||
        updatedAttempt.fullscreenExitCount >= maxFs ||
        updatedAttempt.violationCount >= maxTabs + maxFs)
    ) {
      await finalizeAttemptIdempotent({
        attempt: updatedAttempt,
        exam,
        mode: 'auto_submitted',
        reason: `Violation threshold reached (${eventType})`,
      });
      autoSubmitted = true;
    }
  }

  return NextResponse.json({
    success: true,
    violationCount: updatedAttempt.violationCount,
    fullscreenExitCount: updatedAttempt.fullscreenExitCount,
    tabSwitchCount: updatedAttempt.tabSwitchCount,
    autoSubmitted,
  });
}
