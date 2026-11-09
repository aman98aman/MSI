import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';
import { Lead } from '@/components/reception/data/leadsMockData';
import { getReceptionistsAsync } from '@/lib/receptionistStore';

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

export async function GET() {
  try {
    let leads: Lead[] = [];

    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          const docs = await db.collection('leads').find({}).sort({ receivedDate: -1 }).toArray();
          leads = docs.map((d: any) => {
            const { _id, ...clean } = d;
            return clean as Lead;
          });
        }
      } catch (err) {
        console.warn('Mongo read failed in marketing stats:', err);
      }
    }

    if (!leads || leads.length === 0) {
      leads = readLeads();
    }

    const receptionists = await getReceptionistsAsync();

    // Map receptionists to performance metrics
    const receptionistStats = receptionists.map((rec) => {
      const recPhone = rec.phone.replace(/\D/g, '').slice(-10);
      const recNameClean = rec.name.toLowerCase().trim();

      const assignedLeads = leads.filter((l) => {
        if (!l.agent) return false;
        const agClean = l.agent.toLowerCase().trim();
        const assignedTo = (l.assignedTo || '').toLowerCase().trim();
        return (
          agClean.includes(recNameClean) ||
          recNameClean.includes(agClean) ||
          assignedTo === rec.id.toLowerCase() ||
          assignedTo === recPhone
        );
      });

      const totalAssigned = assignedLeads.length;

      // A lead is "Contacted" if remarksHistory has at least 1 entry OR status is not 'New'
      const contactedLeads = assignedLeads.filter((l) => {
        const hasRemarks = Array.isArray(l.remarksHistory) && l.remarksHistory.length > 0;
        const hasUpdatedStatus = l.status && l.status !== 'New';
        return hasRemarks || hasUpdatedStatus;
      });

      const contactedCount = contactedLeads.length;
      const pendingCount = Math.max(0, totalAssigned - contactedCount);
      const convertedCount = assignedLeads.filter((l) => l.status === 'Converted').length;
      const contactedPercentage =
        totalAssigned > 0 ? Math.round((contactedCount / totalAssigned) * 100) : 0;

      return {
        id: rec.id,
        name: rec.name,
        phone: rec.phone,
        email: rec.email,
        status: rec.status,
        totalAssigned,
        contactedCount,
        pendingCount,
        convertedCount,
        contactedPercentage,
        leads: assignedLeads,
      };
    });

    const totalLeads = leads.length;
    const unassignedLeads = leads.filter(
      (l) => !l.agent || l.agent === 'Unassigned' || l.agent === 'System / Unassigned'
    ).length;

    const totalAssignedAcrossAll = totalLeads - unassignedLeads;
    const totalContactedAcrossAll = leads.filter((l) => {
      const hasRemarks = Array.isArray(l.remarksHistory) && l.remarksHistory.length > 0;
      const hasUpdatedStatus = l.status && l.status !== 'New';
      return hasRemarks || hasUpdatedStatus;
    }).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalAssigned: totalAssignedAcrossAll,
        totalUnassigned: unassignedLeads,
        totalContacted: totalContactedAcrossAll,
        overallPercentage:
          totalAssignedAcrossAll > 0
            ? Math.round((totalContactedAcrossAll / totalAssignedAcrossAll) * 100)
            : 0,
      },
      receptionistStats,
    });
  } catch (err: any) {
    console.error('Error computing marketing stats:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to compute marketing statistics' },
      { status: 500 }
    );
  }
}

