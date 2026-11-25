import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminSession,
} from '@/lib/examAuth';
import { sanitizeIndianPhone } from '@/lib/smsService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    actorId: session.actorId,
    actorName: session.actorName,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = String(body.identifier || body.phoneOrEmail || '').trim();
    const password = String(body.password || '').trim();
    const cleanPhone = sanitizeIndianPhone(identifier);

    const isValidIdentifier =
      cleanPhone === '9792303434' ||
      identifier.toLowerCase() === 'admin@msi-institutes.edu.in';

    const isValidPassword =
      password === 'MSI@superadmin' ||
      password.toLowerCase() === 'msi@superadmin';

    if (!isValidIdentifier || !isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid Super Admin credentials.' },
        { status: 401 }
      );
    }

    const token = createAdminSessionToken('super-admin-01', 'MSI Administrator');
    const res = NextResponse.json({
      success: true,
      actorId: 'super-admin-01',
      actorName: 'MSI Administrator',
    });

    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 12 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to establish admin session.' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
