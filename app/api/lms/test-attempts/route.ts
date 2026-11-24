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

interface ScoringItem {
  id: string;
  correctAnswer: number;
  marksPerQuestion: number;
  negativeMarking: number;
}

// ─── Disk helpers ─────────────────────────────────────────────────────────────

const DATA_DIR      = path.join(process.cwd(), 'data');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'lms-test-attempts.json');
const TESTS_FILE    = path.join(DATA_DIR, 'lms-tests.json');
const SCORING_FILE  = path.join(DATA_DIR, 'lms-attempts-scoring.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (_) {}
}

function readAttemptsFromDisk(): TestAttempt[] {
  try {
    ensureDataDir();
    if (fs.existsSync(ATTEMPTS_FILE)) {
      const raw = fs.readFileSync(ATTEMPTS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.error('[LMS Attempts Disk Error]', err);
  }
  return [];
}

function writeAttemptsToDisk(attempts: TestAttempt[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Attempts Write Error]:', err);
  }
}

function readScoringStoreFromDisk(): Record<string, ScoringItem[]> {
  try {
    ensureDataDir();
    if (fs.existsSync(SCORING_FILE)) {
      const raw = fs.readFileSync(SCORING_FILE, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch (_) {}
  return {};
}

function writeScoringStoreToDisk(store: Record<string, ScoringItem[]>): void {
  try {
    ensureDataDir();
    fs.writeFileSync(SCORING_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Scoring Store Write Error]:', err);
  }
}

function readTestsFromDisk(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(TESTS_FILE)) {
      const raw = fs.readFileSync(TESTS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (_) {}
  return [];
}

// ─── Mongo helpers ────────────────────────────────────────────────────────────

async function getTestsAsync(): Promise<any[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const docs = await db.collection('lms_tests').find({}).sort({ createdAt: -1 }).toArray();
        if (docs && docs.length > 0) {
          return docs.map((d: any) => { const { _id, ...rest } = d; return rest; });
        }
      }
    } catch (err) {
      console.warn('[LMS Attempts MongoDB Tests Error]:', err);
    }
  }
  return readTestsFromDisk();
}

async function getAttemptsAsync(): Promise<TestAttempt[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const docs = await db.collection('lms_test_attempts').find({}).sort({ startedAt: -1 }).toArray();
        if (docs && docs.length > 0) {
          return docs.map((d: any) => { const { _id, ...rest } = d; return rest as TestAttempt; });
        }
      }
    } catch (err) {
      console.warn('[LMS Attempts MongoDB Read Error]:', err);
    }
  }
  return readAttemptsFromDisk();
}

async function getAttemptByIdAsync(attemptId: string): Promise<TestAttempt | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const doc = await db.collection('lms_test_attempts').findOne({ id: attemptId });
        if (doc) {
          const { _id, ...rest } = doc;
          return rest as TestAttempt;
        }
      }
    } catch (err) {
      console.warn('[LMS Attempt Find Error]:', err);
    }
  }
  const disk = readAttemptsFromDisk();
  return disk.find((a) => a.id === attemptId) || null;
}

async function saveAttemptAsync(attempt: TestAttempt): Promise<void> {
  // 1. Save to MongoDB Atlas
  if (isMongoConfigured()) {
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

  // 2. Save to local disk cache (non-blocking)
  try {
    const disk = readAttemptsFromDisk();
    const idx = disk.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) {
      disk[idx] = attempt;
    } else {
      disk.unshift(attempt);
    }
    writeAttemptsToDisk(disk);
  } catch (_) {}
}

async function saveScoringKeyAsync(attemptId: string, items: ScoringItem[]): Promise<void> {
  // 1. Save to MongoDB Atlas
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        await db.collection('lms_scoring_keys').updateOne(
          { attemptId },
          { $set: { attemptId, items, createdAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[LMS Scoring Mongo Upsert Error]:', err);
    }
  }

  // 2. Save to local disk cache (non-blocking)
  try {
    const store = readScoringStoreFromDisk();
    store[attemptId] = items;
    writeScoringStoreToDisk(store);
  } catch (_) {}
}

async function getScoringKeyAsync(attemptId: string): Promise<ScoringItem[] | null> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const doc = await db.collection('lms_scoring_keys').findOne({ attemptId });
        if (doc && Array.isArray(doc.items)) {
          return doc.items as ScoringItem[];
        }
      }
    } catch (err) {
      console.warn('[LMS Scoring Mongo Read Error]:', err);
    }
  }
  const store = readScoringStoreFromDisk();
  return store[attemptId] || null;
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

      const attempt = await getAttemptByIdAsync(attemptId);
      if (!attempt) return NextResponse.json({ success: false, message: 'Attempt not found.' }, { status: 404 });

      const log: ActivityLog = { type: type || 'unknown', timestamp: new Date().toISOString(), detail };
      attempt.activityLogs = [...(attempt.activityLogs || []), log];
      await saveAttemptAsync(attempt);

      return NextResponse.json({ success: true, logged: log });
    }

    // ── Action: start new attempt ─────────────────────────────────────────────
    const { testId, studentPhone, studentName } = body;

    if (!testId)       return NextResponse.json({ success: false, message: 'Test ID is required to start examination.' }, { status: 400 });
    if (!studentPhone) return NextResponse.json({ success: false, message: 'Student mobile number is required to start examination.' }, { status: 400 });

    const cleanPhone = studentPhone.replace(/\D/g, '').slice(-10);

    // Prevent duplicate attempts
    const existing = await getAttemptsAsync();
    const duplicate = existing.find(
      (a) =>
        a.testId === testId &&
        (a.studentPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone &&
        a.status !== 'timed-out'
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: 'An active or submitted attempt for this test already exists.', attemptId: duplicate.id },
        { status: 409 }
      );
    }

    // Load test from MongoDB Atlas (with local fallback)
    const tests = await getTestsAsync();
    const test  = tests.find((t: any) => t.id === testId);
    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found on server. Please refresh your course tests.' }, { status: 404 });
    }
    if (!test.isPublished) {
      return NextResponse.json({ success: false, message: 'This test is currently unpublished by faculty.' }, { status: 403 });
    }

    // Check test window (allow 10-minute clock tolerance)
    const now = new Date();
    if (test.startDate) {
      const startDate = new Date(test.startDate);
      if (!isNaN(startDate.getTime()) && now.getTime() < startDate.getTime() - 10 * 60 * 1000) {
        return NextResponse.json({ success: false, message: `Test opens on ${startDate.toLocaleDateString('en-IN')}.` }, { status: 403 });
      }
    }
    if (test.endDate) {
      const endDate = new Date(test.endDate);
      if (!isNaN(endDate.getTime()) && now.getTime() > endDate.getTime() + 10 * 60 * 1000) {
        return NextResponse.json({ success: false, message: `Examination closed on ${endDate.toLocaleDateString('en-IN')}.` }, { status: 403 });
      }
    }

    // Randomly select questions
    const questionBank: any[] = test.questions || [];
    if (questionBank.length === 0) {
      return NextResponse.json({ success: false, message: 'This test has no questions uploaded yet. Contact faculty.' }, { status: 400 });
    }

    const qPerStudent: number = Math.min(test.questionsPerStudent || questionBank.length, questionBank.length);
    const shuffled = shuffleArray(questionBank);
    const assigned = shuffled.slice(0, qPerStudent);

    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Save scoring key to MongoDB Atlas (server only - includes correctAnswer)
    const scoringItems: ScoringItem[] = assigned.map((q: any) => ({
      id:               q.id,
      correctAnswer:    Number(q.correctAnswer ?? 0),
      marksPerQuestion: Number(test.marksPerQuestion || 1),
      negativeMarking:  Number(test.negativeMarking || 0),
    }));
    await saveScoringKeyAsync(attemptId, scoringItems);

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

    await saveAttemptAsync(attempt);

    // Return assigned questions WITHOUT correctAnswer / explanation
    const assignedForStudent = assigned.map(({ correctAnswer: _ca, explanation: _ex, ...q }: any) => q);

    return NextResponse.json({
      success: true,
      attempt,
      assignedQuestions: assignedForStudent,
      durationMinutes:   test.durationMinutes,
    });
  } catch (error: any) {
    console.error('[Start Attempt Error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to initialize examination attempt.' },
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

    const attempt = await getAttemptByIdAsync(attemptId);
    if (!attempt) return NextResponse.json({ success: false, message: 'Attempt not found.' }, { status: 404 });

    if (attempt.status === 'submitted') {
      return NextResponse.json({ success: false, message: 'Attempt has already been submitted.' }, { status: 409 });
    }

    // Merge answers
    if (answers && typeof answers === 'object') {
      attempt.answers = { ...attempt.answers, ...answers };
    }

    if (action === 'save') {
      // Just persist current answers
      await saveAttemptAsync(attempt);
      return NextResponse.json({ success: true, message: 'Answers saved.', attempt });
    }

    // submit or timeout
    const submittedAt = new Date().toISOString();
    attempt.submittedAt = submittedAt;
    attempt.status      = action === 'timeout' ? 'timed-out' : 'submitted';

    // ── Score calculation ──────────────────────────────────────────────────────
    const scoringKey = await getScoringKeyAsync(attemptId);

    if (scoringKey && Array.isArray(scoringKey)) {
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

    await saveAttemptAsync(attempt);

    return NextResponse.json({
      success: true,
      message: `Attempt ${action === 'timeout' ? 'timed out' : 'submitted'} successfully.`,
      attempt,
      score:    attempt.score,
      maxScore: attempt.maxScore,
    });
  } catch (error: any) {
    console.error('[Patch Attempt Error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update test attempt.' },
      { status: 500 }
    );
  }
}
