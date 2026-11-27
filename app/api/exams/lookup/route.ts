import { NextRequest, NextResponse } from 'next/server';
import { findOneExamDoc, listExamCollection } from '@/lib/examDb';
import { sanitizeIndianPhone } from '@/lib/smsService';
import { ExamBatch, ExamEvent, ExamRegistration } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = String(searchParams.get('uid') || '').trim().toUpperCase();
    const mobile = sanitizeIndianPhone(String(searchParams.get('mobile') || ''));

    if (!uid && !mobile) {
      return NextResponse.json(
        { success: false, message: 'Please provide Candidate UID or registered 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const filter: Record<string, any> = { registrationStatus: 'confirmed' };
    if (uid) filter.uid = uid;
    if (mobile) filter.mobile = mobile;

    const regs = await listExamCollection<ExamRegistration>('exam_registrations', filter, {
      registeredAt: -1,
    });

    if (regs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No confirmed registration found for these details.' },
        { status: 404 }
      );
    }

    const reg = regs[0];
    const [exam, batch] = await Promise.all([
      findOneExamDoc<ExamEvent>('exam_events', { id: reg.examId }),
      reg.batchId ? findOneExamDoc<ExamBatch>('exam_batches', { id: reg.batchId }) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      success: true,
      registration: reg,
      exam: exam
        ? {
            id: exam.id,
            code: exam.code,
            title: exam.title,
            category: exam.category,
            examDate: exam.scheduleConfig?.examDate,
            durationMinutes: exam.scheduleConfig?.durationMinutes,
            instructions: exam.instructions,
            contactPhones: exam.contactPhones,
          }
        : null,
      batchName: batch ? `${batch.batchCode} — ${batch.batchName}` : reg.customFieldValues?.stream || 'General',
    });
  } catch (err: any) {
    console.error('[GET /api/exams/lookup Error]', err);
    return NextResponse.json(
      { success: false, message: 'Unable to retrieve registration details.' },
      { status: 500 }
    );
  }
}
