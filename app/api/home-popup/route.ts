import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'home_popup_config.json');

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Merge with existing config
    const existing = readConfig() || {};
    const updated = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    console.error('[home-popup] POST error:', err);
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
