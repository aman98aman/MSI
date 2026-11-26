import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  CANDIDATE_COOKIE_NAME,
  checkRateLimit,
  createCandidateSessionToken,
  getClientIp,
} from '@/lib/examAuth';
import { findOneExamDoc, listExamCollection, upsertExamDoc } from '@/lib/examDb';
import { canEnterCbtExam } from '@/lib/examLifecycle';
import { sanitizeIndianPhone } from '@/lib/smsService';
import {
  AttemptQuestionSnapshot,
  ExamAttempt,
  ExamBatch,
  ExamEvent,
  ExamPaperVersion,
  ExamQuestion,
  ExamRegistration,
} from '@/lib/examTypes';
import {
  filterQuestionsForTarget,
  isSubPaperBatch,
  isTargetPaperVerified,
} from '@/lib/examBatchHelper';

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
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`cnd_login_${ip}`, 15, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Please wait ${rate.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const uid = String(body.uid || '').trim().toUpperCase();
    const mobile = sanitizeIndianPhone(String(body.mobile || ''));
    const examCode = String(body.examCode || '').trim().toUpperCase();

    if (!uid || !mobile) {
      return NextResponse.json(
        { success: false, message: 'Candidate UID and registered 10-digit mobile number are required.' },
        { status: 400 }
      );
    }

    const regs = await listExamCollection<ExamRegistration>('exam_registrations', { uid });
    let reg = regs.find((r) => r.mobile === mobile && r.registrationStatus === 'confirmed');

    if (examCode && regs.length > 0) {
      const examByCode = await findOneExamDoc<ExamEvent>('exam_events', { code: examCode });
      if (examByCode) {
        reg = regs.find(
          (r) =>
            r.examId === examByCode.id &&
            r.mobile === mobile &&
            r.registrationStatus === 'confirmed'
        );
      }
    }

    if (!reg) {
      return NextResponse.json(
        {
          success: false,
          message: 'No confirmed registration found for this UID and mobile number.',
        },
        { status: 401 }
      );
    }

    if (reg.paymentStatus !== 'verified' && reg.paymentStatus !== 'free') {
      return NextResponse.json(
        { success: false, message: 'Payment is not verified for this registration.' },
        { status: 403 }
      );
    }

    const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: reg.examId });
    if (!exam) {
      return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
    }

    const batch = reg.batchId
      ? await findOneExamDoc<ExamBatch>('exam_batches', { id: reg.batchId })
      : null;

    const hasSubPapers = isSubPaperBatch(batch);

    if (hasSubPapers) {
      const existingAttempts = await listExamCollection<ExamAttempt>('exam_attempts', {
        registrationId: reg.id,
      });

      const enterCheck = canEnterCbtExam(exam, batch, new Date());
      if (!enterCheck.allowed && existingAttempts.length === 0) {
        return NextResponse.json(
          { success: false, message: enterCheck.reason || 'Examination is not open for login.' },
          { status: 403 }
        );
      }

      const activeAttempt = existingAttempts.find((a) => a.status === 'in_progress');
      const sessionTokenId =
        (exam.scheduleConfig.reconnectPolicy === 'allow_resume' ? null : activeAttempt?.sessionTokenId) ||
        `SES-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      if (activeAttempt && exam.scheduleConfig.reconnectPolicy === 'allow_resume') {
        await upsertExamDoc('exam_attempts', { ...activeAttempt, sessionTokenId });
      }

      const token = createCandidateSessionToken({
        candidateId: reg.candidateId,
        registrationId: reg.id,
        examId: exam.id,
        uid: reg.uid,
        sessionTokenId,
      });

      const res = NextResponse.json({
        success: true,
        hasSubPapers: true,
        redirectTo: '/exam/papers',
        examTitle: exam.title,
        batchName: batch?.batchName,
        uid: reg.uid,
      });

      res.cookies.set(CANDIDATE_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 8 * 60 * 60,
      });

      return res;
    }

    const existingAttempt = await findOneExamDoc<ExamAttempt>('exam_attempts', {
      registrationId: reg.id,
    });

    if (existingAttempt && (existingAttempt.status === 'submitted' || existingAttempt.status === 'auto_submitted')) {
      return NextResponse.json(
        {
          success: false,
          alreadySubmitted: true,
          message: 'You have already submitted your attempt for this examination.',
        },
        { status: 403 }
      );
    }

    const enterCheck = canEnterCbtExam(exam, batch, new Date());
    if (!enterCheck.allowed && !existingAttempt) {
      return NextResponse.json(
        { success: false, message: enterCheck.reason || 'Examination is not open for login.' },
        { status: 403 }
      );
    }

    const paperVersions = await listExamCollection<ExamPaperVersion>('exam_paper_versions', {
      examId: exam.id,
      version: exam.activePaperVersion || 1,
    });
    const paperVerified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
      batchId: reg.batchId,
    });

    if (!paperVerified) {
      return NextResponse.json(
        { success: false, message: 'Question paper for your selected batch has not been verified & published by the administrator yet.' },
        { status: 503 }
      );
    }

    const sessionTokenId =
      existingAttempt?.sessionTokenId || `SES-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    let attempt = existingAttempt;

    if (!attempt) {
      const allQuestions = await listExamCollection<ExamQuestion>(
        'exam_questions',
        { examId: exam.id, paperVersion: exam.activePaperVersion || 1, status: 'active' },
        { orderIndex: 1 }
      );
      const questions = filterQuestionsForTarget(allQuestions, {
        batchId: reg.batchId,
      });

      if (questions.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No active questions configured for your selected batch.' },
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
        registrationId: reg.id,
        candidateId: reg.candidateId,
        uid: reg.uid,
        paperVersion: exam.activePaperVersion || 1,
        questionSequence,
        currentIndex: 0,
        status: 'not_started',
        startedAt: nowIso,
        expiresAt: exam.scheduleConfig.endAt,
        sessionTokenId,
        violationCount: 0,
        fullscreenExitCount: 0,
        tabSwitchCount: 0,
        windowBlurCount: 0,
      };

      await upsertExamDoc('exam_attempts', attempt);
    } else if (exam.scheduleConfig.reconnectPolicy === 'allow_resume') {
      // Refresh sessionTokenId on reconnect so old stale tab is invalidated
      attempt = { ...attempt, sessionTokenId };
      await upsertExamDoc('exam_attempts', attempt);
    }

    const token = createCandidateSessionToken({
      candidateId: reg.candidateId,
      registrationId: reg.id,
      examId: exam.id,
      uid: reg.uid,
      sessionTokenId,
    });

    const res = NextResponse.json({
      success: true,
      attemptId: attempt.id,
      examTitle: exam.title,
      uid: reg.uid,
      status: attempt.status,
    });

    res.cookies.set(CANDIDATE_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    console.error('[POST /api/exams/auth/login Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Candidate login failed.' },
      { status: 500 }
    );
  }
}
