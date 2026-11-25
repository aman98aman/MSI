import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import { insertAuditLog, listExamCollection, upsertExamDoc } from '@/lib/examDb';
import { ExamAttendance, ExamRegistration } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const [registrations, attendances] = await Promise.all([
    listExamCollection<ExamRegistration>('exam_registrations', {
      examId,
      registrationStatus: 'confirmed',
    }),
    listExamCollection<ExamAttendance>('exam_attendance', { examId }),
  ]);

  const roster = registrations.map((reg) => {
    const att = attendances.find((a) => a.registrationId === reg.id);
    return {
      registrationId: reg.id,
      candidateId: reg.candidateId,
      uid: reg.uid,
      fullName: reg.fullName,
      mobile: reg.mobile,
      email: reg.email,
      participationMode: reg.participationMode,
      batchId: reg.batchId,
      attendanceStatus: att?.status || 'unmarked',
      checkedInAt: att?.checkedInAt || null,
      operatorId: att?.operatorId || null,
    };
  });

  return NextResponse.json({ success: true, roster });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const registrationId = String(body.registrationId || '').trim();
  const status = body.status === 'absent' ? 'absent' : 'present';

  if (!registrationId) {
    return NextResponse.json({ success: false, message: 'registrationId is required.' }, { status: 400 });
  }

  const regs = await listExamCollection<ExamRegistration>('exam_registrations', {
    id: registrationId,
    examId,
  });
  const reg = regs[0];
  if (!reg) {
    return NextResponse.json({ success: false, message: 'Registration not found.' }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const existing = await listExamCollection<ExamAttendance>('exam_attendance', {
    registrationId,
    examId,
  });

  const record: ExamAttendance = {
    id: existing[0]?.id || `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    examId,
    batchId: reg.batchId,
    registrationId,
    candidateId: reg.candidateId,
    uid: reg.uid,
    status,
    checkedInAt: status === 'present' ? nowIso : undefined,
    operatorId: admin.actorId,
    notes: body.notes ? String(body.notes).trim() : undefined,
  };

  await upsertExamDoc('exam_attendance', record);
  await insertAuditLog({
    entityType: 'attendance',
    entityId: record.id,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: `MARK_ATTENDANCE_${status.toUpperCase()}`,
    summary: `Marked ${reg.uid} (${reg.fullName}) as ${status}`,
  });

  return NextResponse.json({ success: true, attendance: record });
}
