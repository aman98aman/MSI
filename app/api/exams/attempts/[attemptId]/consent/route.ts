import { NextRequest, NextResponse } from 'next/server';
import { getAttemptAndExamForCandidate } from '@/lib/examAttemptHelper';
import { getCandidateSession, getClientIp, unauthorizedCandidateResponse } from '@/lib/examAuth';
import { CONSENT_VERSION, MSI_FULL_CONSENT_STATEMENT } from '@/lib/examConsent';
import { findOneExamDoc, insertAuditLog, upsertExamDoc } from '@/lib/examDb';
import { ExamBatch, ExamConsentRecord, ExamRegistration } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = getCandidateSession(req);
  if (!session) return unauthorizedCandidateResponse();

  const { attemptId } = await context.params;
  const check = await getAttemptAndExamForCandidate(
    attemptId,
    session.registrationId,
    session.sessionTokenId
  );
  if (check.error || !check.attempt || !check.exam) {
    return NextResponse.json(
      { success: false, message: check.error },
      { status: check.statusCode || 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!body.accepted) {
    return NextResponse.json(
      { success: false, message: 'You must tick the consent checkbox to proceed.' },
      { status: 400 }
    );
  }

  const { attempt, exam } = check;

  // Prevent duplicate consent submissions for the same exam & consent version
  const existingConsent = await findOneExamDoc<ExamConsentRecord>('exam_consents', {
    registrationId: attempt.registrationId,
    examId: exam.id,
    consentVersion: CONSENT_VERSION,
  });

  if (existingConsent) {
    return NextResponse.json({
      success: true,
      alreadyAccepted: true,
      consentRecord: existingConsent,
    });
  }

  const [reg, batch] = await Promise.all([
    findOneExamDoc<ExamRegistration>('exam_registrations', { id: attempt.registrationId }),
    attempt.batchId
      ? findOneExamDoc<ExamBatch>('exam_batches', { id: attempt.batchId })
      : Promise.resolve(null),
  ]);

  const nowIso = new Date().toISOString();
  const consentRecord: ExamConsentRecord = {
    id: `CNS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    registrationId: attempt.registrationId,
    candidateId: attempt.candidateId,
    uid: attempt.uid,
    fullName: reg?.fullName || 'Candidate',
    email: reg?.email || '',
    mobile: reg?.mobile || '',
    examId: exam.id,
    examTitle: exam.title,
    batchId: attempt.batchId,
    batchName: batch ? `${batch.batchCode} (${batch.batchName})` : reg?.customFieldValues?.stream,
    consentVersion: CONSENT_VERSION,
    consentStatement: MSI_FULL_CONSENT_STATEMENT,
    accepted: true,
    acceptedAt: nowIso,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get('user-agent') || undefined,
  };

  await upsertExamDoc('exam_consents', consentRecord);
  await insertAuditLog({
    entityType: 'registration',
    entityId: attempt.registrationId,
    examId: exam.id,
    actorId: attempt.candidateId,
    actorName: consentRecord.fullName,
    action: 'EXAM_CONSENT_ACCEPTED',
    summary: `Candidate ${consentRecord.fullName} (${attempt.uid}) accepted consent ${CONSENT_VERSION}`,
  });

  return NextResponse.json({
    success: true,
    consentRecord,
  });
}
