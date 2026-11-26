import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const MONGO_COLLECTION = 'live_ticker_config';
const MONGO_DOC_ID = 'singleton';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'live_ticker_config.json');

export interface LiveTickerConfig {
  isLive: boolean;
  liveText: string;
  liveBadge: string;
  liveLink: string;
  updatedAt: string;
}

const DEFAULT_TICKER_CONFIG: LiveTickerConfig = {
  isLive: false,
  liveText: 'REGISTER FOR FREE MOCK TEST 2027 — OFFICIAL ONLINE CBT & ANSWER KEY',
  liveBadge: 'LIVE',
  liveLink: '/exam',
  updatedAt: new Date().toISOString(),
};

function readFromDisk(): LiveTickerConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function writeToDisk(data: object) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

export async function GET() {
  try {
    const db = await getDb();
    if (db) {
      const doc = await db
        .collection(MONGO_COLLECTION)
        .findOne({ _id: MONGO_DOC_ID as unknown as never });
      if (doc) {
        const { _id, ...rest } = doc as Record<string, unknown>;
        return NextResponse.json({ success: true, config: { ...DEFAULT_TICKER_CONFIG, ...rest } });
      }
    }
  } catch {}

  const disk = readFromDisk();
  return NextResponse.json({
    success: true,
    config: disk ? { ...DEFAULT_TICKER_CONFIG, ...disk } : DEFAULT_TICKER_CONFIG,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const updated: LiveTickerConfig = {
      isLive: Boolean(body.isLive),
      liveText: String(body.liveText || DEFAULT_TICKER_CONFIG.liveText).trim(),
      liveBadge: String(body.liveBadge || 'LIVE').trim().toUpperCase().slice(0, 16),
      liveLink: String(body.liveLink || '/exam').trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = await getDb();
      if (db) {
        await db
          .collection(MONGO_COLLECTION)
          .updateOne(
            { _id: MONGO_DOC_ID as unknown as never },
            { $set: { ...updated, _id: MONGO_DOC_ID } },
            { upsert: true }
          );
      }
    } catch (err) {
      console.warn('[live-ticker] MongoDB write failed:', err);
    }

    writeToDisk(updated);
    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to save live ticker.' },
      { status: 500 }
    );
  }
}
