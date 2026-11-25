import { ExamBatch, ExamEvent, ExamLifecycleStatus } from './examTypes';

/**
 * Resolves the authoritative server-side lifecycle status of an ExamEvent
 * using the server clock. Never trusts client timestamps.
 */
export function resolveEffectiveExamStatus(
  exam: ExamEvent,
  now: Date = new Date()
): ExamLifecycleStatus {
  if (
    exam.status === 'draft' ||
    exam.status === 'cancelled' ||
    exam.status === 'archived' ||
    exam.status === 'results_published' ||
    exam.status === 'results_processing'
  ) {
    return exam.status;
  }

  const nowMs = now.getTime();
  const regOpenMs = exam.registrationConfig?.registrationOpenAt
    ? Date.parse(exam.registrationConfig.registrationOpenAt)
    : NaN;
  const regCloseMs = exam.registrationConfig?.registrationCloseAt
    ? Date.parse(exam.registrationConfig.registrationCloseAt)
    : NaN;
  const startMs = exam.scheduleConfig?.startAt
    ? Date.parse(exam.scheduleConfig.startAt)
    : NaN;
  const endMs = exam.scheduleConfig?.endAt
    ? Date.parse(exam.scheduleConfig.endAt)
    : NaN;

  // 1. Exam has ended
  if (!Number.isNaN(endMs) && nowMs > endMs) {
    return 'ended';
  }

  // 2. Exam is currently live
  if (!Number.isNaN(startMs) && nowMs >= startMs && (Number.isNaN(endMs) || nowMs <= endMs)) {
    return 'live';
  }

  // 3. Explicit registration closed or past closing window
  if (exam.status === 'registration_closed' || (!Number.isNaN(regCloseMs) && nowMs > regCloseMs)) {
    return 'upcoming';
  }

  // 4. Registration paused by admin
  if (exam.registrationConfig?.registrationPaused) {
    return 'registration_closed';
  }

  // 5. Within registration window
  if (
    (Number.isNaN(regOpenMs) || nowMs >= regOpenMs) &&
    (Number.isNaN(regCloseMs) || nowMs <= regCloseMs)
  ) {
    return 'registration_open';
  }

  // 6. Published, waiting for registration to open
  return 'published';
}

export function canAcceptRegistration(
  exam: ExamEvent,
  currentConfirmedCount: number,
  now: Date = new Date()
): { allowed: boolean; reason?: string; effectiveStatus: ExamLifecycleStatus } {
  const effectiveStatus = resolveEffectiveExamStatus(exam, now);

  if (effectiveStatus === 'draft') {
    return { allowed: false, reason: 'This examination is not published yet.', effectiveStatus };
  }
  if (effectiveStatus === 'cancelled') {
    return { allowed: false, reason: 'This examination has been cancelled.', effectiveStatus };
  }
  if (effectiveStatus === 'archived' || effectiveStatus === 'ended' || effectiveStatus === 'results_processing' || effectiveStatus === 'results_published') {
    return { allowed: false, reason: 'This examination is no longer available.', effectiveStatus };
  }
  if (exam.registrationConfig?.registrationPaused) {
    return { allowed: false, reason: 'Registration is currently paused by the administrator.', effectiveStatus };
  }
  if (effectiveStatus === 'registration_closed' || effectiveStatus === 'upcoming' || effectiveStatus === 'live') {
    return { allowed: false, reason: 'Registration for this examination is closed.', effectiveStatus };
  }
  if (effectiveStatus === 'published') {
    return { allowed: false, reason: 'Registration has not opened yet.', effectiveStatus };
  }

  const maxReg = exam.registrationConfig?.maxRegistrations;
  if (maxReg && maxReg > 0 && currentConfirmedCount >= maxReg) {
    return { allowed: false, reason: 'Maximum seat capacity has been reached.', effectiveStatus: 'registration_closed' };
  }

  return { allowed: true, effectiveStatus };
}

export function canEnterCbtExam(
  exam: ExamEvent,
  batch?: ExamBatch | null,
  now: Date = new Date()
): { allowed: boolean; reason?: string; effectiveStatus: ExamLifecycleStatus } {
  const effectiveStatus = resolveEffectiveExamStatus(exam, now);

  if (exam.eventType !== 'online_cbt' && exam.eventType !== 'hybrid') {
    return { allowed: false, reason: 'This event does not use the online CBT exam engine.', effectiveStatus };
  }
  if (effectiveStatus === 'cancelled') {
    return { allowed: false, reason: 'This examination has been cancelled.', effectiveStatus };
  }
  if (effectiveStatus === 'archived' || effectiveStatus === 'ended' || effectiveStatus === 'results_processing' || effectiveStatus === 'results_published') {
    return { allowed: false, reason: 'This examination is no longer available.', effectiveStatus };
  }
  if (effectiveStatus === 'draft') {
    return { allowed: false, reason: 'This examination is not published.', effectiveStatus };
  }

  const loginOpenAt = batch?.scheduleOverride?.loginOpenAt || exam.scheduleConfig.loginOpenAt;
  const startAt = batch?.scheduleOverride?.startAt || exam.scheduleConfig.startAt;
  const endAt = batch?.scheduleOverride?.endAt || exam.scheduleConfig.endAt;

  const nowMs = now.getTime();
  const loginMs = loginOpenAt ? Date.parse(loginOpenAt) : Date.parse(startAt);
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);
  const graceMs = (exam.scheduleConfig.lateEntryGraceMinutes ?? 15) * 60 * 1000;

  if (!Number.isNaN(loginMs) && nowMs < loginMs) {
    return { allowed: false, reason: 'Examination login window has not opened yet.', effectiveStatus };
  }
  if (!Number.isNaN(endMs) && nowMs > endMs) {
    return { allowed: false, reason: 'This examination has ended.', effectiveStatus: 'ended' };
  }
  if (!Number.isNaN(startMs) && exam.scheduleConfig.lateEntryGraceMinutes >= 0 && nowMs > startMs + graceMs) {
    return { allowed: false, reason: 'Late-entry window for starting this examination has closed.', effectiveStatus };
  }

  return { allowed: true, effectiveStatus };
}

export function getUnavailableMessage(status: ExamLifecycleStatus): string {
  if (status === 'cancelled') {
    return 'This examination has been cancelled by MSI Group of Institutes.';
  }
  return 'This examination is no longer available.';
}
