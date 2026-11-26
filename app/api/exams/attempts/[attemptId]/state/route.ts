import { NextRequest, NextResponse } from 'next/server';
import {
  finalizeAttemptIdempotent,
  getAttemptAndExamForCandidate,
} from '@/lib/examAttemptHelper';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { listExamCollection } from '@/lib/examDb';
import { CandidateAnswer, ExamQuestion } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
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

  let { attempt, exam } = check;

  // Enforce server-side timer expiry automatically
  if (attempt.status === 'in_progress' && Date.now() > Date.parse(attempt.expiresAt)) {
    attempt = await finalizeAttemptIdempotent({
      attempt,
      exam,
      mode: 'auto_submitted',
      reason: 'Server time expired',
    });
  }

  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    return NextResponse.json({
      success: true,
      attemptStatus: attempt.status,
      submittedAt: attempt.submittedAt,
      uid: attempt.uid,
      examTitle: exam.title,
      subPaper: attempt.subPaper || null,
      subPaperLabel: attempt.subPaperLabel || null,
      hasSubPapers: Boolean(attempt.subPaper),
      totalQuestions: attempt.questionSequence.length,
      resultsPublished: exam.status === 'results_published',
      // Never expose answer key; only show score if Super Admin published results
      publishedResult:
        exam.status === 'results_published'
          ? {
              rawScore: attempt.rawScore,
              maxScore: attempt.maxScore,
              percentage: attempt.percentage,
              passed: attempt.passed,
              correctCount: attempt.correctCount,
              wrongCount: attempt.wrongCount,
              unansweredCount: attempt.unansweredCount,
            }
          : null,
    });
  }

  const [questions, answers] = await Promise.all([
    listExamCollection<ExamQuestion>('exam_questions', {
      examId: exam.id,
      paperVersion: attempt.paperVersion,
    }),
    listExamCollection<CandidateAnswer>('exam_answers', { attemptId: attempt.id }),
  ]);

  const qMap = new Map(questions.map((q) => [q.id, q]));
  const aMap = new Map(answers.map((a) => [a.questionId, a]));

  const currentSeq = attempt.questionSequence[attempt.currentIndex];
  const currentQuestionRaw = currentSeq ? qMap.get(currentSeq.questionId) : undefined;

  // Strip correctOptionId and explanation completely!
  const currentQuestion = currentQuestionRaw
    ? {
        id: currentQuestionRaw.id,
        displayOrder: currentSeq.displayOrder,
        section: currentQuestionRaw.section,
        text: currentQuestionRaw.text,
        imageUrl: currentQuestionRaw.imageUrl,
        marks: currentQuestionRaw.marks,
        negativeMarks: currentQuestionRaw.negativeMarks,
        options: currentSeq.optionOrder
          .map((optId) => currentQuestionRaw.options.find((o) => o.id === optId))
          .filter(Boolean),
        selectedOptionId: aMap.get(currentQuestionRaw.id)?.selectedOptionId || null,
      }
    : null;

  const attemptedCount = answers.filter((a) => Boolean(a.selectedOptionId)).length;
  const totalQuestions = attempt.questionSequence.length;
  const remainingSeconds =
    attempt.status === 'not_started'
      ? (exam.scheduleConfig.durationMinutes || 60) * 60
      : Math.max(0, Math.floor((Date.parse(attempt.expiresAt) - Date.now()) / 1000));

  const questionStatuses = attempt.questionSequence.map((seq, idx) => ({
    index: idx,
    answered: Boolean(aMap.get(seq.questionId)?.selectedOptionId),
  }));

  return NextResponse.json({
    success: true,
    attemptStatus: attempt.status,
    uid: attempt.uid,
    examTitle: exam.title,
    examCategory: exam.category,
    subPaper: attempt.subPaper || null,
    subPaperLabel: attempt.subPaperLabel || null,
    hasSubPapers: Boolean(attempt.subPaper),
    instructions: exam.instructions,
    durationMinutes: exam.scheduleConfig.durationMinutes,
    currentIndex: attempt.currentIndex,
    totalQuestions,
    attemptedCount,
    unansweredCount: Math.max(0, totalQuestions - attemptedCount),
    remainingCount: Math.max(0, totalQuestions - attemptedCount),
    remainingSeconds,
    expiresAt: attempt.expiresAt,
    violationCount: attempt.violationCount,
    questionStatuses,
    rules: {
      disablePreviousNav: false,
      requireFullscreen: exam.cbtRules?.requireFullscreen ?? true,
      tabSwitchThreshold: exam.cbtRules?.tabSwitchThreshold ?? 3,
      fullscreenExitThreshold: exam.cbtRules?.fullscreenExitThreshold ?? 3,
      autoSubmitOnViolation: exam.cbtRules?.autoSubmitOnViolation ?? false,
      marksPerQuestion: exam.cbtRules?.marksPerQuestion ?? 1,
      negativeMarking: exam.cbtRules?.negativeMarking ?? 0,
    },
    currentQuestion: attempt.status === 'in_progress' ? currentQuestion : null,
  });
}
