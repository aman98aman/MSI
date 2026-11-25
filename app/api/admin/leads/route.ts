import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_LEADS, Lead } from '@/components/reception/data/leadsMockData';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function normalizeLeadStatus(raw: any): 'New' | 'Follow-up' | 'Converted' | 'Dead' {
  if (!raw) return 'New';
  const s = String(raw).trim().toLowerCase();

  // 1. Check Dead first (so 'not interested' or 'do not call' are marked Dead, not Follow-up)
  if (
    s.includes('dead') ||
    s.includes('lost') ||
    s.includes('not interested') ||
    s.includes('no interest') ||
    s.includes('reject') ||
    s.includes('junk') ||
    s.includes('invalid') ||
    s.includes('closed') ||
    s.includes('drop') ||
    s.includes('wrong')
  ) {
    return 'Dead';
  }

  // 2. Check Converted next
  if (
    s.includes('convert') ||
    s.includes('enroll') ||
    s.includes('admit') ||
    s.includes('admission') ||
    s.includes('paid') ||
    s.includes('joined') ||
    s.includes('won') ||
    s.includes('success')
  ) {
    return 'Converted';
  }

  // 3. Check Follow-up
  if (
    s.includes('follow') ||
    s.includes('call') ||
    s.includes('interested') ||
    s.includes('pending') ||
    s.includes('pipeline') ||
    s.includes('wait')
  ) {
    return 'Follow-up';
  }

  return 'New';
}

function readLeadsFromDisk(): Lead[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (_) {}
    }
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch (_) {}
    return [];
  } catch (err) {
    console.error('[Leads Disk Error]', err);
    return [];
  }
}

function writeLeadsToDisk(leads: Lead[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Leads Write Error - Read Only FS on Vercel]:', err);
  }
}

async function getLeadsAsync(): Promise<Lead[]> {
  if (isMongoConfigured()) {
    try {
      const fetchFromMongo = async () => {
        const db = await getDb();
        if (!db) return null;
        const col = db.collection<Lead>('leads');
        const count = await col.countDocuments();
        if (count === 0) {
          const disk = readLeadsFromDisk();
          if (disk.length > 0) {
            await col.insertMany(disk as any);
          }
        }
        const docs = await col.find({}).sort({ receivedDate: -1 }).toArray();
        const mongoLeads = docs.map((d: any) => {
          const { _id, ...rest } = d;
          return rest as Lead;
        });

        // Merge any leads that are currently on disk
        const diskLeads = readLeadsFromDisk();
        const mongoIdSet = new Set(mongoLeads.map((l) => l.id));
        return [...mongoLeads, ...diskLeads.filter((l) => !mongoIdSet.has(l.id))];
      };

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const res = await Promise.race([fetchFromMongo(), timeoutPromise]);
      if (res) return res;
    } catch (err) {
      console.warn('[Leads MongoDB Error]:', err);
    }
  }
  return readLeadsFromDisk();
}

async function syncLeadToMongo(lead: Lead) {
  if (!isMongoConfigured()) return;
  try {
    const db = await getDb();
    if (db) {
      const { _id, ...cleanLead }: any = lead;
      await db.collection('leads').updateOne({ id: lead.id }, { $set: cleanLead }, { upsert: true });
    }
  } catch (err) {
    console.warn('[Lead Mongo Upsert Error]:', err);
  }
}

export async function GET(req: NextRequest) {
  // Support Meta Ads Webhook Verification (hub.mode=subscribe)
  const { searchParams } = new URL(req.url);
  const hubMode = searchParams.get('hub.mode');
  const hubChallenge = searchParams.get('hub.challenge');
  const hubVerifyToken = searchParams.get('hub.verify_token');

  if (hubMode === 'subscribe') {
    const EXPECTED_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'msi_meta_leads_2026_secret';
    if (hubVerifyToken === EXPECTED_TOKEN && hubChallenge) {
      return new NextResponse(hubChallenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    return NextResponse.json({ error: 'Verification token mismatch' }, { status: 403 });
  }

  const leads = await getLeadsAsync();
  return NextResponse.json({
    success: true,
    leads,
    count: leads.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Bulk Lead Import from Excel / CSV
    if (body.bulk === true && Array.isArray(body.leads)) {
      const diskLeads = readLeadsFromDisk();
      const newItems: Lead[] = body.leads.map((raw: any, idx: number) => {
        const cleanPhone = (raw.mobile || '').replace(/\D/g, '').slice(-10);
        const resolvedStatus = normalizeLeadStatus(raw.status || raw.stage || raw.leadStatus || raw.disposition);
        return {
          id: `lead-bulk-${Date.now().toString().slice(-6)}-${idx + 1}`,
          name: (raw.name || 'Inbound Candidate').trim(),
          mobile: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : (raw.mobile || '+91 98765 00000').trim(),
          location: (raw.location || 'Chandigarh / Mohali').trim(),
          targetCourse: raw.targetCourse || 'PCS-J Comprehensive Foundation 2026-27',
          source: (raw.source || 'Bulk Excel Import') as any,
          receivedDate: raw.receivedDate || 'Imported Today',
          status: resolvedStatus,
          latestRemark: (raw.notes || `Imported via Bulk Excel / CSV Upload [Status: ${resolvedStatus}]`).trim(),
          fullRemark: (raw.notes || `Candidate profile imported via Excel / CSV batch dispatch (${resolvedStatus}).`).trim(),
          agent: raw.agent || 'Harshit (Reception Desk)',
          remarksHistory: [
            {
              id: `rem-${Date.now()}-${idx}`,
              outcome: resolvedStatus === 'Converted' ? 'Connected — Interested' : resolvedStatus === 'Follow-up' ? 'Callback Requested' : resolvedStatus === 'Dead' ? 'Not Interested' : 'Needs More Info',
              text: raw.notes || `Imported from Excel / CSV dataset (${resolvedStatus})`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              author: 'Super Admin Import',
              leadStatus: resolvedStatus,
            },
          ],
        };
      });

      const updated = [...newItems, ...diskLeads];
      writeLeadsToDisk(updated);

      if (isMongoConfigured()) {
        try {
          const db = await getDb();
          if (db && newItems.length > 0) {
            await db.collection('leads').insertMany(newItems as any);
          }
        } catch (err) {
          console.warn('[Bulk Leads Mongo Error]:', err);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${newItems.length} leads into Reception CRM.`,
        importedCount: newItems.length,
        leads: updated,
      });
    }

    // 2. Meta Ads Automated Inbound Webhook (Facebook / Instagram Lead Gen)
    if (body.object === 'page' && Array.isArray(body.entry)) {
      const diskLeads = readLeadsFromDisk();
      const metaLeadItems: Lead[] = [];

      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const val = change.value;
            const leadName = val?.lead_name || val?.full_name || 'Meta Ads Prospect';
            const leadPhone = val?.phone_number || val?.mobile || '+91 98000 00000';
            const leadCourse = val?.course || 'Judiciary / CLAT Entrance Preparation';

            metaLeadItems.push({
              id: `lead-meta-${Date.now().toString().slice(-6)}`,
              name: leadName,
              mobile: leadPhone,
              location: val?.city || 'Meta Lead Gen (Digital)',
              targetCourse: leadCourse,
              source: 'Meta Ads (Facebook/Instagram)' as any,
              receivedDate: 'Just now (Instant)',
              status: 'New',
              latestRemark: `Instant Lead from Meta Ad Campaign: ${val?.ad_name || 'Campaign 2026'}`,
              agent: 'Harshit (Reception Desk)',
              remarksHistory: [
                {
                  id: `rem-meta-${Date.now()}`,
                  outcome: 'Needs More Info',
                  text: 'Real-time webhook intake from Meta Lead Ads',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  author: 'Meta Webhook Sync',
                  leadStatus: 'New',
                },
              ],
            });
          }
        }
      }

      const updated = [...metaLeadItems, ...diskLeads];
      writeLeadsToDisk(updated);
      return NextResponse.json({ success: true, processed: metaLeadItems.length });
    }

    // 3. Single Lead Generation from Super Admin
    const { name, mobile, location, targetCourse, source, notes, agent, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Lead name is required.' },
        { status: 400 }
      );
    }

    if (!mobile || !mobile.trim()) {
      return NextResponse.json(
        { success: false, message: 'Valid mobile number is required.' },
        { status: 400 }
      );
    }

    const leads = readLeadsFromDisk();
    const cleanPhone = mobile.replace(/\D/g, '').slice(-10);
    const resolvedStatus = normalizeLeadStatus(status || 'New');

    const newLead: Lead = {
      id: `lead-sa-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      mobile: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : mobile.trim(),
      location: location?.trim() || 'Chandigarh / Mohali (NCR)',
      targetCourse: targetCourse || 'PCS-J Punjab Judicial Services',
      source: (source || 'Super Admin (#2410)') as any,
      receivedDate: 'Just now (Today)',
      status: resolvedStatus,
      latestRemark: notes?.trim() || 'Inbound lead entered via Super Admin Master Console.',
      fullRemark: notes?.trim() || 'Inbound inquiry routed directly to Reception & Telecalling desk.',
      agent: agent || 'Harshit (Reception Desk)',
      remarksHistory: [
        {
          id: `rem-${Date.now()}`,
          outcome: resolvedStatus === 'Converted' ? 'Connected — Interested' : resolvedStatus === 'Follow-up' ? 'Callback Requested' : resolvedStatus === 'Dead' ? 'Not Interested' : 'Needs More Info',
          text: notes?.trim() || 'Generated via Super Admin Master Portal',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: 'Super Admin',
          leadStatus: resolvedStatus,
        },
      ],
    };

    const updated = [newLead, ...leads.filter((l) => l.id !== newLead.id)];
    writeLeadsToDisk(updated);

    // Sync to MongoDB immediately
    await syncLeadToMongo(newLead);

    return NextResponse.json({
      success: true,
      message: 'New lead successfully generated and dispatched to Reception Desk.',
      lead: newLead,
      leads: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save lead' },
      { status: 500 }
    );
  }
}


export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Lead ID is required.' },
        { status: 400 }
      );
    }

    let updatedLead: any = null;

    // 1. Update in MongoDB if available
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          await db.collection('leads').updateOne({ id }, { $set: updates });
          const doc = await db.collection('leads').findOne({ id });
          if (doc) {
            const { _id, ...clean } = doc;
            updatedLead = clean;
          }
        }
      } catch (err) {
        console.warn('[Leads Mongo Patch Error]:', err);
      }
    }

    // 2. Update on Disk
    const leads = readLeadsFromDisk();
    const index = leads.findIndex((l) => l.id === id);

    if (index !== -1) {
      leads[index] = { ...leads[index], ...updates };
      if (!updatedLead) updatedLead = leads[index];
      writeLeadsToDisk(leads);
    } else if (updatedLead) {
      leads.unshift(updatedLead);
      writeLeadsToDisk(leads);
    } else {
      // If neither disk nor mongo had it initially
      return NextResponse.json(
        { success: false, message: 'Lead not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
      lead: updatedLead,
      leads,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let idsToDelete: string[] = [];
    let deleteAll = false;

    if (id) {
      idsToDelete = [id];
    } else {
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.all === true) {
          deleteAll = true;
        } else if (Array.isArray(body?.ids)) {
          idsToDelete = body.ids;
        } else if (body?.id) {
          idsToDelete = [body.id];
        }
      } catch (_) {}
    }

    if (!deleteAll && idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead ID or list of IDs is required.' },
        { status: 400 }
      );
    }

    // 1. Immediately update disk FIRST
    const currentLeads = readLeadsFromDisk();
    const remainingLeads = deleteAll ? [] : currentLeads.filter((l) => !idsToDelete.includes(l.id));
    writeLeadsToDisk(remainingLeads);

    // 2. Synchronize deletion to MongoDB
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          if (deleteAll) {
            await db.collection('leads').deleteMany({});
          } else {
            await db.collection('leads').deleteMany({
              $or: [
                { id: { $in: idsToDelete } },
                { _id: { $in: idsToDelete as any } },
              ],
            });
          }
        }
      } catch (err) {
        console.warn('[Leads MongoDB Delete Error]:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: deleteAll ? 'All leads removed successfully.' : `${idsToDelete.length} lead(s) removed successfully.`,
      leads: remainingLeads,
      count: remainingLeads.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
