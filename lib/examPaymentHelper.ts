import crypto from 'crypto';
import { getRazorpayCredentials } from './razorpay';
import { findOneExamDoc, insertAuditLog, upsertExamDoc } from './examDb';
import { generateCandidateUid } from './examUid';
import { ExamCandidate, ExamEvent, ExamPayment, ExamRegistration } from './examTypes';

/**
 * Strict Razorpay HMAC SHA-256 payment signature verification.
 * Never accepts mock/bypass signatures.
 */
export function verifyExamRazorpaySignatureStrict(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!orderId || !paymentId || !signature) return false;
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) return false;

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Strict Razorpay Webhook HMAC SHA-256 signature verification.
 */
export function verifyExamWebhookSignatureStrict(
  rawBody: string,
  signature: string | null
): boolean {
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Idempotently confirms a paid registration and issues a unique Candidate UID.
 */
export async function confirmPaidRegistrationIdempotent(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  via: 'verify_endpoint' | 'webhook';
}): Promise<{
  success: boolean;
  alreadyConfirmed?: boolean;
  registration?: ExamRegistration;
  payment?: ExamPayment;
  message?: string;
}> {
  const payment = await findOneExamDoc<ExamPayment>('exam_payments', {
    razorpayOrderId: params.razorpayOrderId,
  });

  if (!payment) {
    return { success: false, message: 'Payment order not found in examination ledger.' };
  }

  const registration = await findOneExamDoc<ExamRegistration>('exam_registrations', {
    id: payment.registrationId,
  });

  if (!registration) {
    return { success: false, message: 'Registration record not found for this payment.' };
  }

  // Idempotency check: if already verified & confirmed, return existing UID
  if (payment.status === 'verified' && registration.registrationStatus === 'confirmed' && registration.uid) {
    return {
      success: true,
      alreadyConfirmed: true,
      registration,
      payment,
    };
  }

  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: registration.examId });
  const nowIso = new Date().toISOString();

  // Ensure candidate profile & UID exist
  let candidate = await findOneExamDoc<ExamCandidate>('exam_candidates', {
    id: registration.candidateId,
  });

  let uid = candidate?.uid || registration.uid;
  if (!uid) {
    uid = await generateCandidateUid(exam?.code || 'EXAM');
  }

  if (candidate && !candidate.uid) {
    candidate = { ...candidate, uid, updatedAt: nowIso };
    await upsertExamDoc('exam_candidates', candidate);
  }

  const updatedPayment: ExamPayment = {
    ...payment,
    uid,
    candidateId: registration.candidateId,
    status: 'verified',
    razorpayPaymentId: params.razorpayPaymentId,
    razorpaySignature: params.razorpaySignature || payment.razorpaySignature,
    webhookProcessed: params.via === 'webhook' ? true : payment.webhookProcessed,
    verifiedAt: payment.verifiedAt || nowIso,
  };

  const updatedRegistration: ExamRegistration = {
    ...registration,
    uid,
    registrationStatus: 'confirmed',
    paymentStatus: 'verified',
    confirmedAt: registration.confirmedAt || nowIso,
  };

  await Promise.all([
    upsertExamDoc('exam_payments', updatedPayment),
    upsertExamDoc('exam_registrations', updatedRegistration),
  ]);

  await insertAuditLog({
    entityType: 'payment',
    entityId: updatedPayment.id,
    examId: registration.examId,
    actorId: params.via,
    actorName: params.via === 'webhook' ? 'Razorpay Webhook' : 'Payment Verifier',
    action: 'PAYMENT_VERIFIED_UID_ISSUED',
    summary: `Verified payment ${params.razorpayPaymentId} (₹${updatedPayment.amount}) and issued UID ${uid}`,
  });

  return {
    success: true,
    alreadyConfirmed: false,
    registration: updatedRegistration,
    payment: updatedPayment,
  };
}
