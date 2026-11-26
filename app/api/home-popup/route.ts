import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const MONGO_COLLECTION = 'home_popup_config';
const MONGO_DOC_ID = 'singleton';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'home_popup_config.json');

const DEFAULT_CONFIG = {
  _id: MONGO_DOC_ID,
  enabled: true,
  title: 'Register for Free Mock Test',
  subtitle: 'MSI Group of Institutes — Official Mock Test Series 2027',
  description:
    'Attempt Full-Length Mock Tests for CLAT, PCS-J (Judiciary) & AILET. Instant Scorecard, Ranking & PDF Download.',
  badgeText: 'FREE REGISTRATION',
  badgeColor: '#EFC988',
  scrollingTexts: [
    '🏛️ CLAT 2027 Free Mock Test — Register Now!',
    '⚖️ PCS-J (Judiciary) Mock Series — Online & Offline',
    '📋 AILET & Law Entrance Mock Tests Available',
    '🎯 All-India Ranking with Instant Scorecard',
    '📄 Free PDF Download with Answer Key',
  ],
  onlineLink: '/exam',
  offlineLink: '/contact',
  onlineLinkText: 'Register Online',
  offlineLinkText: 'Register Offline / Walk-In',
  ctaButtonText: 'Register for Free Mock Test',
  ctaButtonLink: '/exam',
  showOnce: false,
  delaySeconds: 3,
  updatedAt: new Date().toISOString(),
};

/* ── Disk helpers (local dev only — Vercel fs is read-only) ── */
function readFromDisk() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      if (raw && raw.trim()) return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
}

function writeToDisk(data: object) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {
    // Silently ignore on Vercel (read-only filesystem)
  }
}

/* ── MongoDB helpers ── */
async function readFromMongo() {
  try {
    const db = await getDb();
    if (!db) return null;
    const doc = await db.collection(MONGO_COLLECTION).findOne({ _id: MONGO_DOC_ID as unknown as never });
    return doc || null;
  } catch (err) {
    console.warn('[home-popup] MongoDB read error:', err);
    return null;
  }
}

async function writeToMongo(data: object) {
  const db = await getDb();
  if (!db) throw new Error('MongoDB not available');
  await db.collection(MONGO_COLLECTION).updateOne(
    { _id: MONGO_DOC_ID as unknown as never },
    { $set: { ...data, _id: MONGO_DOC_ID } },
    { upsert: true }
  );
}

/* ── GET ── */
export async function GET() {
  try {
    // 1. Try MongoDB first (works on Vercel)
    const mongoDoc = await readFromMongo();
    if (mongoDoc) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...config } = mongoDoc as Record<string, unknown>;
      return NextResponse.json(config);
    }

    // 2. Fall back to disk (local dev)
    const diskData = readFromDisk();
    if (diskData) return NextResponse.json(diskData);

    // 3. Return defaults
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...defaults } = DEFAULT_CONFIG;
    return NextResponse.json(defaults);
  } catch (err) {
    console.error('[home-popup] GET error:', err);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...defaults } = DEFAULT_CONFIG;
    return NextResponse.json(defaults);
  }
}

/* ── POST ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Merge with defaults
    const updated = {
      ...DEFAULT_CONFIG,
      ...body,
      _id: MONGO_DOC_ID,
      updatedAt: new Date().toISOString(),
    };

    let savedToMongo = false;

    // 1. Save to MongoDB (primary — works on Vercel production)
    try {
      await writeToMongo(updated);
      savedToMongo = true;
    } catch (mongoErr) {
      console.warn('[home-popup] MongoDB write error:', mongoErr);
    }

    // 2. Also save to disk as backup (works on local dev)
    writeToDisk(updated);

    if (!savedToMongo) {
      // If MongoDB failed AND disk also silently failed, return error
      // But if disk wrote (local dev), still return success
      const diskOk = readFromDisk();
      if (!diskOk) {
        return NextResponse.json(
          { error: 'Failed to save — MongoDB unavailable and disk write failed.' },
          { status: 500 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...responseConfig } = updated;
    return NextResponse.json({ success: true, config: responseConfig });
  } catch (err) {
    console.error('[home-popup] POST error:', err);
    return NextResponse.json(
      { error: 'Failed to save config. Please try again.' },
      { status: 500 }
    );
  }
}
