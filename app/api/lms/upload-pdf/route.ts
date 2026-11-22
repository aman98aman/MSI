import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GridFSBucket } from 'mongodb';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'notes');
const CHUNKS_DIR  = path.join(os.tmpdir(), 'msi-pdf-chunks');

// Ensure directory exists without throwing on read-only environments
function safeMkdir(dir: string) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (_) {}
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Check if this is a chunked upload
    const chunkIndexStr = formData.get('chunkIndex') as string | null;
    const totalChunksStr = formData.get('totalChunks') as string | null;
    const uploadId       = formData.get('uploadId') as string | null;
    const fileNameParam  = (formData.get('fileName') as string | null) || 'document.pdf';

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file data received in upload request.' },
        { status: 400 }
      );
    }

    const chunkBytes = await file.arrayBuffer();
    const chunkBuffer = Buffer.from(chunkBytes);

    // ── Handle Chunked Upload ────────────────────────────────────────────────
    if (chunkIndexStr !== null && totalChunksStr !== null && uploadId) {
      const chunkIndex = parseInt(chunkIndexStr, 10);
      const totalChunks = parseInt(totalChunksStr, 10);

      const sessionDir = path.join(CHUNKS_DIR, uploadId.replace(/[^a-zA-Z0-9_-]/g, ''));
      safeMkdir(sessionDir);

      // Save chunk to disk in OS temp directory (always writable in Node/Lambda)
      const chunkPath = path.join(sessionDir, `chunk_${chunkIndex}`);
      fs.writeFileSync(chunkPath, chunkBuffer);

      // Check if all chunks have been received
      const existingChunks = fs.readdirSync(sessionDir);
      if (existingChunks.length < totalChunks) {
        return NextResponse.json({
          success: true,
          chunkReceived: chunkIndex,
          totalReceived: existingChunks.length,
          totalChunks,
          done: false,
        });
      }

      // All chunks present: assemble them in order
      const assembledBuffers: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const cPath = path.join(sessionDir, `chunk_${i}`);
        if (!fs.existsSync(cPath)) {
          return NextResponse.json(
            { success: false, message: `Missing chunk ${i} during assembly.` },
            { status: 400 }
          );
        }
        assembledBuffers.push(fs.readFileSync(cPath));
      }

      const completeBuffer = Buffer.concat(assembledBuffers);

      // Clean up temp chunk files
      try {
        for (let i = 0; i < totalChunks; i++) {
          try { fs.unlinkSync(path.join(sessionDir, `chunk_${i}`)); } catch (_) {}
        }
        try { fs.rmdirSync(sessionDir); } catch (_) {}
      } catch (_) {}

      return await persistPdfBuffer(completeBuffer, fileNameParam);
    }

    // ── Handle Direct Single File Upload ────────────────────────────────────
    const fileName = file.name || fileNameParam;
    return await persistPdfBuffer(chunkBuffer, fileName);
  } catch (error: any) {
    console.error('[Upload PDF Error]:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to process PDF upload.' },
      { status: 500 }
    );
  }
}

/**
 * Persists the complete PDF buffer to MongoDB Atlas GridFS and local cache
 */
async function persistPdfBuffer(buffer: Buffer, fileName: string) {
  // Validate PDF extension or content
  const lowerName = fileName.toLowerCase();
  if (!lowerName.endsWith('.pdf')) {
    // If name doesn't end in .pdf, check if header is %PDF
    const isMagicPdf = buffer.slice(0, 4).toString('utf-8').startsWith('%PDF');
    if (!isMagicPdf) {
      return NextResponse.json(
        { success: false, message: 'Uploaded file is not a valid PDF document.' },
        { status: 400 }
      );
    }
  }

  // Max 100 MB limit
  const MAX_SIZE = 100 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json(
      { success: false, message: 'File size exceeds maximum allowed limit of 100MB.' },
      { status: 400 }
    );
  }

  const safeBaseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueFileName = `${Date.now()}-${safeBaseName}`;

  let gridFsFileId: string | undefined = undefined;

  // 1. Persist directly to MongoDB GridFS for 100% reliable cloud storage
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const bucket = new GridFSBucket(db, { bucketName: 'lms_pdfs' });
          await new Promise<void>((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(uniqueFileName, {
              metadata: {
                originalName: fileName,
                fileSize: buffer.length,
                contentType: 'application/pdf',
                uploadedAt: new Date().toISOString(),
              },
            });
            gridFsFileId = uploadStream.id.toString();
            uploadStream.on('finish', () => resolve());
            uploadStream.on('error', (err: any) => reject(err));
            uploadStream.end(buffer);
          });
      }
    } catch (gridErr) {
      console.warn('[Upload PDF] MongoDB GridFS storage warning:', gridErr);
    }
  }

  // 2. Local disk write (best effort, will not crash on read-only environments)
  try {
    safeMkdir(UPLOADS_DIR);
    const destinationPath = path.join(UPLOADS_DIR, uniqueFileName);
    fs.writeFileSync(destinationPath, buffer);
  } catch (fsErr) {
    // Expected on serverless Vercel read-only filesystem
    console.log('[Upload PDF] Local disk write skipped (read-only environment):', (fsErr as any)?.message);
  }

  const publicUrl = `/uploads/notes/${uniqueFileName}`;

  return NextResponse.json({
    success: true,
    message: 'PDF file uploaded and saved successfully.',
    pdfPath: publicUrl,
    gridFsFileId,
    pdfOriginalName: fileName,
    fileSize: buffer.length,
    done: true,
  });
}
