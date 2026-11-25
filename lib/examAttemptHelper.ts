import { findOneExamDoc, listExamCollection, upsertExamDoc } from './examDb';
import { evaluateAttemptAnswers } from './examEvaluator';
import {
  CandidateAnswer,
  ExamAttempt,
  ExamEvent,
  ExamProctorEvent,
  ExamQuestion,
} from './examTypes';

/**
 * Idempotently finalizes and evaluates an attempt (manual or server auto-submit).
 */
export async function finalizeAttemptIdempotent(params: {
  attempt: ExamAttempt;
  exam: ExamEvent;
  mode: 'submitted' | 'auto_submitted';
  reason?: string;
}): Promise<ExamAttempt> {
  const { attempt, exam, mode, reason } = params;
  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return attempt;
  }

  const nowIso = new Date().toISOString();
  const [questions, answers] = await Promise.all([
    listExamCollection<ExamQuestion>('exam_questions', {
      examId: exam.id,
      paperVersion: attempt.paperVersion,
    }),
    listExamCollection<CandidateAnswer>('exam_answers', { attemptId: attempt.id }),
  ]);

  const summary = evaluateAttemptAnswers({
    attempt,
    questions,
    answers,
    cbtRules: exam.cbtRules,
  });

  const finalized: ExamAttempt = {
    ...attempt,
    status: mode,
    submittedAt: nowIso,
    ...summary,
    evaluatedAt: nowIso,
  };

  await upsertExamDoc('exam_attempts', finalized);

  const evt: ExamProctorEvent = {
    id: `PR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    attemptId: attempt.id,
    examId: exam.id,
    candidateId: attempt.candidateId,
    uid: attempt.uid,
    eventType: mode === 'auto_submitted' ? 'auto_submitted' : 'submit_clicked',
    severity: mode === 'auto_submitted' ? 'warning' : 'info',
    metadata: reason ? { reason } : undefined,
    createdAt: nowIso,
  };
  await upsertExamDoc('exam_proctor_events', evt);

  return finalized;
}

export async function getAttemptAndExamForCandidate(
  attemptId: string,
  registrationId: string,
  sessionTokenId: string
): Promise<{
  error?: string;
  statusCode?: number;
  attempt?: ExamAttempt;
  exam?: ExamEvent;
}> {
  const attempt = await findOneExamDoc<ExamAttempt>('exam_attempts', { id: attemptId });
  if (!attempt || attempt.registrationId !== registrationId) {
    return { error: 'Attempt access denied.', statusCode: 403 };
  }

  if (attempt.sessionTokenId !== sessionTokenId) {
    return {
      error: 'Your session was opened on another tab or device. Please re-login to resume.',
      statusCode: 409,
    };
  }

  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: attempt.examId });
  if (!exam) {
    return { error: 'Examination not found.', statusCode: 404 };
  }

  return { attempt, exam };
}
