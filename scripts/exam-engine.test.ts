import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  canAcceptRegistration,
  canEnterCbtExam,
  resolveEffectiveExamStatus,
} from '../lib/examLifecycle';
import { evaluateAttemptAnswers } from '../lib/examEvaluator';
import { verifyExamRazorpaySignatureStrict } from '../lib/examPaymentHelper';
import { ExamAttempt, ExamEvent, ExamQuestion } from '../lib/examTypes';

function buildSampleExam(overrides: Partial<ExamEvent> = {}): ExamEvent {
  const now = Date.now();
  return {
    id: 'EXM-TEST-1',
    code: 'CLAT-TEST-26',
    publicSlug: 'clat-test-26',
    title: 'CLAT Scholarship Test',
    description: 'Test exam',
    eventType: 'online_cbt',
    participationMode: 'online',
    category: 'CLAT',
    targetAudience: 'CLAT Aspirants',
    instructions: 'Read carefully',
    status: 'published',
    registrationConfig: {
      isFree: false,
      feeAmount: 50,
      currency: 'INR',
      registrationOpenAt: new Date(now - 3600_000).toISOString(),
      registrationCloseAt: new Date(now + 3600_000).toISOString(),
      allowWebsiteRegistration: true,
      allowOfflineRegistration: true,
      eligibilityText: 'All',
      customFields: [],
      consentNotice: 'Agree',
    },
    scheduleConfig: {
      examDate: '2026-12-02',
      loginOpenAt: new Date(now + 7200_000).toISOString(),
      startAt: new Date(now + 7200_000).toISOString(),
      endAt: new Date(now + 14400_000).toISOString(),
      durationMinutes: 120,
      timezone: 'Asia/Kolkata',
      lateEntryGraceMinutes: 15,
      autoSubmitAtExpiry: true,
      reconnectPolicy: 'allow_resume',
    },
    cbtRules: {
      totalQuestions: 3,
      marksPerQuestion: 4,
      negativeMarking: 1,
      unansweredPolicy: 'zero',
      passingMarks: 4,
      randomizeQuestions: true,
      randomizeOptions: true,
      disablePreviousNav: true,
      requireFullscreen: true,
      tabSwitchThreshold: 3,
      fullscreenExitThreshold: 3,
      autoSubmitOnViolation: false,
      webcamRequired: false,
    },
    activePaperVersion: 1,
    paperVerified: true,
    hasStartedAttempts: false,
    qrVersion: 1,
    createdBy: 'Admin',
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    ...overrides,
  };
}

// 1. Lifecycle & Expiry Tests
{
  const draftExam = buildSampleExam({ status: 'draft' });
  assert.equal(resolveEffectiveExamStatus(draftExam), 'draft');
  assert.equal(canAcceptRegistration(draftExam, 0).allowed, false);

  const openExam = buildSampleExam({ status: 'published' });
  assert.equal(resolveEffectiveExamStatus(openExam), 'registration_open');
  assert.equal(canAcceptRegistration(openExam, 0).allowed, true);

  const endedExam = buildSampleExam({
    status: 'published',
    scheduleConfig: {
      ...buildSampleExam().scheduleConfig,
      startAt: new Date(Date.now() - 7200_000).toISOString(),
      endAt: new Date(Date.now() - 1000).toISOString(),
    },
  });
  assert.equal(resolveEffectiveExamStatus(endedExam), 'ended');
  assert.equal(canAcceptRegistration(endedExam, 0).allowed, false);
  assert.equal(canEnterCbtExam(endedExam).allowed, false);

  const liveExam = buildSampleExam({
    status: 'published',
    scheduleConfig: {
      ...buildSampleExam().scheduleConfig,
      loginOpenAt: new Date(Date.now() - 60_000).toISOString(),
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 3600_000).toISOString(),
    },
  });
  assert.equal(resolveEffectiveExamStatus(liveExam), 'live');
  assert.equal(canEnterCbtExam(liveExam).allowed, true);
}

// 2. Strict Payment Signature Verification (No sig_ bypass)
{
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_123';
  assert.equal(verifyExamRazorpaySignatureStrict('order_1', 'pay_1', 'sig_test_bypass'), false);
  const validSig = crypto
    .createHmac('sha256', 'test_secret_key_123')
    .update('order_1|pay_1')
    .digest('hex');
  assert.equal(verifyExamRazorpaySignatureStrict('order_1', 'pay_1', validSig), true);
}

// 3. Evaluation with Positive, Negative, Unanswered & Shuffled Option Order
{
  const exam = buildSampleExam();
  const questions: ExamQuestion[] = [
    {
      id: 'Q1',
      examId: exam.id,
      paperVersion: 1,
      orderIndex: 1,
      section: 'Law',
      text: 'Q1',
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '4' },
      ],
      correctOptionId: 'B',
      marks: 4,
      negativeMarks: 1,
      status: 'active',
      createdAt: '',
    },
    {
      id: 'Q2',
      examId: exam.id,
      paperVersion: 1,
      orderIndex: 2,
      section: 'Law',
      text: 'Q2',
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '4' },
      ],
      correctOptionId: 'C',
      marks: 4,
      negativeMarks: 1,
      status: 'active',
      createdAt: '',
    },
    {
      id: 'Q3',
      examId: exam.id,
      paperVersion: 1,
      orderIndex: 3,
      section: 'Law',
      text: 'Q3',
      options: [
        { id: 'A', text: '1' },
        { id: 'B', text: '2' },
        { id: 'C', text: '3' },
        { id: 'D', text: '4' },
      ],
      correctOptionId: 'A',
      marks: 4,
      negativeMarks: 1,
      status: 'active',
      createdAt: '',
    },
  ];

  const attempt: ExamAttempt = {
    id: 'ATM-1',
    examId: exam.id,
    registrationId: 'REG-1',
    candidateId: 'CND-1',
    uid: 'MSI-CLAT-26-0001',
    paperVersion: 1,
    questionSequence: [
      { questionId: 'Q2', displayOrder: 1, optionOrder: ['D', 'C', 'A', 'B'] },
      { questionId: 'Q1', displayOrder: 2, optionOrder: ['B', 'A', 'D', 'C'] },
      { questionId: 'Q3', displayOrder: 3, optionOrder: ['C', 'D', 'A', 'B'] },
    ],
    currentIndex: 2,
    status: 'submitted',
    startedAt: '',
    expiresAt: '',
    sessionTokenId: 'SES-1',
    violationCount: 0,
    fullscreenExitCount: 0,
    tabSwitchCount: 0,
    windowBlurCount: 0,
  };

  // Q1: B (correct +4), Q2: A (wrong -1), Q3: unanswered (0) => net 3 / 12 = 25%
  const result = evaluateAttemptAnswers({
    attempt,
    questions,
    answers: [
      { id: 'A1', attemptId: 'ATM-1', examId: exam.id, questionId: 'Q1', selectedOptionId: 'B', locked: true, savedAt: '' },
      { id: 'A2', attemptId: 'ATM-1', examId: exam.id, questionId: 'Q2', selectedOptionId: 'A', locked: true, savedAt: '' },
    ],
    cbtRules: exam.cbtRules,
  });

  assert.equal(result.rawScore, 3);
  assert.equal(result.maxScore, 12);
  assert.equal(result.percentage, 25);
  assert.equal(result.correctCount, 1);
  assert.equal(result.wrongCount, 1);
  assert.equal(result.unansweredCount, 1);
  assert.equal(result.passed, false);
}

console.log('ALL EXAM ENGINE UNIT TESTS PASSED');
