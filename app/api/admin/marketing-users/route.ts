import { NextRequest, NextResponse } from 'next/server';
import {
  getMarketingUsersAsync,
  addMarketingUserAsync,
  updateMarketingUserAsync,
  deleteMarketingUserAsync,
  MarketingUserRecord,
} from '@/lib/marketingUserStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getMarketingUsersAsync();
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    console.error('Error fetching marketing users:', err);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch marketing staff' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, password, status, designation } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    const existingUsers = await getMarketingUsersAsync();
    const duplicate = existingUsers.find(
      (u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `Staff with mobile ${cleanPhone} already exists (${duplicate.name})` },
        { status: 409 }
      );
    }

    const created = await addMarketingUserAsync({
      name: String(name).trim(),
      phone: cleanPhone,
      email: email ? String(email).trim().toLowerCase() : `${cleanPhone}@msi-institutes.edu.in`,
      password: String(password).trim(),
      status: status === 'suspended' ? 'suspended' : 'active',
      designation: designation || 'Marketing Executive',
    });

    const updatedList = await getMarketingUsersAsync();
    return NextResponse.json({
      success: true,
      user: created,
      users: updatedList,
      message: `Marketing member ${created.name} added successfully!`,
    });
  } catch (err: any) {
    console.error('Error adding marketing staff:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to create marketing user' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, email, password, status, designation } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required for update' },
        { status: 400 }
      );
    }

    const updates: Partial<MarketingUserRecord> = {};
    if (name) updates.name = String(name).trim();
    if (phone) updates.phone = String(phone).replace(/\D/g, '').slice(-10);
    if (email) updates.email = String(email).trim().toLowerCase();
    if (password) updates.password = String(password).trim();
    if (status) updates.status = status;
    if (designation) updates.designation = String(designation).trim();

    const updated = await updateMarketingUserAsync(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Marketing user not found' },
        { status: 404 }
      );
    }

    const updatedList = await getMarketingUsersAsync();
    return NextResponse.json({
      success: true,
      user: updated,
      users: updatedList,
      message: 'Marketing user credentials updated successfully',
    });
  } catch (err: any) {
    console.error('Error updating marketing user:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to update marketing user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryId = url.searchParams.get('id');

    let body: any = {};
    try {
      body = await req.json();
    } catch (_) {}

    const idsToDelete: string[] = [];
    if (queryId) idsToDelete.push(queryId);
    if (body.id) idsToDelete.push(body.id);
    if (Array.isArray(body.ids)) {
      body.ids.forEach((i: any) => {
        if (typeof i === 'string') idsToDelete.push(i);
        else if (i?.id) idsToDelete.push(i.id);
        else if (i?.phone) idsToDelete.push(i.phone);
      });
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No user ID(s) provided for deletion' },
        { status: 400 }
      );
    }

    for (const identifier of idsToDelete) {
      await deleteMarketingUserAsync(identifier);
    }

    const updatedList = await getMarketingUsersAsync();
    return NextResponse.json({
      success: true,
      deletedCount: idsToDelete.length,
      users: updatedList,
      message: `${idsToDelete.length} marketing member(s) removed successfully`,
    });
  } catch (err: any) {
    console.error('Error deleting marketing user:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to delete marketing staff' },
      { status: 500 }
    );
  }
}

