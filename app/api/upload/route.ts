import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer | null = null;
    let fileName = `blog-${Date.now()}`;
    let ext = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);

      const originalName = file.name || '';
      const dotIdx = originalName.lastIndexOf('.');
      if (dotIdx !== -1) {
        ext = originalName.substring(dotIdx + 1).toLowerCase();
      }
      const safeName = originalName
        .substring(0, dotIdx !== -1 ? dotIdx : undefined)
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase()
        .slice(0, 40);

      fileName = safeName ? `${safeName}-${Date.now()}.${ext}` : `blog-${Date.now()}.${ext}`;
    } else {
      // JSON base64 support
      const body = await req.json();
      const { data, name } = body;

      if (!data) {
        return NextResponse.json({ success: false, message: 'No image data provided' }, { status: 400 });
      }

      const match = data.match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
      if (match) {
        ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      const safeName = (name || '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase()
        .slice(0, 40);

      fileName = safeName ? `${safeName}-${Date.now()}.${ext}` : `blog-${Date.now()}.${ext}`;
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or empty file' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blogs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/blogs/${fileName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: buffer.length,
      message: 'Image uploaded successfully!',
    });
  } catch (err: any) {
    console.error('Image upload failed:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Image upload failed' },
      { status: 500 }
    );
  }
}

