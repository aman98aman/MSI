import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';
import { getEnrollmentsAsync } from '@/lib/enrollmentStore';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const NOTES_FILE = path.join(DATA_DIR, 'lms-notes.json');

async function findNoteById(noteId: string) {
  // Check MongoDB first if configured
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const doc = await db.collection('lms_notes').findOne({ id: noteId });
        if (doc) return doc;
      }
    } catch (err) {
      console.warn('[PDF Access] Mongo error finding note:', err);
    }
  }

  // Fallback to disk
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const notes = JSON.parse(raw);
        if (Array.isArray(notes)) {
          return notes.find((n: any) => n.id === noteId);
        }
      }
    }
  } catch (err) {
    console.error('[PDF Access] Disk error reading notes:', err);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');
    const studentPhone = searchParams.get('studentPhone');
    const role = searchParams.get('role'); // 'faculty' | 'admin'

    if (!noteId) {
      return NextResponse.json(
        { success: false, message: 'Note ID is required.' },
        { status: 400 }
      );
    }

    // 1. Fetch Note Details
    const note = await findNoteById(noteId);
    if (!note) {
      return NextResponse.json(
        { success: false, message: 'Requested study material not found.' },
        { status: 404 }
      );
    }

    // 2. Validate Access Permissions
    const isPrivileged = role === 'faculty' || role === 'admin' || role === 'superadmin';

    if (!isPrivileged) {
      if (!studentPhone) {
        return NextResponse.json(
          { success: false, message: 'Access denied: Authentication required.' },
          { status: 401 }
        );
      }

      const cleanPhone = studentPhone.replace(/\D/g, '').slice(-10);
      const allEnrollments = await getEnrollmentsAsync();

      // Check if student has active enrollment for this course
      const isEnrolled = allEnrollments.some((e: any) => {
        const enrolledPhone = (e.studentPhone || '').replace(/\D/g, '').slice(-10);
        const matchesCourse =
          (e.courseId && (e.courseId === note.courseId || note.courseId.includes(e.courseId))) ||
          (e.courseTitle && note.courseName && e.courseTitle.toLowerCase().trim() === note.courseName.toLowerCase().trim());
        return enrolledPhone === cleanPhone && matchesCourse;
      });

      if (!isEnrolled) {
        return NextResponse.json(
          {
            success: false,
            message: 'Access restricted: You are not enrolled in the course associated with this document.',
          },
          { status: 403 }
        );
      }
    }

    // 3. Resolve PDF Physical Path
    let physicalPath = '';
    if (note.pdfPath.startsWith('/') || note.pdfPath.startsWith('\\')) {
      physicalPath = path.join(process.cwd(), 'public', note.pdfPath.replace(/^[/\\]+/, ''));
    } else {
      physicalPath = path.join(process.cwd(), 'public', note.pdfPath);
    }

    if (!fs.existsSync(physicalPath)) {
      // Also check direct uploads path
      const directPublic = path.join(process.cwd(), 'public', 'uploads', 'notes', path.basename(note.pdfPath));
      if (fs.existsSync(directPublic)) {
        physicalPath = directPublic;
      } else {
        return NextResponse.json(
          { success: false, message: 'PDF document file missing on host server.' },
          { status: 404 }
        );
      }
    }

    const fileBuffer = fs.readFileSync(physicalPath);

    // 4. Return PDF with secure headers (inline view only, disable sniffing, disable caching)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="msi-secured-notes.pdf"',
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('[PDF Access Endpoint Error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error while accessing PDF.' },
      { status: 500 }
    );
  }
}
