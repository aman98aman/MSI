import {
  CandidateAnswer,
  CbtRulesConfig,
  ExamAttempt,
  ExamQuestion,
} from './examTypes';

export interface EvaluationSummary {
  rawScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
}

/**
 * Evaluates a candidate's raw answers against the canonical server-side answer key.
 * Independent of displayed question or option order.
 */
export function evaluateAttemptAnswers(params: {
  attempt: ExamAttempt;
  questions: ExamQuestion[];
  answers: CandidateAnswer[];
  cbtRules?: CbtRulesConfig;
}): EvaluationSummary {
  const { attempt, questions, answers, cbtRules } = params;
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  let rawScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  for (const seqItem of attempt.questionSequence) {
    const q = questionMap.get(seqItem.questionId);
    if (!q) continue;

    const posMarks = Number(q.marks ?? cbtRules?.marksPerQuestion ?? 1);
    const negMarks = Number(q.negativeMarks ?? cbtRules?.negativeMarking ?? 0);
    maxScore += posMarks;

    const ans = answerMap.get(q.id);
    if (!ans || !ans.selectedOptionId) {
      unansweredCount += 1;
      if (cbtRules?.unansweredPolicy === 'negative') {
        rawScore -= negMarks;
      }
      continue;
    }

    if (ans.selectedOptionId === q.correctOptionId) {
      correctCount += 1;
      rawScore += posMarks;
    } else {
      wrongCount += 1;
      rawScore -= negMarks;
    }
  }

  // Round to 2 decimal places to avoid floating-point artifacts
  rawScore = Math.round(rawScore * 100) / 100;
  maxScore = Math.round(maxScore * 100) / 100;
  const percentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 10000) / 100 : 0;
  const passingMarks = cbtRules?.passingMarks;
  const passed =
    passingMarks !== undefined && passingMarks !== null ? rawScore >= passingMarks : true;

  return {
    rawScore,
    maxScore,
    percentage,
    passed,
    correctCount,
    wrongCount,
    unansweredCount,
  };
}
