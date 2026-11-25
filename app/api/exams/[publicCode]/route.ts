import { NextRequest, NextResponse } from 'next/server';
import { findOneExamDoc, listExamCollection } from '@/lib/examDb';
import {
  canAcceptRegistration,
  getUnavailableMessage,
  resolveEffectiveExamStatus,
} from '@/lib/examLifecycle';
import { ExamBatch, ExamEvent, ExamRegistration } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ publicCode: string }> }
) {
  try {
    const { publicCode } = await context.params;
    const clean = decodeURIComponent(publicCode || '').trim();

    let exam = await findOneExamDoc<ExamEvent>('exam_events', { publicSlug: clean });
    if (!exam) {
      exam = await findOneExamDoc<ExamEvent>('exam_events', { code: clean.toUpperCase() });
    }

    if (!exam || exam.status === 'draft') {
      return NextResponse.json(
        {
          success: false,
          unavailable: true,
          message: 'This examination is no longer available.',
        },
        { status: 404 }
      );
    }

    const now = new Date();
    const effectiveStatus = resolveEffectiveExamStatus(exam, now);

    if (
      effectiveStatus === 'ended' ||
      effectiveStatus === 'cancelled' ||
      effectiveStatus === 'archived' ||
      effectiveStatus === 'results_processing' ||
      effectiveStatus === 'results_published'
    ) {
      return NextResponse.json({
        success: true,
        unavailable: true,
        effectiveStatus,
        message: getUnavailableMessage(effectiveStatus),
        exam: {
          id: exam.id,
          code: exam.code,
          title: exam.title,
          eventType: exam.eventType,
          category: exam.category,
          effectiveStatus,
          cancellationReason: exam.cancellationReason,
          contactPhones: exam.contactPhones,
          contactEmail: exam.contactEmail,
        },
      });
    }

    const [batches, registrations] = await Promise.all([
      listExamCollection<ExamBatch>('exam_batches', { examId: exam.id }, { createdAt: 1 }),
      listExamCollection<ExamRegistration>('exam_registrations', {
        examId: exam.id,
        registrationStatus: 'confirmed',
      }),
    ]);

    const regCheck = canAcceptRegistration(exam, registrations.length, now);

    // Return ONLY safe public metadata — NEVER questions, answer keys, or candidate lists
    return NextResponse.json({
      success: true,
      unavailable: false,
      effectiveStatus,
      canRegister: regCheck.allowed,
      registrationMessage: regCheck.reason || null,
      confirmedCount: registrations.length,
      exam: {
        id: exam.id,
        code: exam.code,
        publicSlug: exam.publicSlug,
        title: exam.title,
        description: exam.description,
        eventType: exam.eventType,
        participationMode: exam.participationMode,
        category: exam.category,
        targetAudience: exam.targetAudience,
        instructions: exam.instructions,
        bannerUrl: exam.bannerUrl,
        contactPhones: exam.contactPhones,
        contactEmail: exam.contactEmail,
        effectiveStatus,
        registrationConfig: {
          isFree: exam.registrationConfig.isFree,
          feeAmount: exam.registrationConfig.feeAmount,
          currency: exam.registrationConfig.currency,
          registrationOpenAt: exam.registrationConfig.registrationOpenAt,
          registrationCloseAt: exam.registrationConfig.registrationCloseAt,
          maxRegistrations: exam.registrationConfig.maxRegistrations,
          allowWebsiteRegistration: exam.registrationConfig.allowWebsiteRegistration,
          eligibilityText: exam.registrationConfig.eligibilityText,
          customFields: exam.registrationConfig.customFields,
          consentNotice: exam.registrationConfig.consentNotice,
        },
        scheduleConfig: exam.scheduleConfig,
        offlineVenue: exam.offlineVenue,
        debateConfig: exam.debateConfig,
        cbtSummary: exam.cbtRules
          ? {
              totalQuestions: exam.cbtRules.totalQuestions,
              marksPerQuestion: exam.cbtRules.marksPerQuestion,
              negativeMarking: exam.cbtRules.negativeMarking,
              requireFullscreen: exam.cbtRules.requireFullscreen,
              disablePreviousNav: exam.cbtRules.disablePreviousNav,
            }
          : undefined,
      },
      batches: batches
        .filter((b) => b.status === 'active')
        .map((b) => ({
          id: b.id,
          batchCode: b.batchCode,
          batchName: b.batchName,
          scheduleOverride: b.scheduleOverride,
          venueOverride: b.venueOverride,
          capacity: b.capacity,
        })),
    });
  } catch (err: any) {
    console.error('[GET /api/exams/[publicCode] Error]', err);
    return NextResponse.json(
      { success: false, message: 'Unable to load examination details.' },
      { status: 500 }
    );
  }
}
