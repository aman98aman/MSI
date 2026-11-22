import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'notes');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No PDF file provided.' },
        { status: 400 }
      );
    }

    // Validate mime type & extension
    const fileName = file.name || 'document.pdf';
    const isPdfExt = fileName.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.type === '';

    if (!isPdfExt && !isPdfMime) {
      return NextResponse.json(
        { success: false, message: 'Only PDF documents are allowed.' },
        { status: 400 }
      );
    }

    // Max 25 MB limit
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum allowed limit of 25MB.' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      } catch (dirErr) {
        console.error('[Upload PDF] Failed to create dir:', dirErr);
      }
    }

    const safeBaseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}-${safeBaseName}`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/notes/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      message: 'PDF file uploaded successfully.',
      pdfPath: publicUrl,
      pdfOriginalName: fileName,
      fileSize: file.size,
    });
  } catch (error: any) {
    console.error('[Upload PDF Error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload PDF file.' },
      { status: 500 }
    );
  }
}
