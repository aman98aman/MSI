import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = new Set(['jpg', 'jpeg', 'png']);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let ext = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, message: 'No image file uploaded.' }, { status: 400 });
      }

      const originalName = (file.name || '').toLowerCase();
      const dotIdx = originalName.lastIndexOf('.');
      ext = dotIdx !== -1 ? originalName.substring(dotIdx + 1) : '';
      if (!ALLOWED_EXTS.has(ext) && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        return NextResponse.json(
          { success: false, message: 'Only JPG, JPEG, and PNG image formats are allowed.' },
          { status: 400 }
        );
      }
      if (!ALLOWED_EXTS.has(ext)) {
        ext = file.type === 'image/png' ? 'png' : 'jpg';
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      const body = await req.json().catch(() => ({}));
      const dataUrl = String(body.data || '');
      const match = dataUrl.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/i);
      if (!match) {
        return NextResponse.json(
          { success: false, message: 'Only JPG, JPEG, and PNG image formats are allowed.' },
          { status: 400 }
        );
      }
      ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      buffer = Buffer.from(match[2], 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, message: 'Uploaded image is empty.' }, { status: 400 });
    }
    if (buffer.length > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Image size must be 5MB or less.' },
        { status: 400 }
      );
    }

    const fileName = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    let publicUrl = '';

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'exam-photos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
      publicUrl = `/uploads/exam-photos/${fileName}`;
    } catch {
      // Fallback for read-only serverless environments: store base64 data URL directly
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      publicUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error('[Exam Photo Upload Error]', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to upload photograph.' },
      { status: 500 }
    );
  }
}
