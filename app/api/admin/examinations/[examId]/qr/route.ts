import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getAdminSession, unauthorizedAdminResponse } from '@/lib/examAuth';
import { findOneExamDoc, insertAuditLog, upsertExamDoc } from '@/lib/examDb';
import { ExamEvent } from '@/lib/examTypes';

export const dynamic = 'force-dynamic';

function buildPublicExamUrl(req: NextRequest, publicSlug: string): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = configuredOrigin || new URL(req.url).origin;
  return `${origin.replace(/\/$/, '')}/exam/${publicSlug}`;
}

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
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const publicUrl = buildPublicExamUrl(req, exam.publicSlug);

  if (format === 'svg') {
    const svg = await QRCode.toString(publicUrl, {
      type: 'svg',
      width: 512,
      margin: 2,
      color: { dark: '#071B37', light: '#FFFFFF' },
    });
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exam.code}-QR.svg"`,
      },
    });
  }

  if (format === 'png') {
    const pngBuffer = await QRCode.toBuffer(publicUrl, {
      type: 'png',
      width: 1024,
      margin: 2,
      color: { dark: '#071B37', light: '#FFFFFF' },
    });
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${exam.code}-QR.png"`,
      },
    });
  }

  const dataUrl = await QRCode.toDataURL(publicUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#071B37', light: '#FFFFFF' },
  });
  const svgString = await QRCode.toString(publicUrl, {
    type: 'svg',
    width: 512,
    margin: 2,
    color: { dark: '#071B37', light: '#FFFFFF' },
  });

  return NextResponse.json({
    success: true,
    publicUrl,
    qrVersion: exam.qrVersion || 1,
    qrRevoked: Boolean(exam.qrRevoked),
    dataUrl,
    svgString,
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
  const action = String(body.action || 'regenerate');
  const nowIso = new Date().toISOString();

  const updated: ExamEvent = {
    ...exam,
    qrVersion: (exam.qrVersion || 1) + 1,
    qrRevoked: action === 'revoke',
    updatedAt: nowIso,
  };

  if (action === 'regenerate' && body.newSlug) {
    updated.publicSlug = String(body.newSlug)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    updated.qrRevoked = false;
  } else if (action === 'regenerate') {
    updated.qrRevoked = false;
  }

  await upsertExamDoc('exam_events', updated);
  await insertAuditLog({
    entityType: 'exam',
    entityId: exam.id,
    examId: exam.id,
    actorId: admin.actorId,
    actorName: admin.actorName,
    action: action === 'revoke' ? 'REVOKE_QR' : 'REGENERATE_QR',
    summary: `${action === 'revoke' ? 'Revoked' : 'Regenerated'} QR v${updated.qrVersion} for ${exam.code}`,
  });

  return NextResponse.json({
    success: true,
    qrVersion: updated.qrVersion,
    qrRevoked: updated.qrRevoked,
    publicSlug: updated.publicSlug,
  });
}
