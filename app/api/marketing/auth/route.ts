import { NextRequest, NextResponse } from 'next/server';
import { getMarketingUsersAsync } from '@/lib/marketingUserStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, email, password } = body;

    const identifier = (phone || email || '').trim();
    const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
    const cleanEmail = identifier.toLowerCase();
    const pwd = (password || '').trim();

    if (!identifier || !pwd) {
      return NextResponse.json(
        { success: false, message: 'Please provide phone/email and password' },
        { status: 400 }
      );
    }

    const users = await getMarketingUsersAsync();
    const user = users.find((u) => {
      const uPhone = u.phone.replace(/\D/g, '').slice(-10);
      const uEmail = (u.email || '').toLowerCase().trim();
      return (
        (uPhone === cleanPhone || uEmail === cleanEmail) &&
        u.status !== 'suspended'
      );
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials or account suspended' },
        { status: 401 }
      );
    }

    if (user.password !== pwd) {
      return NextResponse.json(
        { success: false, message: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Return safe user info
    const safeUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: 'marketing',
      designation: user.designation,
    };

    const res = NextResponse.json({
      success: true,
      user: safeUser,
      message: `Welcome back, ${user.name}!`,
    });

    // Set cookie for session
    res.cookies.set('msi_marketing_session', JSON.stringify(safeUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Marketing auth error:', err);
    return NextResponse.json(
      { success: false, message: 'Authentication failed due to server error' },
      { status: 500 }
    );
  }
}

