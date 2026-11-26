import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import {
  deleteExamDoc,
  findOneExamDoc,
  insertAuditLog,
  listExamCollection,
  upsertExamDoc,
} from '@/lib/examDb';
import { ExamBatch, ExamEvent, ExamPaperVersion, ExamQuestion } from '@/lib/examTypes';
import {
  filterQuestionsForTarget,
  isSubPaperBatch,
  isTargetPaperVerified,
  SUB_PAPERS,
} from '@/lib/examBatchHelper';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const { searchParams } = new URL(req.url);

  if (searchParams.get('template') === 'xlsx') {
    const sampleRows = [
      {
        Section: 'Legal Reasoning',
        Question: 'Which Article of the Indian Constitution deals with Uniform Civil Code?',
        OptionA: 'Article 40',
        OptionB: 'Article 44',
        OptionC: 'Article 48',
        OptionD: 'Article 51',
        CorrectOption: 'B',
        Marks: 1,
        NegativeMarks: 0.25,
        Explanation: 'Article 44 is a Directive Principle of State Policy.',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QuestionsTemplate');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="MSI-Question-Import-Template.xlsx"',
      },
    });
  }

  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (!exam) {
    return NextResponse.json({ success: false, message: 'Examination not found.' }, { status: 404 });
  }

  const version = Number(searchParams.get('version') || exam.activePaperVersion || 1);
  const batchId = searchParams.get('batchId') || undefined;
  const subPaper = searchParams.get('subPaper') || undefined;

  const [allQuestions, paperVersions, batches] = await Promise.all([
    listExamCollection<ExamQuestion>(
      'exam_questions',
      { examId, paperVersion: version },
      { orderIndex: 1 }
    ),
    listExamCollection<ExamPaperVersion>('exam_paper_versions', { examId }, { version: -1 }),
    listExamCollection<ExamBatch>('exam_batches', { examId }, { createdAt: 1 }),
  ]);

  const targetBatchId = batchId && batchId !== 'DEFAULT' ? batchId : undefined;
  const targetSubPaper = subPaper && subPaper !== 'DEFAULT' ? subPaper : undefined;

  const questions = filterQuestionsForTarget(allQuestions, {
    batchId: targetBatchId,
    subPaper: targetSubPaper,
    strictBatch: Boolean(targetBatchId),
  });

  const currentTargetVerified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
    batchId: targetBatchId,
    subPaper: targetSubPaper,
  });

  const batchPaperStatuses = batches.map((b) => {
    const hasSubs = isSubPaperBatch(b);
    if (hasSubs) {
      const subStatuses = SUB_PAPERS.map((sp) => {
        const qs = filterQuestionsForTarget(allQuestions, {
          batchId: b.id,
          subPaper: sp.code,
          strictBatch: true,
        });
        const verified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
          batchId: b.id,
          subPaper: sp.code,
        });
        return {
          subPaper: sp.code,
          label: sp.label,
          questionCount: qs.length,
          verified,
        };
      });
      return {
        batchId: b.id,
        batchCode: b.batchCode,
        batchName: b.batchName,
        hasSubPapers: true,
        questionCount: subStatuses.reduce((sum, s) => sum + s.questionCount, 0),
        verified: subStatuses.every((s) => s.verified && s.questionCount > 0),
        subStatuses,
      };
    }

    const qs = filterQuestionsForTarget(allQuestions, {
      batchId: b.id,
      strictBatch: true,
    });
    const verified = isTargetPaperVerified(paperVersions, exam.paperVerified, {
      batchId: b.id,
    });
    return {
      batchId: b.id,
      batchCode: b.batchCode,
      batchName: b.batchName,
      hasSubPapers: false,
      questionCount: qs.length,
      verified,
    };
  });

  return NextResponse.json({
    success: true,
    activePaperVersion: exam.activePaperVersion,
    paperVerified: currentTargetVerified,
    examPaperVerified: exam.paperVerified,
    hasStartedAttempts: exam.hasStartedAttempts,
    questions,
    paperVersions,
    batchPaperStatuses,
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
  const mode = String(body.mode || 'manual');
  const paperVersion = exam.activePaperVersion || 1;
  const batchId = body.batchId && body.batchId !== 'DEFAULT' ? String(body.batchId).trim() : undefined;
  const subPaper = body.subPaper && body.subPaper !== 'DEFAULT' ? String(body.subPaper).trim() : undefined;
  const nowIso = new Date().toISOString();

  if (mode === 'verify_and_publish') {
    const allActiveQuestions = await listExamCollection<ExamQuestion>(
      'exam_questions',
      { examId, paperVersion, status: 'active' },
      { orderIndex: 1 }
    );
    const questions = filterQuestionsForTarget(allActiveQuestions, {
      batchId,
      subPaper,
      strictBatch: Boolean(batchId),
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot verify an empty question paper. Add at least 1 active question for this batch/paper.' },
        { status: 400 }
      );
    }

    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    const versionDocId = batchId
      ? `PV-${examId}-${batchId}-${subPaper || 'DEFAULT'}-V${paperVersion}`
      : `PV-${examId}-V${paperVersion}`;

    const versionDoc: ExamPaperVersion = {
      id: versionDocId,
      examId,
      ...(batchId ? { batchId } : {}),
      ...(subPaper ? { subPaper } : {}),
      version: paperVersion,
      questionIds: questions.map((q) => q.id),
      totalQuestions: questions.length,
      totalMarks,
      verifiedBy: admin.actorName,
      verifiedAt: nowIso,
      locked: exam.hasStartedAttempts,
    };

    await upsertExamDoc('exam_paper_versions', versionDoc);
    await upsertExamDoc('exam_events', {
      ...exam,
      paperVerified: true,
      updatedAt: nowIso,
    });
    await insertAuditLog({
      entityType: 'paper',
      entityId: versionDoc.id,
      examId,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: 'VERIFY_AND_PUBLISH_PAPER',
      summary: `Verified & published Paper v${paperVersion}${batchId ? ` (Batch: ${batchId}${subPaper ? `, ${subPaper}` : ''})` : ''} (${questions.length} questions, ${totalMarks} marks)`,
    });

    return NextResponse.json({ success: true, paperVersion: versionDoc });
  }

  if (exam.hasStartedAttempts && !body.emergencyOverrideReason && !batchId) {
    return NextResponse.json(
      {
        success: false,
        message: 'Question paper is locked because candidates have already started attempts.',
      },
      { status: 409 }
    );
  }

  const allExistingQuestions = await listExamCollection<ExamQuestion>('exam_questions', {
    examId,
    paperVersion,
  });
  const existingQuestions = filterQuestionsForTarget(allExistingQuestions, {
    batchId,
    subPaper,
    strictBatch: Boolean(batchId),
  });

  if (mode === 'bulk') {
    const rows = Array.isArray(body.questions) ? body.questions : [];
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'No questions provided.' }, { status: 400 });
    }

    let nextOrder = existingQuestions.length + 1;
    const saved: ExamQuestion[] = [];
    const seenTexts = new Set(existingQuestions.map((q) => q.text.trim().toLowerCase()));

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const text = String(r.text || '').trim();
      const optA = String(r.optionA || '').trim();
      const optB = String(r.optionB || '').trim();
      const optC = String(r.optionC || '').trim();
      const optD = String(r.optionD || '').trim();
      const correct = String(r.correctOptionId || '').trim().toUpperCase();

      if (!text || !optA || !optB || !optC || !optD || !['A', 'B', 'C', 'D'].includes(correct)) {
        return NextResponse.json(
          {
            success: false,
            message: `Row ${i + 1} is invalid. Ensure question text, all 4 options, and CorrectOption (A/B/C/D) are provided.`,
          },
          { status: 400 }
        );
      }

      if (seenTexts.has(text.toLowerCase())) {
        continue; // skip duplicate question text safely
      }
      seenTexts.add(text.toLowerCase());

      const q: ExamQuestion = {
        id: `Q-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        examId,
        ...(batchId ? { batchId } : {}),
        ...(subPaper ? { subPaper } : {}),
        paperVersion,
        orderIndex: nextOrder++,
        section: String(r.section || 'General').trim(),
        text,
        imageUrl: r.imageUrl ? String(r.imageUrl).trim() : undefined,
        options: [
          { id: 'A', text: optA },
          { id: 'B', text: optB },
          { id: 'C', text: optC },
          { id: 'D', text: optD },
        ],
        correctOptionId: correct,
        marks: Number(r.marks ?? exam.cbtRules?.marksPerQuestion ?? 1),
        negativeMarks: Number(r.negativeMarks ?? exam.cbtRules?.negativeMarking ?? 0),
        explanation: r.explanation ? String(r.explanation).trim() : undefined,
        status: 'active',
        createdAt: nowIso,
      };
      await upsertExamDoc('exam_questions', q);
      saved.push(q);
    }

    // Mark this specific paper unverified after edits until admin clicks Verify & Publish
    if (batchId) {
      const targetPvId = `PV-${examId}-${batchId}-${subPaper || 'DEFAULT'}-V${paperVersion}`;
      await deleteExamDoc('exam_paper_versions', { id: targetPvId });
    } else {
      await upsertExamDoc('exam_events', { ...exam, paperVerified: false, updatedAt: nowIso });
    }
    await insertAuditLog({
      entityType: 'paper',
      entityId: examId,
      examId,
      actorId: admin.actorId,
      actorName: admin.actorName,
      action: 'BULK_IMPORT_QUESTIONS',
      summary: `Imported ${saved.length} questions into Paper v${paperVersion}`,
    });

    return NextResponse.json({ success: true, importedCount: saved.length }, { status: 201 });
  }

  // Manual single question entry
  const text = String(body.text || '').trim();
  const options = Array.isArray(body.options) ? body.options : [];
  const correctOptionId = String(body.correctOptionId || '').trim().toUpperCase();

  if (!text || options.length < 2 || !['A', 'B', 'C', 'D'].includes(correctOptionId)) {
    return NextResponse.json(
      { success: false, message: 'Question text, options, and valid correct option (A-D) are required.' },
      { status: 400 }
    );
  }

  const q: ExamQuestion = {
    id: body.id || `Q-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    examId,
    ...(batchId ? { batchId } : {}),
    ...(subPaper ? { subPaper } : {}),
    paperVersion,
    orderIndex: body.orderIndex ? Number(body.orderIndex) : existingQuestions.length + 1,
    section: String(body.section || 'General').trim(),
    text,
    imageUrl: body.imageUrl ? String(body.imageUrl).trim() : undefined,
    options: options.map((o: any, idx: number) => ({
      id: ['A', 'B', 'C', 'D'][idx] || o.id,
      text: String(o.text || '').trim(),
    })),
    correctOptionId,
    marks: Number(body.marks ?? exam.cbtRules?.marksPerQuestion ?? 1),
    negativeMarks: Number(body.negativeMarks ?? exam.cbtRules?.negativeMarking ?? 0),
    explanation: body.explanation ? String(body.explanation).trim() : undefined,
    status: body.status === 'disabled' ? 'disabled' : 'active',
    createdAt: nowIso,
  };

  await upsertExamDoc('exam_questions', q);
  if (batchId) {
    const targetPvId = `PV-${examId}-${batchId}-${subPaper || 'DEFAULT'}-V${paperVersion}`;
    await deleteExamDoc('exam_paper_versions', { id: targetPvId });
  } else {
    await upsertExamDoc('exam_events', { ...exam, paperVerified: false, updatedAt: nowIso });
  }
  await insertAuditLog({
    entityType: 'paper',
    entityId: q.id,
    examId,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: 'SAVE_QUESTION',
    summary: `Saved question #${q.orderIndex} in Paper v${paperVersion}`,
  });

  return NextResponse.json({ success: true, question: q }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  const admin = getAdminSession(req);
  if (!admin) return unauthorizedAdminResponse();

  const { examId } = await context.params;
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  if (!questionId) {
    return NextResponse.json({ success: false, message: 'questionId is required.' }, { status: 400 });
  }

  const exam = await findOneExamDoc<ExamEvent>('exam_events', { id: examId });
  if (exam?.hasStartedAttempts) {
    return NextResponse.json(
      { success: false, message: 'Cannot delete questions after attempts have started.' },
      { status: 409 }
    );
  }

  await deleteExamDoc('exam_questions', { id: questionId, examId });
  if (exam) {
    await upsertExamDoc('exam_events', {
      ...exam,
      paperVerified: false,
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
