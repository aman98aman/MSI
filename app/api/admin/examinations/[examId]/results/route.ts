import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import {
  findOneExamDoc,
  insertAuditLog,
  listExamCollection,
  upsertExamDoc,
} from '@/lib/examDb';
import { evaluateAttemptAnswers } from '@/lib/examEvaluator';
import {
  CandidateAnswer,
  ExamAttempt,
  ExamEvent,
  ExamQuestion,
  ExamRegistration,
} from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

export async function GET(
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

  const { searchParams } = new URL(req.url);
  const exportType = (searchParams.get('export') || '').toLowerCase();

  const [attempts, registrations] = await Promise.all([
    listExamCollection<ExamAttempt>('exam_attempts', { examId }, { rawScore: -1 }),
    listExamCollection<ExamRegistration>('exam_registrations', { examId }),
  ]);

  const regMap = new Map(registrations.map((r) => [r.id, r]));

  const rows = attempts.map((a) => {
    const reg = regMap.get(a.registrationId);
    return {
      attemptId: a.id,
      uid: a.uid,
      fullName: reg?.fullName || 'Candidate',
      mobile: reg?.mobile || '',
      email: reg?.email || '',
      status: a.status,
      subPaperLabel: a.subPaperLabel || '',
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      rawScore: a.rawScore ?? 0,
      maxScore: a.maxScore ?? 0,
      percentage: a.percentage ?? 0,
      passed: a.passed ?? false,
      correctCount: a.correctCount ?? 0,
      wrongCount: a.wrongCount ?? 0,
      unansweredCount: a.unansweredCount ?? 0,
      violationCount: a.violationCount || 0,
      fullscreenExitCount: a.fullscreenExitCount || 0,
      tabSwitchCount: a.tabSwitchCount || 0,
      windowBlurCount: a.windowBlurCount || 0,
    };
  });

  if (exportType === 'xlsx' || exportType === 'csv') {
    const exportData = rows.map((r, idx) => ({
      Rank: idx + 1,
      UID: r.uid,
      'Candidate Name': r.fullName,
      Mobile: r.mobile,
      Email: r.email,
      Status: r.status,
      Score: r.rawScore,
      'Max Score': r.maxScore,
      'Percentage (%)': r.percentage,
      Result: r.passed ? 'PASS' : 'FAIL',
      Correct: r.correctCount,
      Wrong: r.wrongCount,
      Unanswered: r.unansweredCount,
      Violations: r.violationCount,
      'Submitted At': r.submittedAt || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');

    await insertAuditLog({
      entityType: 'result',
      entityId: examId,
      examId,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: `EXPORT_RESULTS_${exportType.toUpperCase()}`,
      summary: `Exported ${exportData.length} result records for ${exam.code}`,
    });

    if (exportType === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${exam.code}-results.csv"`,
        },
      });
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${exam.code}-results.xlsx"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    resultsPublished: exam.status === 'results_published',
    results: rows,
  });
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
  const action = String(body.action || 're_evaluate');
  const nowIso = new Date().toISOString();

  if (action === 'publish_results') {
    await upsertExamDoc('exam_events', {
      ...exam,
      status: 'results_published',
      updatedAt: nowIso,
    });
    await insertAuditLog({
      entityType: 'result',
      entityId: examId,
      examId,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: 'PUBLISH_RESULTS',
      summary: `Published results for ${exam.code}`,
    });
    return NextResponse.json({ success: true, resultsPublished: true });
  }

  // Re-evaluate all submitted or expired attempts from raw CandidateAnswer records
  const [attempts, questions] = await Promise.all([
    listExamCollection<ExamAttempt>('exam_attempts', { examId }),
    listExamCollection<ExamQuestion>('exam_questions', { examId }),
  ]);

  let evaluatedCount = 0;
  for (const attempt of attempts) {
    if (
      attempt.status === 'submitted' ||
      attempt.status === 'auto_submitted' ||
      Date.now() > Date.parse(attempt.expiresAt)
    ) {
      const versionQuestions = questions.filter((q) => q.paperVersion === attempt.paperVersion);
      const answers = await listExamCollection<CandidateAnswer>('exam_answers', {
        attemptId: attempt.id,
      });

      const summary = evaluateAttemptAnswers({
        attempt,
        questions: versionQuestions,
        answers,
        cbtRules: exam.cbtRules,
      });

      await upsertExamDoc('exam_attempts', {
        ...attempt,
        status: attempt.status === 'in_progress' ? 'auto_submitted' : attempt.status,
        submittedAt: attempt.submittedAt || attempt.expiresAt,
        ...summary,
        evaluatedAt: nowIso,
      });
      evaluatedCount += 1;
    }
  }

  await insertAuditLog({
    entityType: 'result',
    entityId: examId,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: 'RE_EVALUATE_RESULTS',
    summary: `Re-evaluated ${evaluatedCount} attempts for ${exam.code}`,
  });

  return NextResponse.json({ success: true, evaluatedCount });
}
