import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from './mongodb';

export interface MarketingUserRecord {
  id: string;
  name: string;
  phone: string; // 10-digit Indian phone number
  email: string;
  password: string;
  status: 'active' | 'suspended';
  createdAt: string;
  role: 'marketing';
  designation?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const MARKETING_FILE = path.join(DATA_DIR, 'marketing_users.json');
const DELETED_MARKETING_FILE = path.join(DATA_DIR, 'deleted_marketing_users.json');

const SEED_MARKETING_USERS: MarketingUserRecord[] = [
  {
    id: 'mkt-neha-01',
    name: 'Neha Sharma (Marketing Lead)',
    phone: '9888877771',
    email: 'marketing@msi-institutes.edu.in',
    password: 'Marketing@MSI2026',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    role: 'marketing',
    designation: 'Growth & Outreach Manager',
  },
];

export function readDeletedMarketingUsersFromDisk(): string[] {
  try {
    if (fs.existsSync(DELETED_MARKETING_FILE)) {
      const raw = fs.readFileSync(DELETED_MARKETING_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).toLowerCase().trim());
        }
      }
    }
    return [];
  } catch (err) {
    console.warn('[MarketingStore] Error reading deleted list:', err);
    return [];
  }
}

export function markMarketingUserDeletedOnDisk(identifier: string): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = readDeletedMarketingUsersFromDisk();
    const clean = identifier.toLowerCase().trim();
    if (!current.includes(clean)) {
      current.push(clean);
      fs.writeFileSync(DELETED_MARKETING_FILE, JSON.stringify(current, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[MarketingStore] Error saving deleted identifier:', err);
  }
}

export function readMarketingUsersFromDisk(): MarketingUserRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const deletedIds = readDeletedMarketingUsersFromDisk();

    if (fs.existsSync(MARKETING_FILE)) {
      const raw = fs.readFileSync(MARKETING_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed: MarketingUserRecord[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (u) =>
              !deletedIds.includes(u.id.toLowerCase().trim()) &&
              !deletedIds.includes(u.phone.replace(/\D/g, '').slice(-10))
          );
        }
      }
    }

    const initial = SEED_MARKETING_USERS.filter(
      (u) =>
        !deletedIds.includes(u.id.toLowerCase().trim()) &&
        !deletedIds.includes(u.phone.replace(/\D/g, '').slice(-10))
    );
    fs.writeFileSync(MARKETING_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  } catch (err) {
    console.error('[MarketingStore] Error reading from disk:', err);
    return [];
  }
}

export function writeMarketingUsersToDisk(users: MarketingUserRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MARKETING_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[MarketingStore] Error writing to disk:', err);
  }
}

export async function getMarketingUsersAsync(): Promise<MarketingUserRecord[]> {
  const diskUsers = readMarketingUsersFromDisk();
  const deletedIds = readDeletedMarketingUsersFromDisk();

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      const mongoDocs = await db.collection('marketing_users').find({}).toArray();

      if (mongoDocs && mongoDocs.length > 0) {
        const mapped: MarketingUserRecord[] = mongoDocs.map((doc: any) => ({
          id: doc.id || doc._id?.toString() || `mkt-${Date.now()}`,
          name: doc.name || 'Marketing Executive',
          phone: doc.phone || '',
          email: doc.email || '',
          password: doc.password || '',
          status: doc.status || 'active',
          createdAt: doc.createdAt || new Date().toISOString(),
          role: 'marketing',
          designation: doc.designation || 'Marketing Executive',
        }));

        const activeMongo = mapped.filter(
          (u) =>
            !deletedIds.includes(u.id.toLowerCase().trim()) &&
            !deletedIds.includes(u.phone.replace(/\D/g, '').slice(-10))
        );

        writeMarketingUsersToDisk(activeMongo);
        return activeMongo;
      }
    } catch (err) {
      console.warn('[MarketingStore] Mongo read failed, falling back to disk:', err);
    }
  }

  return diskUsers;
}

export async function addMarketingUserAsync(
  record: Omit<MarketingUserRecord, 'id' | 'createdAt' | 'role'>
): Promise<MarketingUserRecord> {
  const cleanPhone = record.phone.replace(/\D/g, '').slice(-10);
  const newRecord: MarketingUserRecord = {
    id: `mkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: record.name.trim(),
    phone: cleanPhone,
    email: record.email.trim().toLowerCase(),
    password: record.password,
    status: record.status || 'active',
    createdAt: new Date().toISOString(),
    role: 'marketing',
    designation: record.designation?.trim() || 'Marketing Executive',
  };

  const users = readMarketingUsersFromDisk();
  const updated = [newRecord, ...users.filter((u) => u.phone !== cleanPhone)];
  writeMarketingUsersToDisk(updated);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('marketing_users').updateOne(
        { phone: cleanPhone },
        { $set: newRecord },
        { upsert: true }
      );
    } catch (err) {
      console.warn('[MarketingStore] Mongo insert failed:', err);
    }
  }

  return newRecord;
}

export async function updateMarketingUserAsync(
  id: string,
  updates: Partial<MarketingUserRecord>
): Promise<MarketingUserRecord | null> {
  const users = readMarketingUsersFromDisk();
  const idx = users.findIndex((u) => u.id === id || u.phone === id);
  if (idx === -1) return null;

  const current = users[idx];
  const updated: MarketingUserRecord = {
    ...current,
    ...updates,
    id: current.id,
    role: 'marketing',
  };

  users[idx] = updated;
  writeMarketingUsersToDisk(users);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('marketing_users').updateOne(
        { $or: [{ id }, { phone: current.phone }] },
        { $set: updated }
      );
    } catch (err) {
      console.warn('[MarketingStore] Mongo update failed:', err);
    }
  }

  return updated;
}

export async function deleteMarketingUserAsync(identifier: string): Promise<boolean> {
  const clean = identifier.toLowerCase().trim();
  const cleanPhone = identifier.replace(/\D/g, '').slice(-10);

  markMarketingUserDeletedOnDisk(identifier);
  if (cleanPhone) markMarketingUserDeletedOnDisk(cleanPhone);

  const users = readMarketingUsersFromDisk();
  const filtered = users.filter((u) => {
    const uPhone = u.phone.replace(/\D/g, '').slice(-10);
    const uId = u.id.toLowerCase().trim();
    return uId !== clean && uPhone !== cleanPhone && uPhone !== clean;
  });
  writeMarketingUsersToDisk(filtered);

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection('marketing_users').deleteMany({
        $or: [
          { id: identifier },
          { id: clean },
          { phone: cleanPhone },
          { phone: identifier },
        ],
      });
    } catch (err) {
      console.warn('[MarketingStore] Mongo delete failed:', err);
    }
  }

  return true;
}

