import { NextRequest, NextResponse } from 'next/server';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { findOneExamDoc, listExamCollection } from '@/lib/examDb';
import {
  filterQuestionsForTarget,
  isSubPaperBatch,
  isTargetPaperVerified,
  SUB_PAPERS,
} from '@/lib/examBatchHelper';
import {
  ExamAttempt,
  ExamBatch,
  ExamEvent,
  ExamPaperVersion,
  ExamQuestion,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getCandidateSession(req);
  if (!session) return unauthorizedCandidateResponse();

  const [reg, exam] = await Promise.all([
    findOneExamDoc<ExamRegistration>('exam_registrations', { id: session.registrationId }),
    findOneExamDoc<ExamEvent>('exam_events', { id: session.examId }),
  ]);

  if (!reg || !exam) {
    return unauthorizedCandidateResponse('Candidate registration not found.');
  }

  const batch = reg.batchId
    ? await findOneExamDoc<ExamBatch>('exam_batches', { id: reg.batchId })
    : null;

  if (!isSubPaperBatch(batch)) {
    return NextResponse.json({
      success: true,
      hasSubPapers: false,
      uid: reg.uid,
      fullName: reg.fullName,
      examTitle: exam.title,
    });
  }

  const [attempts, allQuestions, paperVersions] = await Promise.all([
    listExamCollection<ExamAttempt>('exam_attempts', { registrationId: reg.id }),
    listExamCollection<ExamQuestion>('exam_questions', {
      examId: exam.id,
      paperVersion: exam.activePaperVersion || 1,
      status: 'active',
    }),
    listExamCollection<ExamPaperVersion>('exam_paper_versions', {
      examId: exam.id,
      version: exam.activePaperVersion || 1,
    }),
  ]);

  const inProgressAttempt = attempts.find((a) => a.status === 'in_progress');

  const papers = SUB_PAPERS.map((sp) => {
    const attempt = attempts.find((a) => a.subPaper === sp.code);
    const questions = filterQuestionsForTarget(allQuestions, {
      batchId: reg.batchId,
      subPaper: sp.code,
      strictBatch: true,
    });
    const verified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
      batchId: reg.batchId,
      subPaper: sp.code,
    });

    let status: 'available' | 'in_progress' | 'submitted' | 'locked' | 'unavailable' = 'available';
    let lockReason = '';

    if (attempt && (attempt.status === 'submitted' || attempt.status === 'auto_submitted')) {
      status = 'submitted';
    } else if (attempt && attempt.status === 'in_progress') {
      status = 'in_progress';
    } else if (inProgressAttempt && inProgressAttempt.subPaper !== sp.code) {
      status = 'locked';
      lockReason = `Complete and submit ${inProgressAttempt.subPaperLabel || 'the active paper'} first to unlock this paper.`;
    } else if (!verified || questions.length === 0) {
      status = 'unavailable';
      lockReason = 'Question paper has not been published by the administrator yet.';
    }

    return {
      subPaper: sp.code,
      label: sp.label,
      subtitle: sp.subtitle,
      questionCount: questions.length,
      verified,
      status,
      lockReason,
      attemptId: attempt?.id || null,
      submittedAt: attempt?.submittedAt || null,
      publishedResult:
        exam.status === 'results_published' && attempt && (attempt.status === 'submitted' || attempt.status === 'auto_submitted')
          ? {
              rawScore: attempt.rawScore,
              maxScore: attempt.maxScore,
              percentage: attempt.percentage,
              correctCount: attempt.correctCount,
              wrongCount: attempt.wrongCount,
              unansweredCount: attempt.unansweredCount,
            }
          : null,
    };
  });

  return NextResponse.json({
    success: true,
    hasSubPapers: true,
    uid: reg.uid,
    fullName: reg.fullName,
    examTitle: exam.title,
    examCode: exam.code,
    batchCode: batch?.batchCode,
    batchName: batch?.batchName,
    durationMinutes: batch?.scheduleOverride?.durationMinutes || exam.scheduleConfig.durationMinutes,
    papers,
  });
}
