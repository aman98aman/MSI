import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import { listExamCollection } from '@/lib/examDb';
import { ExamAttempt, ExamProctorEvent, ExamRegistration } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const { searchParams } = new URL(req.url);
  const attemptId = searchParams.get('attemptId');

  if (attemptId) {
    const events = await listExamCollection<ExamProctorEvent>(
      'exam_proctor_events',
      { examId, attemptId },
      { createdAt: 1 }
    );
    return NextResponse.json({ success: true, events });
  }

  const [attempts, registrations, events] = await Promise.all([
    listExamCollection<ExamAttempt>('exam_attempts', { examId }, { startedAt: -1 }),
    listExamCollection<ExamRegistration>('exam_registrations', { examId }),
    listExamCollection<ExamProctorEvent>('exam_proctor_events', { examId }, { createdAt: -1 }),
  ]);

  const regMap = new Map(registrations.map((r) => [r.id, r]));

  const rows = attempts.map((a) => {
    const reg = regMap.get(a.registrationId);
    const attemptEvents = events.filter((e) => e.attemptId === a.id);
    return {
      ...a,
      fullName: reg?.fullName || 'Candidate',
      mobile: reg?.mobile || '',
      recentEvents: attemptEvents.slice(0, 10),
    };
  });

  return NextResponse.json({ success: true, attempts: rows });
}
