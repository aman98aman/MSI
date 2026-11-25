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
  const body = await req.json().catch(() => ({}));

  // Save final question's selected option if passed with submit
  if (attempt.status === 'in_progress' && body.questionId && body.selectedOptionId !== undefined) {
    const currentSeq = attempt.questionSequence[attempt.currentIndex];
    if (currentSeq && currentSeq.questionId === body.questionId) {
      const existingAns = await findOneExamDoc<CandidateAnswer>('exam_answers', {
        attemptId: attempt.id,
        questionId: currentSeq.questionId,
      });
      if (!existingAns?.locked) {
        await upsertExamDoc('exam_answers', {
          id: existingAns?.id || `ANS-${attempt.id}-${currentSeq.questionId}`,
          attemptId: attempt.id,
          examId: exam.id,
          questionId: currentSeq.questionId,
          selectedOptionId: body.selectedOptionId ? String(body.selectedOptionId).trim() : null,
          locked: true,
          savedAt: new Date().toISOString(),
        });
      }
    }
  }

  const isExpired = Date.now() > Date.parse(attempt.expiresAt);
  const finalized = await finalizeAttemptIdempotent({
    attempt,
    exam,
    mode: isExpired || body.autoSubmit ? 'auto_submitted' : 'submitted',
    reason: body.reason || (isExpired ? 'Time expired' : 'Candidate submitted'),
  });

  return NextResponse.json({
    success: true,
    attemptId: finalized.id,
    status: finalized.status,
    submittedAt: finalized.submittedAt,
    uid: finalized.uid,
    resultsPublished: exam.status === 'results_published',
  });
}
