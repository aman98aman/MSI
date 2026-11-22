import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActivityLog {
  type: string;
  timestamp: string;
  detail?: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  studentPhone: string;
  studentName: string;
  assignedQuestionIds: string[];
  answers: Record<string, number>;
  score?: number;
  maxScore?: number;
  startedAt: string;
  submittedAt?: string;
  status: 'in-progress' | 'submitted' | 'timed-out';
  activityLogs: ActivityLog[];
}

// Server-side only: maps attemptId -> full question data for scoring
interface AssignedQuestionsStore {
  [attemptId: string]: Array<{ id: string; correctAnswer: number; marksPerQuestion: number; negativeMarking: number }>;
}

// ─── Disk helpers ─────────────────────────────────────────────────────────────

const DATA_DIR      = path.join(process.cwd(), 'data');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'lms-test-attempts.json');
const TESTS_FILE    = path.join(DATA_DIR, 'lms-tests.json');
// Secret store for server-side scoring (never returned to client)
const SCORING_FILE  = path.join(DATA_DIR, 'lms-attempts-scoring.json');

function readAttemptsFromDisk(): TestAttempt[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
    }
    if (fs.existsSync(ATTEMPTS_FILE)) {
      const raw = fs.readFileSync(ATTEMPTS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    try { fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify([], null, 2), 'utf-8'); } catch (_) {}
    return [];
  } catch (err) {
    console.error('[LMS Attempts Disk Error]', err);
    return [];
  }
}

function writeAttemptsToDisk(attempts: TestAttempt[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Attempts Write Error]:', err);
  }
}

function readScoringStore(): AssignedQuestionsStore {
  try {
    if (fs.existsSync(SCORING_FILE)) {
      const raw = fs.readFileSync(SCORING_FILE, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
    return {};
  } catch (_) { return {}; }
}

function writeScoringStore(store: AssignedQuestionsStore): void {
  try {
    fs.writeFileSync(SCORING_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Scoring Store Write Error]:', err);
  }
}

function readTests(): any[] {
  try {
    if (fs.existsSync(TESTS_FILE)) {
      const raw = fs.readFileSync(TESTS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    return [];
  } catch (_) { return []; }
}

// ─── Mongo helpers ────────────────────────────────────────────────────────────

async function getAttemptsAsync(): Promise<TestAttempt[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const col = db.collection<TestAttempt>('lms_test_attempts');
        const count = await col.countDocuments();
        if (count === 0) {
          const disk = readAttemptsFromDisk();
          if (disk.length > 0) await col.insertMany(disk as any);
        }
        const docs = await col.find({}).sort({ startedAt: -1 }).toArray();
        return docs.map((d: any) => { const { _id, ...rest } = d; return rest as TestAttempt; });
      }
    } catch (err) {
      console.warn('[LMS Attempts MongoDB Error]:', err);
    }
  }
  return readAttemptsFromDisk();
}

async function syncAttemptToMongo(attempt: TestAttempt) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) {
      const { _id, ...clean }: any = attempt;
      await db.collection('lms_test_attempts').updateOne(
        { id: attempt.id },
        { $set: clean },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('[LMS Attempt Mongo Upsert Error]:', err);
  }
}

// ─── Helper: Fisher-Yates shuffle ────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testId       = searchParams.get('testId');
    const studentPhone = searchParams.get('studentPhone');

    if (!testId) {
      return NextResponse.json({ success: false, message: 'testId is required.' }, { status: 400 });
    }

    const all = await getAttemptsAsync();
    const forTest = all.filter((a) => a.testId === testId);

    if (studentPhone) {
      // Student view: return single attempt for this phone
      const cleanPhone = studentPhone.replace(/\D/g, '').slice(-10);
      const attempt = forTest.find(
        (a) => (a.studentPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone
      );
      if (!attempt) {
        return NextResponse.json({ success: true, attempt: null, exists: false });
      }
      // Strip correctAnswer from returned data (scoring is server-side)
      return NextResponse.json({ success: true, attempt, exists: true });
    }

    // Faculty view: all attempts for the test (with scores)
    return NextResponse.json({ success: true, attempts: forTest, count: forTest.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Action: log-activity ──────────────────────────────────────────────────
    if (body.action === 'log-activity') {
      const { attemptId, type, detail } = body;
      if (!attemptId) return NextResponse.json({ success: false, message: 'attemptId required.' }, { status: 400 });

      const attempts = readAttemptsFromDisk();
      const idx = attempts.findIndex((a) => a.id === attemptId);
      if (idx === -1) return NextResponse.json({ success: false, message: 'Attempt not found.' }, { status: 404 });

      const log: ActivityLog = { type: type || 'unknown', timestamp: new Date().toISOString(), detail };
      attempts[idx].activityLogs = [...(attempts[idx].activityLogs || []), log];
      writeAttemptsToDisk(attempts);
      await syncAttemptToMongo(attempts[idx]);

      return NextResponse.json({ success: true, logged: log });
    }

    // ── Action: start new attempt ─────────────────────────────────────────────
    const { testId, studentPhone, studentName } = body;

    if (!testId)       return NextResponse.json({ success: false, message: 'testId is required.' }, { status: 400 });
    if (!studentPhone) return NextResponse.json({ success: false, message: 'studentPhone is required.' }, { status: 400 });

    const cleanPhone = studentPhone.replace(/\D/g, '').slice(-10);

    // Prevent duplicate attempts
    const existing = readAttemptsFromDisk();
    const duplicate = existing.find(
      (a) =>
        a.testId === testId &&
        (a.studentPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone &&
        a.status !== 'timed-out'
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'An attempt for this test already exists.', attemptId: duplicate.id },
        { status: 409 }
      );
    }

    // Load test
    const tests = readTests();
    const test  = tests.find((t: any) => t.id === testId);
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    if (!test.isPublished) return NextResponse.json({ success: false, message: 'Test is not published.' }, { status: 403 });

    // Check test window
    const now = new Date();
    if (test.startDate && now < new Date(test.startDate)) {
      return NextResponse.json({ success: false, message: 'Test has not started yet.' }, { status: 403 });
    }
    if (test.endDate && now > new Date(test.endDate)) {
      return NextResponse.json({ success: false, message: 'Test window has closed.' }, { status: 403 });
    }

    // Randomly select questions
    const questionBank: any[] = test.questions || [];
    const qPerStudent: number = Math.min(test.questionsPerStudent || questionBank.length, questionBank.length);
    const shuffled = shuffleArray(questionBank);
    const assigned = shuffled.slice(0, qPerStudent);

    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Save scoring key (server only - includes correctAnswer)
    const scoringStore = readScoringStore();
    scoringStore[attemptId] = assigned.map((q: any) => ({
      id:              q.id,
      correctAnswer:   q.correctAnswer,
      marksPerQuestion: test.marksPerQuestion || 1,
      negativeMarking: test.negativeMarking || 0,
    }));
    writeScoringStore(scoringStore);

    const attempt: TestAttempt = {
      id:                  attemptId,
      testId,
      studentPhone:        cleanPhone,
      studentName:         (studentName || '').trim(),
      assignedQuestionIds: assigned.map((q: any) => q.id),
      answers:             {},
      startedAt:           now.toISOString(),
      status:              'in-progress',
      activityLogs:        [],
    };

    existing.unshift(attempt);
    writeAttemptsToDisk(existing);
    await syncAttemptToMongo(attempt);

    // Return assigned questions WITHOUT correctAnswer / explanation
    const assignedForStudent = assigned.map(({ correctAnswer: _ca, explanation: _ex, ...q }: any) => q);

    return NextResponse.json({
      success: true,
      attempt,
      assignedQuestions: assignedForStudent,
      durationMinutes:   test.durationMinutes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create attempt' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, answers, action } = body;

    if (!attemptId) return NextResponse.json({ success: false, message: 'attemptId is required.' }, { status: 400 });
    if (!action || !['save', 'submit', 'timeout'].includes(action)) {
      return NextResponse.json({ success: false, message: "action must be 'save', 'submit', or 'timeout'." }, { status: 400 });
    }

    const attempts = readAttemptsFromDisk();
    const idx = attempts.findIndex((a) => a.id === attemptId);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Attempt not found.' }, { status: 404 });

    const attempt = attempts[idx];

    if (attempt.status === 'submitted') {
      return NextResponse.json({ success: false, message: 'Attempt already submitted.' }, { status: 409 });
    }

    // Merge answers
    if (answers && typeof answers === 'object') {
      attempt.answers = { ...attempt.answers, ...answers };
    }

    if (action === 'save') {
      // Just persist current answers
      attempts[idx] = attempt;
      writeAttemptsToDisk(attempts);
      await syncAttemptToMongo(attempt);
      return NextResponse.json({ success: true, message: 'Answers saved.', attempt });
    }

    // submit or timeout
    const submittedAt = new Date().toISOString();
    attempt.submittedAt = submittedAt;
    attempt.status      = action === 'timeout' ? 'timed-out' : 'submitted';

    // ── Score calculation ──────────────────────────────────────────────────────
    const scoringStore = readScoringStore();
    const scoringKey   = scoringStore[attemptId];

    if (scoringKey) {
      let score    = 0;
      let maxScore = 0;

      for (const sq of scoringKey) {
        maxScore += sq.marksPerQuestion;
        const chosen = attempt.answers[sq.id];
        if (chosen === undefined || chosen === null) continue; // unattempted
        if (chosen === sq.correctAnswer) {
          score += sq.marksPerQuestion;
        } else {
          score -= sq.negativeMarking;
        }
      }

      attempt.score    = Math.max(0, Math.round(score * 100) / 100);
      attempt.maxScore = maxScore;
    }

    attempts[idx] = attempt;
    writeAttemptsToDisk(attempts);
    await syncAttemptToMongo(attempt);

    return NextResponse.json({
      success: true,
      message: `Attempt ${action === 'timeout' ? 'timed out' : 'submitted'} successfully.`,
      attempt,
      score:    attempt.score,
      maxScore: attempt.maxScore,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update attempt' },
      { status: 500 }
    );
  }
}
