import { NextRequest, NextResponse } from 'next/server';
import {
  finalizeAttemptIdempotent,
  getAttemptAndExamForCandidate,
} from '@/lib/examAttemptHelper';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { findOneExamDoc, upsertExamDoc } from '@/lib/examDb';
import { CandidateAnswer } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({ success: false, message: 'Attempt is not active.' }, { status: 409 });
  }

  if (Date.now() > Date.parse(attempt.expiresAt) + 5000) {
    await finalizeAttemptIdempotent({
      attempt,
      exam,
      mode: 'auto_submitted',
      reason: 'Server time expired during advance',
    });
    return NextResponse.json(
      { success: false, expired: true, message: 'Examination time has expired. Attempt auto-submitted.' },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const expectedIndex = Number(body.currentIndex);
  if (!Number.isNaN(expectedIndex) && expectedIndex !== attempt.currentIndex) {
    return NextResponse.json(
      { success: false, message: 'Question index out of sync. Refreshing state.' },
      { status: 409 }
    );
  }

  const currentSeq = attempt.questionSequence[attempt.currentIndex];
  if (currentSeq) {
    const existingAns = await findOneExamDoc<CandidateAnswer>('exam_answers', {
      attemptId: attempt.id,
      questionId: currentSeq.questionId,
    });

    const selectedOptionId =
      body.selectedOptionId !== undefined
        ? body.selectedOptionId
          ? String(body.selectedOptionId).trim()
          : null
        : existingAns?.selectedOptionId ?? null;

    await upsertExamDoc('exam_answers', {
      id: existingAns?.id || `ANS-${attempt.id}-${currentSeq.questionId}`,
      attemptId: attempt.id,
      examId: exam.id,
      questionId: currentSeq.questionId,
      selectedOptionId,
      locked: false,
      savedAt: new Date().toISOString(),
    });
  }

  const direction = String(body.direction || 'next').toLowerCase();
  let nextIndex = attempt.currentIndex + 1;

  if (direction === 'prev') {
    nextIndex = Math.max(0, attempt.currentIndex - 1);
  } else if (direction === 'jump' && typeof body.targetIndex === 'number') {
    nextIndex = Math.max(0, Math.min(attempt.questionSequence.length - 1, Math.floor(body.targetIndex)));
  } else if (nextIndex >= attempt.questionSequence.length) {
    return NextResponse.json({
      success: true,
      reachedEnd: true,
      currentIndex: attempt.currentIndex,
    });
  }

  await upsertExamDoc('exam_attempts', {
    ...attempt,
    currentIndex: nextIndex,
  });

  return NextResponse.json({
    success: true,
    reachedEnd: false,
    currentIndex: nextIndex,
  });
}
