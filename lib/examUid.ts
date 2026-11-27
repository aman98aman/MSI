import fs from 'fs';
import path from 'path';
import { getExamDb } from './examDb';

const COUNTERS_FILE = path.join(process.cwd(), 'data', 'exams', 'exam_counters.json');

function readDiskCounters(): Record<string, number> {
  try {
    if (fs.existsSync(COUNTERS_FILE)) {
      const raw = fs.readFileSync(COUNTERS_FILE, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch (_) {}
  return {};
}

function writeDiskCounters(counters: Record<string, number>): void {
  try {
    const dir = path.dirname(COUNTERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COUNTERS_FILE, JSON.stringify(counters, null, 2), 'utf-8');
  } catch (_) {}
}

/**
 * Generates an atomic, globally unique Candidate UID (e.g. MSI-CLAT26-26-0001).
 * Uses MongoDB atomic $inc when available, with disk fallback for local offline dev.
 */
export async function generateCandidateUid(examCode: string, year?: number): Promise<string> {
  const yy = String(year || new Date().getFullYear()).slice(-2);
  const cleanCode = (examCode || 'EXAM')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'EXAM';

  const counterKey = `uid_${cleanCode}_${yy}`;
  let seq = 0;

  const db = await getExamDb();
  if (db) {
    try {
      const res = await db.collection<{ _id: string; seq: number }>('exam_counters').findOneAndUpdate(
        { _id: counterKey } as any,
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      if (res && typeof (res as any).seq === 'number') {
        seq = (res as any).seq;
      }
    } catch (err) {
      console.warn('[ExamUID] Mongo counter fallback:', err);
    }
  }

  if (seq <= 0) {
    const counters = readDiskCounters();
    seq = (counters[counterKey] || 0) + 1;
    counters[counterKey] = seq;
    writeDiskCounters(counters);
  }

  const padded = String(seq).padStart(4, '0');
  const candidateUid = `MSI-${cleanCode}-${yy}-${padded}`;

  // Extra safety: if MongoDB already has this UID (e.g. counter was reset), append a short random suffix
  if (db) {
    try {
      const exists = await db.collection('exam_candidates').findOne({ uid: candidateUid }, { projection: { _id: 1 } });
      if (exists) {
        const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
        return `MSI-${cleanCode}-${yy}-${padded}-${rand}`;
      }
    } catch {}
  }

  return candidateUid;
}
