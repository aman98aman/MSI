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
    return NextResponse.json(
      { success: false, message: 'Attempt is not active.' },
      { status: 409 }
    );
  }

  // Server-authoritative expiry check (allow 5s network jitter)
  if (Date.now() > Date.parse(attempt.expiresAt) + 5000) {
    await finalizeAttemptIdempotent({
      attempt,
      exam,
      mode: 'auto_submitted',
      reason: 'Server time expired during answer save',
    });
    return NextResponse.json(
      { success: false, expired: true, message: 'Examination time has expired. Attempt auto-submitted.' },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const questionId = String(body.questionId || '').trim();
  const selectedOptionId = body.selectedOptionId ? String(body.selectedOptionId).trim() : null;

  const currentSeq = attempt.questionSequence[attempt.currentIndex];
  if (!currentSeq || currentSeq.questionId !== questionId) {
    return NextResponse.json(
      { success: false, message: 'Previous or out-of-order questions are locked and cannot be modified.' },
      { status: 403 }
    );
  }

  const existing = await findOneExamDoc<CandidateAnswer>('exam_answers', {
    attemptId: attempt.id,
    questionId,
  });

  const answerDoc: CandidateAnswer = {
    id: existing?.id || `ANS-${attempt.id}-${questionId}`,
    attemptId: attempt.id,
    examId: exam.id,
    questionId,
    selectedOptionId,
    locked: false,
    savedAt: new Date().toISOString(),
  };

  await upsertExamDoc('exam_answers', answerDoc);

  return NextResponse.json({
    success: true,
    questionId,
    selectedOptionId,
    savedAt: answerDoc.savedAt,
  });
}
