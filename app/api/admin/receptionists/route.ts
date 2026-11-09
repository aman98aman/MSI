import { NextRequest, NextResponse } from 'next/server';
import {
  getReceptionistsAsync,
  addReceptionistAsync,
  deleteReceptionistAsync,
} from '@/lib/receptionistStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const receptionists = await getReceptionistsAsync();
    return NextResponse.json({
      success: true,
      receptionists,
      count: receptionists.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to read receptionists' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, email, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Receptionist name is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    const result = await addReceptionistAsync({
      id: id?.trim(),
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      password: password?.trim() || 'Harshit@reception',
    });

    return NextResponse.json({
      success: true,
      receptionist: result.receptionist,
      message: `Receptionist ${result.receptionist.name} successfully registered with login clearance.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save receptionist' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    let idsToDelete: string[] = [];
    if (id) {
      idsToDelete = [id.trim()];
    } else {
      try {
        const body = await req.json().catch(() => ({}));
        if (Array.isArray(body?.ids)) {
          idsToDelete = body.ids.filter((x: any) => typeof x === 'string' && x.trim()).map((x: string) => x.trim());
        } else if (body?.id || body?.email || body?.phone) {
          idsToDelete = [String(body.id || body.email || body.phone).trim()];
        }
      } catch (_) {}
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Receptionist ID, mobile number, or email required for deletion.' },
        { status: 400 }
      );
    }

    let lastResult: any = null;
    for (const targetId of idsToDelete) {
      lastResult = await deleteReceptionistAsync(targetId);
    }

    const remaining = lastResult ? lastResult.remainingReceptionists : await getReceptionistsAsync();

    return NextResponse.json({
      success: true,
      message: `${idsToDelete.length} receptionist(s) deleted successfully.`,
      receptionists: remaining,
      count: remaining.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Error deleting receptionist' },
      { status: 500 }
    );
  }
}
