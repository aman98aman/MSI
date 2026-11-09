import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, isMongoConfigured } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export interface AdminTransaction {
  id: string;
  orderId: string;
  studentName: string;
  studentPhone?: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  paymentMethod: string;
  status: 'Captured (Test Mode)' | 'Success' | 'Failed' | 'Refunded' | string;
  timestamp: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  receiptNumber: string;
  razorpayOrderId?: string;
  invoiceData?: any;
}

const INITIAL_TRANSACTIONS: AdminTransaction[] = [];

const DATA_DIR = path.join(process.cwd(), 'data');
const TXN_FILE = path.join(DATA_DIR, 'transactions.json');

function readTransactionsFromDisk(): AdminTransaction[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (_) {}
    }
    if (fs.existsSync(TXN_FILE)) {
      const raw = fs.readFileSync(TXN_FILE, 'utf-8');
      if (raw && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
    try {
      fs.writeFileSync(TXN_FILE, JSON.stringify(INITIAL_TRANSACTIONS, null, 2), 'utf-8');
    } catch (_) {}
    return INITIAL_TRANSACTIONS;
  } catch (err) {
    console.error('[Transactions Read Error]', err);
    return INITIAL_TRANSACTIONS;
  }
}

function writeTransactionsToDisk(txns: AdminTransaction[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TXN_FILE, JSON.stringify(txns, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Transactions Write Error - Read Only FS on Vercel]:', err);
  }
}

async function getTransactionsAsync(): Promise<AdminTransaction[]> {
  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      if (db) {
        const col = db.collection<AdminTransaction>('transactions');
        const docs = await col.find({}).sort({ timestamp: -1 }).toArray();
        if (docs.length > 0) {
          return docs.map((d: any) => {
            const { _id, ...rest } = d;
            return rest as AdminTransaction;
          });
        }
      }
    } catch (err) {
      console.warn('[Transactions MongoDB Error]:', err);
    }
  }
  return readTransactionsFromDisk();
}

export async function GET() {
  const transactions = await getTransactionsAsync();
  return NextResponse.json({
    success: true,
    transactions,
    count: transactions.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      studentName,
      studentPhone,
      courseId,
      courseTitle,
      amount,
      paymentMethod,
      orderId,
      status,
      timestamp,
      razorpayPaymentId,
      razorpaySignature,
      receiptNumber,
      invoiceNo,
      invoiceData,
    } = body;

    const txns = readTransactionsFromDisk();
    const resolvedReceiptNo =
      receiptNumber || invoiceNo || invoiceData?.invoiceNo || `INV-MSI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTxn: AdminTransaction = {
      id: id || `#TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      orderId: orderId || `order_msi_${Date.now().toString().slice(-8)}`,
      studentName: studentName || invoiceData?.soldToName || 'Registered Student',
      studentPhone: studentPhone || invoiceData?.buyerPhone || '+91 98000 00000',
      courseId: courseId || 'course-default',
      courseTitle: courseTitle || invoiceData?.items?.[0]?.description || 'Judicial Studies Program',
      amount: Number(amount ?? invoiceData?.netAmount ?? 0) || 0,
      paymentMethod: paymentMethod || invoiceData?.modeOfSupply || 'Direct Institutional Fee Collection',
      status: status || 'Success',
      timestamp:
        timestamp ||
        new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      razorpayPaymentId: razorpayPaymentId || `pay_manual_${Date.now().toString().slice(-8)}`,
      razorpaySignature: razorpaySignature || `sig_${Math.random().toString(36).substring(2, 12)}`,
      receiptNumber: resolvedReceiptNo,
      invoiceData: invoiceData || undefined,
    };

    const updated = [newTxn, ...txns];
    writeTransactionsToDisk(updated);

    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          const { _id, ...cleanTxn }: any = newTxn;
          await db.collection('transactions').insertOne(cleanTxn);
        }
      } catch (err) {
        console.warn('[Transactions API] MongoDB insert error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction & invoice recorded successfully in audit ledger.',
      transaction: newTxn,
      transactions: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to record transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, receiptNumber, updates } = body;
    const targetKey = id || receiptNumber;

    if (!targetKey) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID or receiptNumber is required for updating.' },
        { status: 400 }
      );
    }

    const txns = readTransactionsFromDisk();
    const index = txns.findIndex((t) => t.id === targetKey || t.receiptNumber === targetKey);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: 'Transaction record not found in ledger.' },
        { status: 404 }
      );
    }

    const updatedTxn: AdminTransaction = {
      ...txns[index],
      ...updates,
      id: txns[index].id, // preserve primary ID
    };

    txns[index] = updatedTxn;
    writeTransactionsToDisk(txns);

    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          const { _id, ...cleanTxn }: any = updatedTxn;
          await db.collection('transactions').updateOne(
            { $or: [{ id: txns[index].id }, { receiptNumber: txns[index].receiptNumber }] },
            { $set: cleanTxn }
          );
        }
      } catch (err) {
        console.warn('[Transactions API] MongoDB update error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction & invoice updated successfully.',
      transaction: updatedTxn,
      transactions: txns,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let idsToDelete: string[] = [];
    if (id) {
      idsToDelete = [id];
    } else {
      try {
        const body = await req.json().catch(() => ({}));
        if (Array.isArray(body?.ids)) {
          idsToDelete = body.ids;
        } else if (body?.id) {
          idsToDelete = [body.id];
        }
      } catch (_) {}
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Transaction ID(s) required for deletion.' },
        { status: 400 }
      );
    }

    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        if (db) {
          await db.collection('transactions').deleteMany({
            $or: [
              { id: { $in: idsToDelete } },
              { receiptNumber: { $in: idsToDelete } },
            ],
          });
        }
      } catch (err) {
        console.warn('[Transactions API] MongoDB delete error:', err);
      }
    }

    const txns = readTransactionsFromDisk();
    const filtered = txns.filter(
      (t) => !idsToDelete.includes(t.id) && !idsToDelete.includes(t.receiptNumber)
    );
    writeTransactionsToDisk(filtered);

    return NextResponse.json({
      success: true,
      message: `${idsToDelete.length} transaction(s) deleted from ledger.`,
      transactions: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}
