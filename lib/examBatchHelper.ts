import { ExamBatch, ExamPaperVersion, ExamQuestion } from './examTypes';

export const SUB_PAPERS = [
  { code: 'PAPER_1', label: 'Paper 1', subtitle: 'Teaching & Research Aptitude / General Paper' },
  { code: 'PAPER_2', label: 'Paper 2', subtitle: 'Law Subject-Specific Paper' },
] as const;

export type SubPaperCode = (typeof SUB_PAPERS)[number]['code'];

/**
 * Determines whether a batch uses sub-papers (Paper 1 & Paper 2), e.g. UGC NET Law.
 */
export function isSubPaperBatch(batch?: Partial<ExamBatch> | null): boolean {
  if (!batch) return false;
  if (batch.hasSubPapers) return true;
  const combined = `${batch.batchCode || ''} ${batch.batchName || ''}`.toLowerCase();
  return /ugc[\s_-]*net/.test(combined);
}

/**
 * Filters questions for a specific batch (and optional subPaper).
 * Falls back to legacy exam-level questions (no batchId) only when batchId is not specified
 * or when no batch-specific questions exist and subPaper is not required.
 */
export function filterQuestionsForTarget(
  questions: ExamQuestion[],
  options: {
    batchId?: string | null;
    subPaper?: string | null;
    strictBatch?: boolean;
  }
): ExamQuestion[] {
  const { batchId, subPaper, strictBatch = false } = options;

  if (batchId && batchId !== 'DEFAULT') {
    const batchMatches = questions.filter((q) => q.batchId === batchId);
    if (subPaper) {
      return batchMatches.filter((q) => (q.subPaper || 'PAPER_1') === subPaper);
    }
    if (batchMatches.length > 0 || strictBatch) {
      return batchMatches.filter((q) => !q.subPaper || q.subPaper === 'DEFAULT');
    }
    // Legacy fallback if exam has no batch-scoped questions at all
    const anyBatchScoped = questions.some((q) => Boolean(q.batchId));
    if (!anyBatchScoped) {
      return questions;
    }
    return [];
  }

  return questions.filter((q) => !q.batchId || q.batchId === 'DEFAULT');
}

/**
 * Checks whether a specific batch (and optional subPaper) has a verified paper version.
 */
export function isTargetPaperVerified(
  paperVersions: ExamPaperVersion[],
  examPaperVerified: boolean,
  options: { batchId?: string | null; subPaper?: string | null }
): boolean {
  const { batchId, subPaper } = options;

  if (batchId && batchId !== 'DEFAULT') {
    const match = paperVersions.find(
      (pv) =>
        pv.batchId === batchId &&
        (subPaper ? pv.subPaper === subPaper : !pv.subPaper || pv.subPaper === 'DEFAULT')
    );
    if (match) return true;

    // Legacy fallback: if no batch-scoped paperVersions exist anywhere, honor exam.paperVerified
    const anyBatchVersion = paperVersions.some((pv) => Boolean(pv.batchId));
    if (!anyBatchVersion && !subPaper) {
      return examPaperVerified;
    }
    return false;
  }

  const defaultMatch = paperVersions.find(
    (pv) => (!pv.batchId || pv.batchId === 'DEFAULT') && (!pv.subPaper || pv.subPaper === 'DEFAULT')
  );
  return Boolean(defaultMatch) || examPaperVerified;
}
