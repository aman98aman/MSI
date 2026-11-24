import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCoursesAsync, addCourseAsync, deleteCourseAsync } from '@/lib/courseStore';
import { MSICourse } from '@/lib/lmsStore';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { courses, deletedIds } = await getCoursesAsync();
    return NextResponse.json({
      success: true,
      courses,
      deletedIds,
      count: courses.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to read courses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.title) {
      return NextResponse.json(
        { success: false, message: 'Course title is required.' },
        { status: 400 }
      );
    }

    const courseId = body.id || `crs-msi-${Date.now().toString().slice(-6)}`;
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newCourse: MSICourse = {
      id: courseId,
      slug,
      title: body.title.trim(),
      headline: body.headline?.trim() || 'Comprehensive Curriculum & Judicial Practice',
      description: body.description?.trim() || 'Official curriculum accredited by MSI Group of Institutes.',
      category: body.category || 'Judiciary',
      department: 'law',
      badge: body.badge || 'Hot & New',
      rating: body.rating || 5.0,
      reviewCount: body.reviewCount || 1,
      totalDuration: body.totalDuration || '40 hours',
      totalLectures: body.totalLectures || (body.sections ? body.sections.reduce((acc: number, s: any) => acc + (s.lectures?.length || 0), 0) : 1),
      level: body.level || 'All Levels',
      thumbnail: body.thumbnail || '/images/courses/clat.jpg',
      price: Number(body.price) || 4999,
      originalPrice: Number(body.originalPrice) || 14999,
      isFreeForMsiStudents: body.isFreeForMsiStudents ?? true,
      instructorId: body.instructorId || 'fac-harshit-01',
      instructorName: body.instructorName || 'Harshit Singh',
      instructorTitle: body.instructorTitle || 'Professor of Law & Faculty Jurist',
      instructorAvatar: body.instructorAvatar || '/images/avatars/avatar-1.webp',
      whatYouWillLearn: body.whatYouWillLearn || [
        'Mastery over ratio decidendi and obiter dicta distinctions',
        'Timed answer drafting drills and Bare Act interpretations',
        'Live judicial mentoring and doubt clearing',
      ],
      requirements: body.requirements || ['Dedication to daily legal study drills', 'No prior legal diploma required'],
      pdfUrl: body.pdfUrl || undefined,
      pdfOriginalName: body.pdfOriginalName || undefined,
      mockTestPdfs: Array.isArray(body.mockTestPdfs)
        ? body.mockTestPdfs
        : body.pdfUrl
        ? [
            {
              title: body.pdfOriginalName || `${body.title.trim()} - Mock Test & Answers`,
              pdfUrl: body.pdfUrl,
              size: 'PDF Document',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : undefined,
      sections: (() => {
        let secs = body.sections;
        const pdfUrl = body.pdfUrl;
        const pdfOriginalName = body.pdfOriginalName;
        if (!secs || !Array.isArray(secs) || secs.length === 0) {
          secs = [
            {
              id: `sec-${Date.now()}-1`,
              title: 'Module 1: Mock Test Papers & Curriculum Overview',
              duration: '3 hours',
              lectures: [
                {
                  id: `lec-${Date.now()}-1`,
                  title: body.lectureTitle || `${body.title.trim()} - Mock Test Paper & Guidelines`,
                  duration: '45 mins',
                  durationSeconds: 2700,
                  videoUrl: body.lectureVideo || 'https://vz-389201.b-cdn.net/sample.mp4',
                  preview: true,
                  summary: 'Comprehensive mock test paper and evaluation guidelines for enrolled candidates.',
                  resources: pdfUrl
                    ? [
                        {
                          title: pdfOriginalName || `${body.title.trim()} - Official Mock Test Paper (PDF)`,
                          type: 'pdf',
                          size: 'Official PDF',
                          downloadUrl: pdfUrl,
                        },
                      ]
                    : [
                        {
                          title: 'Official Lecture Handout & Landmark Briefs',
                          type: 'pdf',
                          size: '2.4 MB',
                          downloadUrl: '#',
                        },
                      ],
                },
              ],
            },
          ];
        } else if (pdfUrl && secs[0]?.lectures?.[0]) {
          const existingResources = secs[0].lectures[0].resources || [];
          const hasPdf = existingResources.some((r: any) => r.downloadUrl === pdfUrl);
          if (!hasPdf) {
            secs[0].lectures[0].resources = [
              {
                title: pdfOriginalName || `${body.title.trim()} - Official Mock Test Paper (PDF)`,
                type: 'pdf',
                size: 'Official PDF',
                downloadUrl: pdfUrl,
              },
              ...existingResources,
            ];
          }
        }
        return secs;
      })(),
      updatedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      language: body.language || 'English & Bilingual Legal Notes',
      isPublished: true,
    };

    const updated = await addCourseAsync(newCourse);

    // Auto-sync into LMS Notes collection so students can also see it in Notes & Materials Tab
    if (newCourse.pdfUrl) {
      try {
        const DATA_DIR = path.join(process.cwd(), 'data');
        const NOTES_FILE = path.join(DATA_DIR, 'lms-notes.json');
        let currentNotes: any[] = [];
        if (fs.existsSync(NOTES_FILE)) {
          try {
            const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
            if (raw) currentNotes = JSON.parse(raw);
          } catch (_) {}
        }
        const existingNoteIdx = currentNotes.findIndex(
          (n: any) => n.courseId === courseId || n.pdfPath === newCourse.pdfUrl
        );
        const noteDoc = {
          id:
            existingNoteIdx >= 0
              ? currentNotes[existingNoteIdx].id
              : `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: `${newCourse.title} - Mock Test & Study Notes`,
          description: `Official mock test question paper and comprehensive legal notes for ${newCourse.title}.`,
          courseId: courseId,
          courseName: newCourse.title,
          pdfPath: newCourse.pdfUrl,
          pdfOriginalName: newCourse.pdfOriginalName || path.basename(newCourse.pdfUrl) || 'MockTest.pdf',
          isPublished: true,
          uploadedBy: newCourse.instructorName || 'Super Admin',
          uploadedById: newCourse.instructorId || 'super-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (existingNoteIdx >= 0) {
          currentNotes[existingNoteIdx] = noteDoc;
        } else {
          currentNotes.unshift(noteDoc);
        }
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(NOTES_FILE, JSON.stringify(currentNotes, null, 2), 'utf-8');

        if (isMongoConfigured()) {
          const db = await getDb();
          if (db) {
            await db.collection('lms_notes').updateOne({ id: noteDoc.id }, { $set: noteDoc }, { upsert: true });
          }
        }
      } catch (noteErr) {
        console.warn('[Courses API] Failed to auto-sync mock test PDF note:', noteErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Course "${newCourse.title}" successfully saved and published to Home Screen!`,
      course: newCourse,
      courses: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save course' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Course ID is required.' }, { status: 400 });
    }
    const updated = await deleteCourseAsync(id);
    return NextResponse.json({
      success: true,
      message: 'Course deleted from system.',
      courses: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Error deleting course' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
