import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getCandidateSession, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { findOneExamDoc, listExamCollection, upsertExamDoc } from '@/lib/examDb';
import {
  filterQuestionsForTarget,
  isSubPaperBatch,
  isTargetPaperVerified,
  SUB_PAPERS,
} from '@/lib/examBatchHelper';
import { canEnterCbtExam } from '@/lib/examLifecycle';
import {
  AttemptQuestionSnapshot,
  ExamAttempt,
  ExamBatch,
  ExamEvent,
  ExamPaperVersion,
  ExamQuestion,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function POST(req: NextRequest) {
  const session = getCandidateSession(req);
  if (!session) return unauthorizedCandidateResponse();

  const body = await req.json().catch(() => ({}));
  const subPaper = String(body.subPaper || '').trim().toUpperCase();
  const subPaperMeta = SUB_PAPERS.find((p) => p.code === subPaper);
  if (!subPaperMeta) {
    return NextResponse.json({ success: false, message: 'Invalid paper selection.' }, { status: 400 });
  }

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
    return NextResponse.json({ success: false, message: 'This batch does not have sub-papers.' }, { status: 400 });
  }

  const existingAttempts = await listExamCollection<ExamAttempt>('exam_attempts', {
    registrationId: reg.id,
  });

  // Enforce mutual lock: if another sub-paper is currently in_progress, lock this one
  const otherInProgress = existingAttempts.find(
    (a) => a.subPaper !== subPaper && a.status === 'in_progress'
  );
  if (otherInProgress) {
    return NextResponse.json(
      {
        success: false,
        message: `${otherInProgress.subPaperLabel || 'Another paper'} is currently in progress. Please submit it first to unlock ${subPaperMeta.label}.`,
      },
      { status: 403 }
    );
  }

  let attempt = existingAttempts.find((a) => a.subPaper === subPaper);

  if (attempt && (attempt.status === 'submitted' || attempt.status === 'auto_submitted')) {
    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      status: attempt.status,
    });
  }

  if (!attempt) {
    const enterCheck = canEnterCbtExam(exam, batch, new Date());
    if (!enterCheck.allowed) {
      return NextResponse.json(
        { success: false, message: enterCheck.reason || 'Examination is not open now.' },
        { status: 403 }
      );
    }

    const paperVersions = await listExamCollection<ExamPaperVersion>('exam_paper_versions', {
      examId: exam.id,
      version: exam.activePaperVersion || 1,
    });
    const verified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
      batchId: reg.batchId,
      subPaper,
    });
    if (!verified) {
      return NextResponse.json(
        { success: false, message: `${subPaperMeta.label} has not been published by the administrator yet.` },
        { status: 503 }
      );
    }

    const allQuestions = await listExamCollection<ExamQuestion>(
      'exam_questions',
      { examId: exam.id, paperVersion: exam.activePaperVersion || 1, status: 'active' },
      { orderIndex: 1 }
    );
    const questions = filterQuestionsForTarget(allQuestions, {
      batchId: reg.batchId,
      subPaper,
      strictBatch: true,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, message: `No active questions found for ${subPaperMeta.label}.` },
        { status: 503 }
      );
    }

    const orderedQuestions = exam.cbtRules?.randomizeQuestions
      ? shuffleArray(questions)
      : questions;

    const questionSequence: AttemptQuestionSnapshot[] = orderedQuestions.map((q, idx) => {
      const optIds = q.options.map((o) => o.id);
      return {
        questionId: q.id,
        displayOrder: idx + 1,
        optionOrder: exam.cbtRules?.randomizeOptions ? shuffleArray(optIds) : optIds,
      };
    });

    const nowIso = new Date().toISOString();
    attempt = {
      id: `ATM-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      examId: exam.id,
      batchId: reg.batchId,
      subPaper,
      subPaperLabel: subPaperMeta.label,
      registrationId: reg.id,
      candidateId: reg.candidateId,
      uid: reg.uid,
      paperVersion: exam.activePaperVersion || 1,
      questionSequence,
      currentIndex: 0,
      status: 'not_started',
      startedAt: nowIso,
      expiresAt: exam.scheduleConfig.endAt,
      sessionTokenId: session.sessionTokenId,
      violationCount: 0,
      fullscreenExitCount: 0,
      tabSwitchCount: 0,
      windowBlurCount: 0,
    };

    await upsertExamDoc('exam_attempts', attempt);
  } else if (attempt.sessionTokenId !== session.sessionTokenId) {
    attempt = { ...attempt, sessionTokenId: session.sessionTokenId };
    await upsertExamDoc('exam_attempts', attempt);
  }

  return NextResponse.json({
    success: true,
    attemptId: attempt.id,
    status: attempt.status,
  });
}
