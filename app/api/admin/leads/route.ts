import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_LEADS, Lead } from '@/components/reception/data/leadsMockData';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function readLeadsFromDisk(): Lead[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
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
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), 'utf-8');
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
    console.error('[Leads Write Error]', err);
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

  const leads = readLeadsFromDisk();
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
        return {
          id: `lead-bulk-${Date.now().toString().slice(-6)}-${idx + 1}`,
          name: (raw.name || 'Inbound Candidate').trim(),
          mobile: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : (raw.mobile || '+91 98765 00000').trim(),
          location: (raw.location || 'Chandigarh / Mohali').trim(),
          targetCourse: raw.targetCourse || 'PCS-J Comprehensive Foundation 2026-27',
          source: (raw.source || 'Bulk Excel Import') as any,
          receivedDate: 'Imported Today',
          status: 'New',
          latestRemark: (raw.notes || 'Imported via Bulk Excel / CSV Upload').trim(),
          fullRemark: (raw.notes || 'Candidate profile imported via Excel / CSV batch dispatch.').trim(),
          agent: raw.agent || 'Harshit (Reception Desk)',
          remarksHistory: [
            {
              id: `rem-${Date.now()}-${idx}`,
              outcome: 'Connected — Interested',
              text: raw.notes || 'Imported from Excel / CSV dataset',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              author: 'Super Admin Import',
              leadStatus: 'New',
            },
          ],
        };
      });

      const updated = [...newItems, ...diskLeads];
      writeLeadsToDisk(updated);

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
                  outcome: 'Connected — Interested',
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

    // 3. Single Lead Generation (from Super Admin or Reception Desk)
    let newLead: Lead;

    if (body.lead && body.lead.name && body.lead.mobile) {
      const raw = body.lead;
      const cleanPhone = (raw.mobile || '').replace(/\D/g, '').slice(-10);
      newLead = {
        ...raw,
        id: raw.id || `lead-rec-${Date.now().toString().slice(-6)}`,
        mobile: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : (raw.mobile || '').trim(),
        location: (raw.location || 'Front Desk Walk-in').trim(),
        targetCourse: raw.targetCourse || 'PCS-J Punjab Judicial Services',
        source: raw.source || 'Walk-in Desk',
        receivedDate: raw.receivedDate || 'Just now (Today)',
        status: raw.status || 'New',
        latestRemark: (raw.latestRemark || raw.notes || 'Inbound inquiry received at reception.').trim(),
        fullRemark: (raw.fullRemark || raw.notes || raw.latestRemark || 'Inbound inquiry received at reception.').trim(),
        agent: raw.agent || 'Harshit (Reception Desk)',
        remarksHistory: Array.isArray(raw.remarksHistory) && raw.remarksHistory.length > 0 ? raw.remarksHistory : [
          {
            id: `rem-${Date.now()}`,
            outcome: 'Connected — Interested',
            text: raw.notes || raw.latestRemark || 'Initial front desk entry',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: raw.agent || 'Reception Desk',
            leadStatus: raw.status || 'New',
          },
        ],
      };
    } else {
      const { name, mobile, location, targetCourse, source, notes, agent, id, receivedDate, status, remarksHistory } = body;

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

      const cleanPhone = mobile.replace(/\D/g, '').slice(-10);

      newLead = {
        id: id || `lead-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        mobile: cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : mobile.trim(),
        location: location?.trim() || 'Chandigarh / Mohali',
        targetCourse: targetCourse || 'PCS-J Punjab Judicial Services',
        source: (source || 'Super Admin (#2410)') as any,
        receivedDate: receivedDate || 'Just now (Today)',
        status: status || 'New',
        latestRemark: notes?.trim() || 'Inbound lead entered via Portal Console.',
        fullRemark: notes?.trim() || 'Inbound inquiry routed directly to Reception & Telecalling desk.',
        agent: agent || 'Harshit (Reception Desk)',
        remarksHistory: remarksHistory || [
          {
            id: `rem-${Date.now()}`,
            outcome: 'Connected — Interested',
            text: notes?.trim() || 'Generated via Portal Console',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: agent || 'Super Admin',
            leadStatus: status || 'New',
          },
        ],
      };
    }

    const leads = readLeadsFromDisk();
    const updated = [newLead, ...leads.filter((l) => l.id !== newLead.id)];
    writeLeadsToDisk(updated);

    return NextResponse.json({
      success: true,
      message: 'New lead successfully saved and dispatched to Reception Desk.',
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (Array.isArray(body.leads)) {
      writeLeadsToDisk(body.leads);
      return NextResponse.json({
        success: true,
        count: body.leads.length,
        leads: body.leads,
      });
    }
    return NextResponse.json({ success: false, message: 'Invalid leads array' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to sync leads' },
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

    const leads = readLeadsFromDisk();
    const index = leads.findIndex((l) => l.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: 'Lead not found.' },
        { status: 404 }
      );
    }

    leads[index] = { ...leads[index], ...updates };
    writeLeadsToDisk(leads);

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
      lead: leads[index],
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

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Lead ID is required.' },
        { status: 400 }
      );
    }

    const leads = readLeadsFromDisk();
    const filtered = leads.filter((l) => l.id !== id);

    if (filtered.length === leads.length) {
      return NextResponse.json(
        { success: false, message: 'Lead not found.' },
        { status: 404 }
      );
    }

    writeLeadsToDisk(filtered);

    return NextResponse.json({
      success: true,
      message: 'Lead removed successfully.',
      leads: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
