import fs from 'fs';
import path from 'path';
import { Db } from 'mongodb';
import { getDb, isMongoConfigured, resetMongoClientCache } from './mongodb';

const EXAM_DATA_DIR = path.join(process.cwd(), 'data', 'exams');
const TMP_EXAM_DATA_DIR = path.join('/tmp', 'msi-exams');

function getWritableExamDataDir(): string {
  try {
    if (!fs.existsSync(EXAM_DATA_DIR)) {
      fs.mkdirSync(EXAM_DATA_DIR, { recursive: true });
    }
    fs.accessSync(EXAM_DATA_DIR, fs.constants.W_OK);
    return EXAM_DATA_DIR;
  } catch {
    try {
      if (!fs.existsSync(TMP_EXAM_DATA_DIR)) {
        fs.mkdirSync(TMP_EXAM_DATA_DIR, { recursive: true });
      }
      return TMP_EXAM_DATA_DIR;
    } catch {
      return EXAM_DATA_DIR;
    }
  }
}

export function readExamCollectionFromDisk<T>(collectionName: string): T[] {
  for (const dir of [EXAM_DATA_DIR, TMP_EXAM_DATA_DIR]) {
    try {
      const filePath = path.join(dir, `${collectionName}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed as T[];
        }
      }
    } catch (err) {
      console.error(`[ExamDisk Read Error: ${collectionName}]`, err);
    }
  }
  return [];
}

export function writeExamCollectionToDisk<T>(collectionName: string, items: T[]): void {
  try {
    const dir = getWritableExamDataDir();
    const filePath = path.join(dir, `${collectionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[ExamDisk Write Error: ${collectionName}]`, err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _msiExamIndexesReady: boolean | undefined;
}

export async function getExamDb(): Promise<Db | null> {
  if (!isMongoConfigured()) return null;
  try {
    const db = (await Promise.race([
      getDb(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6500)),
    ])) as Db | null;

    if (db && !global._msiExamIndexesReady) {
      global._msiExamIndexesReady = true;
      void ensureExamIndexes(db).catch((err) => {
        console.warn('[ExamDB Index Init Warning]:', err?.message || err);
      });
    }
    return db;
  } catch (err) {
    console.warn('[ExamDB Connection Error]:', err);
    return null;
  }
}

export async function repairEmptyCandidateUids(db: Db): Promise<void> {
  try {
    const brokenCandidates = await db
      .collection('exam_candidates')
      .find({ $or: [{ uid: '' }, { uid: null }, { uid: { $exists: false } }] })
      .toArray();

    for (const cand of brokenCandidates) {
      let resolvedUid = '';
      if (cand.id) {
        const reg = await db.collection('exam_registrations').findOne({
          candidateId: cand.id,
          uid: { $type: 'string', $ne: '' },
        });
        if (reg?.uid) resolvedUid = String(reg.uid);
      }
      if (!resolvedUid) {
        const suffix = `${Date.now().toString().slice(-4)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        resolvedUid = `MSI-CND-${new Date().getFullYear().toString().slice(-2)}-${suffix}`;
      }
      await db
        .collection('exam_candidates')
        .updateOne({ _id: cand._id }, { $set: { uid: resolvedUid, updatedAt: new Date().toISOString() } });
    }
  } catch (err) {
    console.warn('[ExamDB] repairEmptyCandidateUids warning:', err);
  }
}

async function ensureExamIndexes(db: Db): Promise<void> {
  // Repair any legacy candidate documents that have uid: "" before enforcing unique index
  await repairEmptyCandidateUids(db);

  // Drop legacy single-paper unique indexes that prevent multi-batch papers & multi-paper attempts
  await Promise.allSettled([
    db.collection('exam_paper_versions').dropIndex('examId_1_version_1'),
    db.collection('exam_attempts').dropIndex('registrationId_1'),
    db.collection('exam_candidates').dropIndex('uid_1'),
  ]);

  await Promise.allSettled([
    db.collection('exam_events').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_events').createIndex({ code: 1 }, { unique: true }),
    db.collection('exam_events').createIndex({ publicSlug: 1 }, { unique: true }),
    db.collection('exam_events').createIndex({ status: 1, createdAt: -1 }),

    db.collection('exam_batches').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_batches').createIndex({ examId: 1, batchCode: 1 }, { unique: true }),

    db.collection('exam_candidates').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_candidates').createIndex(
      { uid: 1 },
      { unique: true, partialFilterExpression: { uid: { $type: 'string', $gt: '' } } }
    ),
    db.collection('exam_candidates').createIndex({ mobile: 1 }),
    db.collection('exam_candidates').createIndex({ email: 1 }),

    db.collection('exam_registrations').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_registrations').createIndex({ examId: 1, candidateId: 1 }, { unique: true }),
    db.collection('exam_registrations').createIndex({ examId: 1, mobile: 1 }, { unique: true }),
    db.collection('exam_registrations').createIndex({ uid: 1 }),

    db.collection('exam_payments').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_payments').createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true }),
    db.collection('exam_payments').createIndex({ razorpayPaymentId: 1 }, { unique: true, sparse: true }),
    db.collection('exam_payments').createIndex({ registrationId: 1 }),

    db.collection('exam_paper_versions').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_paper_versions').createIndex({ examId: 1, batchId: 1, subPaper: 1, version: 1 }),

    db.collection('exam_questions').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_questions').createIndex({ examId: 1, batchId: 1, subPaper: 1, paperVersion: 1, orderIndex: 1 }),

    db.collection('exam_attempts').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_attempts').createIndex({ registrationId: 1, subPaper: 1 }),
    db.collection('exam_attempts').createIndex({ examId: 1, status: 1 }),

    db.collection('exam_answers').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_answers').createIndex({ attemptId: 1, questionId: 1 }, { unique: true }),

    db.collection('exam_proctor_events').createIndex({ attemptId: 1, createdAt: 1 }),
    db.collection('exam_proctor_events').createIndex({ examId: 1, createdAt: -1 }),

    db.collection('exam_attendance').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_attendance').createIndex({ registrationId: 1 }, { unique: true }),

    db.collection('exam_consents').createIndex({ id: 1 }, { unique: true }),
    db.collection('exam_consents').createIndex({ registrationId: 1, examId: 1, consentVersion: 1 }, { unique: true }),
    db.collection('exam_consents').createIndex({ examId: 1, acceptedAt: -1 }),

    db.collection('exam_audit_logs').createIndex({ entityId: 1, createdAt: -1 }),
    db.collection('exam_audit_logs').createIndex({ examId: 1, createdAt: -1 }),
  ]);
}

export async function listExamCollection<T extends { id: string }>(
  collectionName: string,
  filter: Record<string, any> = {},
  sort: Record<string, 1 | -1> = { createdAt: -1 }
): Promise<T[]> {
  // When MongoDB is configured, always use it — never fall back to stale disk files
  const mongoConfigured = isMongoConfigured();

  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await getExamDb();
    if (db) {
      try {
        const docs = await Promise.race([
          db.collection(collectionName).find(filter).sort(sort).toArray(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (docs) {
          return docs.map((d: any) => {
            const { _id, ...rest } = d;
            return rest as T;
          });
        }
        // MongoDB timed out — retry once, then give up (no disk fallback when Mongo is configured)
      } catch (err) {
        console.warn(`[ExamDB List Error: ${collectionName}]`, err);
        resetMongoClientCache();
        continue;
      }
    }
    break;
  }

  // Disk fallback ONLY when MongoDB is not configured at all (pure offline local dev)
  if (mongoConfigured) {
    console.warn(`[ExamDB] MongoDB unavailable for ${collectionName} — returning empty (disk fallback disabled when MONGODB_URI is set)`);
    return [];
  }

  const disk = readExamCollectionFromDisk<T>(collectionName);
  return disk.filter((item: any) =>
    Object.entries(filter).every(([k, v]) => item[k] === v)
  );
}

export async function findOneExamDoc<T extends { id: string }>(
  collectionName: string,
  filter: Record<string, any>
): Promise<T | null> {
  const mongoConfigured = isMongoConfigured();

  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await getExamDb();
    if (db) {
      try {
        const doc = await Promise.race([
          db.collection(collectionName).findOne(filter),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (doc) {
          const { _id, ...rest } = doc as any;
          return rest as T;
        }
        // null result = document not found in MongoDB (not a timeout)
        if (mongoConfigured) return null;
        break;
      } catch (err) {
        console.warn(`[ExamDB FindOne Error: ${collectionName}]`, err);
        resetMongoClientCache();
        continue;
      }
    }
    break;
  }

  // Disk fallback ONLY when MongoDB is not configured at all
  if (mongoConfigured) {
    console.warn(`[ExamDB] MongoDB unavailable for findOne ${collectionName} — returning null (disk fallback disabled)`);
    return null;
  }

  const disk = readExamCollectionFromDisk<T>(collectionName);
  return (
    disk.find((item: any) =>
      Object.entries(filter).every(([k, v]) => item[k] === v)
    ) || null
  );
}

export async function upsertExamDoc<T extends { id: string }>(
  collectionName: string,
  doc: T
): Promise<T> {
  const mongoConfigured = isMongoConfigured();

  // Write to disk only in pure offline mode (no MONGODB_URI).
  // When MongoDB is configured, disk writes are skipped to prevent stale local data
  // diverging from the live Atlas database.
  if (!mongoConfigured) {
    const disk = readExamCollectionFromDisk<T>(collectionName);
    const idx = disk.findIndex((item) => item.id === doc.id);
    if (idx >= 0) disk[idx] = doc;
    else disk.unshift(doc);
    writeExamCollectionToDisk(collectionName, disk);
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await getExamDb();
    if (db) {
      try {
        const { _id, ...clean }: any = doc;
        await db
          .collection(collectionName)
          .updateOne({ id: doc.id }, { $set: clean }, { upsert: true });
        return doc;
      } catch (err) {
        console.warn(`[ExamDB Upsert Error: ${collectionName}]`, err);
        resetMongoClientCache();
        if (attempt === 1) throw err;
      }
    } else {
      resetMongoClientCache();
    }
  }
  return doc;
}

export async function deleteExamDoc(
  collectionName: string,
  filter: Record<string, any>
): Promise<void> {
  // Disk delete only in pure offline mode
  if (!isMongoConfigured()) {
    const disk = readExamCollectionFromDisk<any>(collectionName);
    const remaining = disk.filter(
      (item) => !Object.entries(filter).every(([k, v]) => item[k] === v)
    );
    writeExamCollectionToDisk(collectionName, remaining);
  }

  const db = await getExamDb();
  if (db) {
    await db.collection(collectionName).deleteMany(filter);
  }
}

export async function insertAuditLog(log: {
  entityType: 'exam' | 'batch' | 'paper' | 'registration' | 'payment' | 'result' | 'attendance';
  entityId: string;
  examId?: string;
  actorId: string;
  actorName: string;
  action: string;
  summary: string;
  before?: any;
  after?: any;
}): Promise<void> {
  const entry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...log,
    createdAt: new Date().toISOString(),
  };
  await upsertExamDoc('exam_audit_logs', entry);
}
