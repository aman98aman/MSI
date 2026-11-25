import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import {
  deleteExamDoc,
  findOneExamDoc,
  insertAuditLog,
  listExamCollection,
  upsertExamDoc,
} from '@/lib/examDb';
import { ExamBatch, ExamEvent } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const batches = await listExamCollection<ExamBatch>('exam_batches', { examId }, { createdAt: 1 });
  return NextResponse.json({ success: true, batches });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const batchCode = String(body.batchCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const batchName = String(body.batchName || '').trim();

  if (!batchCode || !batchName) {
    return NextResponse.json(
      { success: false, message: 'Batch code and batch name are required.' },
      { status: 400 }
    );
  }

  const existingBatches = await listExamCollection<ExamBatch>('exam_batches', { examId });
  if (existingBatches.some((b) => b.batchCode === batchCode)) {
    return NextResponse.json(
      { success: false, message: `Batch code "${batchCode}" already exists in this exam.` },
      { status: 409 }
    );
  }

  const batch: ExamBatch = {
    id: `BAT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    examId,
    batchCode,
    batchName,
    scheduleOverride: body.scheduleOverride || undefined,
    venueOverride: body.venueOverride || undefined,
    capacity: body.capacity ? Number(body.capacity) : undefined,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await upsertExamDoc('exam_batches', batch);
  await insertAuditLog({
    entityType: 'batch',
    entityId: batch.id,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: 'CREATE_BATCH',
    summary: `Added batch ${batch.batchName} (${batch.batchCode}) to ${exam.code}`,
  });

  return NextResponse.json({ success: true, batch }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  if (!batchId) {
    return NextResponse.json({ success: false, message: 'batchId is required.' }, { status: 400 });
  }

  await deleteExamDoc('exam_batches', { id: batchId, examId });
  return NextResponse.json({ success: true });
}
