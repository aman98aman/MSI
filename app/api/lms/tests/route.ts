import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index 0-3
  explanation?: string;
}

export interface LMSTest {
  id: string;
  title: string;
  instructions: string;
  courseId: string;
  courseName: string;
  questions: Question[];
  questionsPerStudent: number;
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: number; // 0 = none, 0.25 = quarter, etc.
  startDate: string;
  endDate: string;
  isPublished: boolean;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
}

// ─── Disk helpers ─────────────────────────────────────────────────────────────

const DATA_DIR   = path.join(process.cwd(), 'data');
const TESTS_FILE = path.join(DATA_DIR, 'lms-tests.json');

function readTestsFromDisk(): LMSTest[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
    }
    if (fs.existsSync(TESTS_FILE)) {
      const raw = fs.readFileSync(TESTS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    try { fs.writeFileSync(TESTS_FILE, JSON.stringify([], null, 2), 'utf-8'); } catch (_) {}
    return [];
  } catch (err) {
    console.error('[LMS Tests Disk Error]', err);
    return [];
  }
}

function writeTestsToDisk(tests: LMSTest[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Tests Write Error]:', err);
  }
}

// ─── Mongo helpers ────────────────────────────────────────────────────────────

async function getTestsAsync(): Promise<LMSTest[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const col = db.collection<LMSTest>('lms_tests');
        const count = await col.countDocuments();
        if (count === 0) {
          const disk = readTestsFromDisk();
          if (disk.length > 0) await col.insertMany(disk as any);
        }
        const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
        return docs.map((d: any) => { const { _id, ...rest } = d; return rest as LMSTest; });
      }
    } catch (err) {
      console.warn('[LMS Tests MongoDB Error]:', err);
    }
  }
  return readTestsFromDisk();
}

async function syncTestToMongo(test: LMSTest) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) {
      const { _id, ...clean }: any = test;
      await db.collection('lms_tests').updateOne({ id: test.id }, { $set: clean }, { upsert: true });
    }
  } catch (err) {
    console.warn('[LMS Test Mongo Upsert Error]:', err);
  }
}

async function deleteTestFromMongo(id: string) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) await db.collection('lms_tests').deleteOne({ id });
  } catch (err) {
    console.warn('[LMS Test Mongo Delete Error]:', err);
  }
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId  = searchParams.get('courseId');
    const teacherId = searchParams.get('teacherId');
    const publishedOnly = searchParams.get('published') === 'true';
    // Strip question correctAnswers for student view
    const studentView = searchParams.get('studentView') === 'true';

    let tests = await getTestsAsync();

    if (courseId)  tests = tests.filter((t) => t.courseId === courseId);
    if (teacherId) tests = tests.filter((t) => t.uploadedById === teacherId);
    if (publishedOnly) tests = tests.filter((t) => t.isPublished);

    if (studentView) {
      // Strip correct answers from returned question bank
      tests = tests.map((t) => ({
        ...t,
        questions: t.questions.map(({ correctAnswer: _ca, explanation: _ex, ...q }) => q as any),
      }));
    }

    return NextResponse.json({ success: true, tests, count: tests.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, instructions, courseId, courseName,
      questions, questionsPerStudent, durationMinutes,
      marksPerQuestion, negativeMarking,
      startDate, endDate, isPublished,
      uploadedBy, uploadedById,
    } = body;

    if (!title?.trim())         return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
    if (!courseId?.trim())      return NextResponse.json({ success: false, message: 'Course ID is required.' }, { status: 400 });
    if (!Array.isArray(questions) || questions.length === 0)
      return NextResponse.json({ success: false, message: 'At least one question is required.' }, { status: 400 });
    if (!uploadedById?.trim())  return NextResponse.json({ success: false, message: 'Uploader ID is required.' }, { status: 400 });

    const qPerStudent = Number(questionsPerStudent) || questions.length;
    if (qPerStudent > questions.length) {
      return NextResponse.json(
        { success: false, message: `questionsPerStudent (${qPerStudent}) cannot exceed total questions (${questions.length}).` },
        { status: 400 }
      );
    }

    // Ensure each question has an id
    const processedQuestions: Question[] = questions.map((q: any, i: number) => ({
      id:            q.id || `q-${Date.now()}-${i}`,
      text:          q.text || '',
      options:       Array.isArray(q.options) ? q.options : [],
      correctAnswer: Number(q.correctAnswer ?? 0),
      explanation:   q.explanation || undefined,
    }));

    const test: LMSTest = {
      id:                  `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title:               title.trim(),
      instructions:        (instructions || '').trim(),
      courseId:            courseId.trim(),
      courseName:          (courseName || '').trim(),
      questions:           processedQuestions,
      questionsPerStudent: qPerStudent,
      durationMinutes:     Number(durationMinutes) || 60,
      marksPerQuestion:    Number(marksPerQuestion) || 1,
      negativeMarking:     Number(negativeMarking) || 0,
      startDate:           startDate || '',
      endDate:             endDate || '',
      isPublished:         isPublished === true,
      uploadedBy:          (uploadedBy || '').trim(),
      uploadedById:        uploadedById.trim(),
      createdAt:           new Date().toISOString(),
    };

    const tests = readTestsFromDisk();
    tests.unshift(test);
    writeTestsToDisk(tests);
    await syncTestToMongo(test);

    return NextResponse.json({ success: true, test, tests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create test' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Test ID is required.' }, { status: 400 });

    const tests = readTestsFromDisk();
    const idx   = tests.findIndex((t) => t.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    tests[idx] = { ...tests[idx], ...updates, id };
    writeTestsToDisk(tests);
    await syncTestToMongo(tests[idx]);

    return NextResponse.json({ success: true, test: tests[idx], tests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update test' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json().catch(() => ({}));
        id = body?.id || null;
      } catch (_) {}
    }

    if (!id) return NextResponse.json({ success: false, message: 'Test ID is required.' }, { status: 400 });

    const tests    = readTestsFromDisk();
    const filtered = tests.filter((t) => t.id !== id);

    if (filtered.length === tests.length) {
      return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    }

    writeTestsToDisk(filtered);
    await deleteTestFromMongo(id);

    return NextResponse.json({ success: true, message: 'Test deleted.', tests: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}
