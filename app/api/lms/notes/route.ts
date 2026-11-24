import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LMSNote {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  pdfPath: string;          // e.g. /uploads/notes/filename.pdf
  pdfOriginalName: string;
  gridFsFileId?: string;    // Persistent MongoDB GridFS document ID
  isPublished: boolean;
  uploadedBy: string;       // faculty name
  uploadedById: string;     // faculty id
  createdAt: string;
  updatedAt: string;
}

// ─── Disk helpers ─────────────────────────────────────────────────────────────

const DATA_DIR   = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'lms-notes.json');

function readNotesFromDisk(): LMSNote[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
    }
    if (fs.existsSync(NOTES_FILE)) {
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    try { fs.writeFileSync(NOTES_FILE, JSON.stringify([], null, 2), 'utf-8'); } catch (_) {}
    return [];
  } catch (err) {
    console.error('[LMS Notes Disk Error]', err);
    return [];
  }
}

function writeNotesToDisk(notes: LMSNote[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Notes Write Error]:', err);
  }
}

// ─── Mongo helpers ────────────────────────────────────────────────────────────

async function getNotesAsync(): Promise<LMSNote[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const col = db.collection<LMSNote>('lms_notes');
        const count = await col.countDocuments();
        if (count === 0) {
          const disk = readNotesFromDisk();
          if (disk.length > 0) await col.insertMany(disk as any);
        }
        const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
        return docs.map((d: any) => { const { _id, ...rest } = d; return rest as LMSNote; });
      }
    } catch (err) {
      console.warn('[LMS Notes MongoDB Error]:', err);
    }
  }
  return readNotesFromDisk();
}

async function syncNoteToMongo(note: LMSNote) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) {
      const { _id, ...clean }: any = note;
      await db.collection('lms_notes').updateOne({ id: note.id }, { $set: clean }, { upsert: true });
    }
  } catch (err) {
    console.warn('[LMS Note Mongo Upsert Error]:', err);
  }
}

async function deleteNoteFromMongo(id: string) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) await db.collection('lms_notes').deleteOne({ id });
  } catch (err) {
    console.warn('[LMS Note Mongo Delete Error]:', err);
  }
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId    = searchParams.get('courseId');
    const teacherId   = searchParams.get('teacherId');
    const publishedOnly = searchParams.get('published') === 'true';

    let notes = await getNotesAsync();

    if (courseId) {
      notes = notes.filter((n) => n.courseId === courseId);
    }
    if (teacherId) {
      notes = notes.filter((n) => n.uploadedById === teacherId);
    }
    if (publishedOnly) {
      notes = notes.filter((n) => n.isPublished);
    }

    return NextResponse.json({ success: true, notes, count: notes.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, description, courseId, courseName,
      pdfPath, pdfOriginalName, gridFsFileId, isPublished,
      uploadedBy, uploadedById,
    } = body;

    if (!title?.trim())         return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });
    if (!courseId?.trim())      return NextResponse.json({ success: false, message: 'Course ID is required.' }, { status: 400 });
    if (!pdfPath?.trim())       return NextResponse.json({ success: false, message: 'PDF path is required.' }, { status: 400 });
    if (!uploadedById?.trim())  return NextResponse.json({ success: false, message: 'Uploader ID is required.' }, { status: 400 });

    const now = new Date().toISOString();
    const note: LMSNote = {
      id:              `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title:           title.trim(),
      description:     (description || '').trim(),
      courseId:        courseId.trim(),
      courseName:      (courseName || '').trim(),
      pdfPath:         pdfPath.trim(),
      pdfOriginalName: (pdfOriginalName || path.basename(pdfPath)).trim(),
      gridFsFileId:    gridFsFileId ? String(gridFsFileId).trim() : undefined,
      isPublished:     isPublished === true,
      uploadedBy:      (uploadedBy || '').trim(),
      uploadedById:    uploadedById.trim(),
      createdAt:       now,
      updatedAt:       now,
    };

    const notes = readNotesFromDisk();
    notes.unshift(note);
    writeNotesToDisk(notes);
    await syncNoteToMongo(note);

    return NextResponse.json({ success: true, note, notes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) return NextResponse.json({ success: false, message: 'Note ID is required.' }, { status: 400 });

    const notes = readNotesFromDisk();
    const idx   = notes.findIndex((n) => n.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Note not found.' }, { status: 404 });

    notes[idx] = { ...notes[idx], ...updates, id, updatedAt: new Date().toISOString() };
    writeNotesToDisk(notes);
    await syncNoteToMongo(notes[idx]);

    // Also update mongo directly if running
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) await db.collection('lms_notes').updateOne({ id }, { $set: { ...updates, updatedAt: notes[idx].updatedAt } });
      } catch (_) {}
    }

    return NextResponse.json({ success: true, note: notes[idx], notes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update note' },
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

    if (!id) return NextResponse.json({ success: false, message: 'Note ID is required.' }, { status: 400 });

    const notes   = readNotesFromDisk();
    const filtered = notes.filter((n) => n.id !== id);

    if (filtered.length === notes.length) {
      return NextResponse.json({ success: false, message: 'Note not found.' }, { status: 404 });
    }

    writeNotesToDisk(filtered);
    await deleteNoteFromMongo(id);

    return NextResponse.json({ success: true, message: 'Note deleted.', notes: filtered });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
