import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';
import { Lead } from '@/components/reception/data/leadsMockData';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function readLeads(): Lead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
    return [];
  } catch (err) {
    console.error('Error reading leads from disk:', err);
    return [];
  }
}

function writeLeads(leads: Lead[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing leads to disk:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadIds, receptionistId, receptionistName, assignedBy, note } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one lead to assign.' },
        { status: 400 }
      );
    }

    if (!receptionistName && !receptionistId) {
      return NextResponse.json(
        { success: false, message: 'Please select a receptionist to assign leads to.' },
        { status: 400 }
      );
    }

    const targetAgent = receptionistName || receptionistId;
    const nowIso = new Date().toISOString();
    const diskLeads = readLeads();

    const updatedIds = new Set(leadIds.map((id) => String(id)));

    // Update in-memory / disk leads
    const updatedDiskLeads = diskLeads.map((l) => {
      if (updatedIds.has(String(l.id))) {
        const history = Array.isArray(l.remarksHistory) ? [...l.remarksHistory] : [];
        if (note && note.trim()) {
          history.unshift({
            id: `rem-assign-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            outcome: 'Needs More Info',
            text: `[Assignment Note]: ${note.trim()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: assignedBy || 'Marketing Team',
            leadStatus: l.status || 'New',
          });
        }

        return {
          ...l,
          agent: targetAgent,
          assignedTo: receptionistId || targetAgent,
          assignedAt: nowIso,
          assignedBy: assignedBy || 'Marketing Team',
          remarksHistory: history,
        };
      }
      return l;
    });

    writeLeads(updatedDiskLeads);

    // Update MongoDB if active
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          const updatePayload: any = {
            agent: targetAgent,
            assignedTo: receptionistId || targetAgent,
            assignedAt: nowIso,
            assignedBy: assignedBy || 'Marketing Team',
          };

          await db.collection('leads').updateMany(
            { id: { $in: Array.from(updatedIds) } },
            { $set: updatePayload }
          );
        }
      } catch (mongoErr) {
        console.warn('Mongo bulk assign failed:', mongoErr);
      }
    }

    return NextResponse.json({
      success: true,
      assignedCount: leadIds.length,
      targetAgent,
      message: `Successfully assigned ${leadIds.length} lead(s) to ${targetAgent}!`,
      leads: updatedDiskLeads,
    });
  } catch (err: any) {
    console.error('Lead assignment error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to assign leads' },
      { status: 500 }
    );
  }
}

